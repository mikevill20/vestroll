import { db } from "../db";
import { emailVerifications } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { OTPService } from "./otp.service";
import { UserService } from "./user.service";
import { RateLimitService } from "./rate-limit.service";
import {
  NotFoundError,
  BadRequestError,
  TooManyRequestsError,
} from "../utils/errors";
import { Logger } from "./logger.service";

export class OTPResendService {
  private static readonly OTP_EXPIRATION_MINUTES = 15;

  static async resendOTP(email: string): Promise<{
    message: string;
    email: string;
    userId: string;
  }> {

    const user = await UserService.findByEmail(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.status !== "pending_verification") {
      throw new BadRequestError("User is already verified");
    }

    const rateLimitResult = await RateLimitService.checkResendLimit(user.id);
    if (rateLimitResult.isLimited) {
      const retryAfterSeconds = rateLimitResult.retryAfter
        ? Math.ceil(
            (rateLimitResult.retryAfter.getTime() - Date.now()) / 1000
          )
        : 300;

      throw new TooManyRequestsError(
        "Too many OTP requests. Please try again later.",
        retryAfterSeconds
      );
    }

    return await db.transaction(async (tx) => {

      await tx
        .update(emailVerifications)
        .set({ verified: false })
        .where(
          and(
            eq(emailVerifications.userId, user.id),
            eq(emailVerifications.verified, false)
          )
        );

      const otp = OTPService.generateOTP();
      const otpHash = await OTPService.hashOTP(otp);

      const expiresAt = new Date(
        Date.now() + this.OTP_EXPIRATION_MINUTES * 60 * 1000
      );
      await tx.insert(emailVerifications).values({
        userId: user.id,
        otpHash,
        expiresAt,
        attempts: 0,
      });

      Logger.info("OTP resent successfully", { email, userId: user.id });

      return {
        message: "Verification code resent",
        email: user.email,
        userId: user.id,
      };
    });
  }
}
