import { db, emailVerifications, users } from "../db";
import crypto from "crypto";
import { OTP_EXPIRATION_MINUTES } from "./email-verification.service";
import { UserService } from "./user.service";
import { OTPService } from "./otp.service";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  TooManyRequestsError,
} from "../utils/errors";
import { PasswordVerificationService } from "./password-verification.service";
import { JWTTokenService } from "./jwt-token.service";
import { SessionManagementService } from "./session-management.service";
import { AccountLockoutService } from "./account-lockout.service";
import { RateLimitService } from "./rate-limit.service";
import { LoginAttemptService } from "./login-attempt.service";
import { eq } from "drizzle-orm";
import { LoginInput } from "../validations/login.schema";

export class AuthService {
  static async register(data: {
    firstName: string;
    lastName: string;
    email: string;
  }) {
    const existingUser = await UserService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("Email already exists");
    }

    return await db.transaction(async (tx) => {
      const user = await UserService.create(data);

      const otp = OTPService.generateOTP();
      const otpHash = await OTPService.hashOTP(otp);

      const expiresAt = new Date(
        Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000,
      );
      await tx.insert(emailVerifications).values({
        userId: user.id,
        otpHash,
        expiresAt,
      });

      console.log(`[Email Mock] Sending OTP ${otp} to ${data.email} `);

      return {
        userId: user.id,
        email: user.email,
        message: "Verification email sent",
      };
    });
  }

  static async login(
    data: LoginInput,
    metadata: { ipAddress?: string; userAgent?: string },
  ) {
    const { email, password, rememberMe } = data;

    if (
      metadata.ipAddress &&
      (await RateLimitService.isRateLimited(metadata.ipAddress))
    ) {
      await LoginAttemptService.logAttempt({
        email,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        success: false,
        failureReason: "Rate limit exceeded",
      });
      throw new TooManyRequestsError(
        "Too many login attempts. Please try again in 15 minutes.",
      );
    }

    const user = await UserService.findByEmail(email);
    if (!user) {
      await LoginAttemptService.logAttempt({
        email,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        success: false,
        failureReason: "User not found",
      });
      throw new UnauthorizedError("Invalid email or password");
    }

    if (AccountLockoutService.isLocked(user)) {
      const unlockTime = user.lockedUntil?.toLocaleTimeString() || "later";
      await LoginAttemptService.logAttempt({
        email,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        success: false,
        failureReason: "Account locked",
      });
      throw new ForbiddenError(
        `Account is temporarily locked.Try again after ${unlockTime} `,
      );
    }

    if (user.status !== "active") {
      await LoginAttemptService.logAttempt({
        email,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        success: false,
        failureReason: "Unverified account",
      });
      throw new ForbiddenError(
        "Account verification pending. Please check your email.",
      );
    }

    const isPasswordValid = await PasswordVerificationService.verify(
      password,
      user.passwordHash || "",
    );
    if (!isPasswordValid) {
      await AccountLockoutService.incrementFailures(user.id);
      await LoginAttemptService.logAttempt({
        email,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        success: false,
        failureReason: "Invalid password",
      });
      throw new UnauthorizedError("Invalid email or password");
    }

    await AccountLockoutService.resetFailures(user.id);

    const sessionId = crypto.randomUUID();

    const accessToken = await JWTTokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = await JWTTokenService.generateRefreshToken(
      {
        userId: user.id,
        email: user.email,
        sessionId,
      },
      rememberMe,
    );

    const expiresAt = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
    );
    await SessionManagementService.createSession(
      user.id,
      refreshToken,
      metadata.userAgent,
      expiresAt,
      sessionId,
    );

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    await LoginAttemptService.logAttempt({
      email,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      success: true,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  static async changePassword(
    userId: string,
    currentPasswordHash: string | null,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!currentPasswordHash) {
      throw new BadRequestError(
        "No password set for this account. Password change is not available for OAuth-only accounts.",
      );
    }

    const isCurrentValid = await PasswordVerificationService.verify(
      currentPassword,
      currentPasswordHash,
    );
    if (!isCurrentValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    const isSamePassword = await PasswordVerificationService.verify(
      newPassword,
      currentPasswordHash,
    );
    if (isSamePassword) {
      throw new BadRequestError(
        "New password must be different from current password",
      );
    }

    const newPasswordHash = await PasswordVerificationService.hash(newPassword);

    await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}
