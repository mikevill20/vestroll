import { db, emailVerifications, users } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { OTPService } from "./otp.service";
import { UserService } from "./user.service";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/errors";
import { Logger } from "./logger.service";

const MAX_VERIFICATION_ATTEMPTS = 5;
export const OTP_EXPIRATION_MINUTES = 15;

export interface VerifyEmailResult {
  success: true;
  message: string;
  user: {
    id: string;
    email: string;
    status: string;
  };
}

export class EmailVerificationService {
  
  static async verifyEmail(email: string, otp: string): Promise<VerifyEmailResult> {

    function maskEmail(email: string): string {
      const [name, domain] = email.split("@");
      const maskedName = name.length > 1 ? name[0] + "***" : "*";
      const [domainName, ...domainParts] = domain.split(".");
      const maskedDomain = domainName.length > 1 ? domainName[0] + "***" : "*";
      return `${maskedName}@${maskedDomain}.${domainParts.join(".")}`;
    }

    const user = await UserService.findByEmail(email);
    if (!user) {
      const maskedEmail = maskEmail(email);
      Logger.warn("Email verification attempt for non-existent user", { email: maskedEmail });
      throw new NotFoundError("User not found");
    }

    if (user.status === "active") {
      throw new BadRequestError("Email is already verified");
    }

    const [verificationRecord] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.userId, user.id),
          eq(emailVerifications.verified, false)
        )
      )
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);

    if (!verificationRecord) {
      throw new NotFoundError("No pending verification found for this email");
    }

    if (verificationRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      Logger.warn("Account locked due to max verification attempts exceeded", { userId: user.id });
      throw new ForbiddenError(
        "Account locked due to too many failed verification attempts. Please request a new verification code."
      );
    }

    const now = new Date();
    if (verificationRecord.expiresAt < now) {
      Logger.warn("OTP verification attempt with expired code", { userId: user.id });
      throw new BadRequestError(
        "Verification code has expired. Please request a new one."
      );
    }

    const isValidOTP = await OTPService.verifyOTP(otp, verificationRecord.otpHash);

    if (!isValidOTP) {
      const newAttempts = verificationRecord.attempts + 1;
      await db
        .update(emailVerifications)
        .set({ attempts: newAttempts })
        .where(eq(emailVerifications.id, verificationRecord.id));

      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - newAttempts;

      Logger.warn("Invalid OTP attempt", { userId: user.id, attempts: newAttempts, maxAttempts: MAX_VERIFICATION_ATTEMPTS });

      if (remainingAttempts <= 0) {
        throw new ForbiddenError(
          "Account locked due to too many failed verification attempts. Please request a new verification code."
        );
      }

      throw new BadRequestError(
        `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`,
        { remainingAttempts }
      );
    }

    return await db.transaction(async (tx) => {
      await tx
        .update(emailVerifications)
        .set({ verified: true })
        .where(eq(emailVerifications.id, verificationRecord.id));

      await tx
        .update(users)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(users.id, user.id));

      Logger.info("Email verification completed successfully", { userId: user.id, email: user.email });

      return {
        success: true as const,
        message: "Email verified successfully",
        user: {
          id: user.id,
          email: user.email,
          status: "active",
        },
      };
    });
  }

  static async getVerificationStatus(userId: string) {
    const [record] = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.userId, userId))
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);

    return record || null;
  }
}
