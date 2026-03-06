import { db } from "../db";
import { loginAttempts } from "../db/schema";

export class LoginAttemptService {
  static async logAttempt(data: {
    email: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    failureReason?: string;
  }) {
    await db.insert(loginAttempts).values({
      email: data.email,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      success: data.success,
      failureReason: data.failureReason,
    });
  }
}
