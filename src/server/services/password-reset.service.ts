import crypto from "crypto";
import { db, passwordResets, users } from "../db";
import { eq } from "drizzle-orm";
import { UserService } from "./user.service";
import { PasswordVerificationService } from "./password-verification.service";
import { EmailService } from "./email.service";
import { BadRequestError } from "../utils/errors";
import { Logger } from "./logger.service";

const TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

export class PasswordResetService {
  private static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  static async requestPasswordReset(email: string): Promise<void> {
    const user = await UserService.findByEmail(email);

    if (!user) {
      Logger.info("Password reset requested for unknown email", { email });
      return;
    }

    await db.delete(passwordResets).where(eq(passwordResets.userId, user.id));

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS);

    await db.insert(passwordResets).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    await EmailService.sendPasswordResetEmail(user.email, user.firstName, resetLink);

    Logger.info("Password reset email sent", { userId: user.id, email: user.email });
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(token);

    const [resetRecord] = await db
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.tokenHash, tokenHash))
      .limit(1);

    if (!resetRecord) {
      throw new BadRequestError("Invalid or expired reset token");
    }

    if (resetRecord.expiresAt < new Date()) {
      await db.delete(passwordResets).where(eq(passwordResets.id, resetRecord.id));
      throw new BadRequestError("Reset token has expired. Please request a new one.");
    }

    const passwordHash = await PasswordVerificationService.hash(newPassword);

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, resetRecord.userId));

      await tx
        .delete(passwordResets)
        .where(eq(passwordResets.id, resetRecord.id));
    });

    Logger.info("Password reset successfully completed", { userId: resetRecord.userId });
  }
}
