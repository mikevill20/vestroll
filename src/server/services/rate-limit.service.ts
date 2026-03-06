import { db } from "../db";
import { emailVerifications, loginAttempts } from "../db/schema";
import { eq, and, gte, count } from "drizzle-orm";

export class RateLimitService {

  private static readonly MAX_REQUESTS = 3;
  private static readonly WINDOW_MINUTES = 5;

  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000;

  static async checkResendLimit(userId: string): Promise<{
    isLimited: boolean;
    retryAfter?: Date;
    requestCount: number;
  }> {
    const windowStart = new Date(Date.now() - this.WINDOW_MINUTES * 60 * 1000);

    const recentAttempts = await db
      .select({ count: count() })
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.userId, userId),
          gte(emailVerifications.createdAt, windowStart)
        )
      );

    const requestCount = recentAttempts[0]?.count || 0;
    const isLimited = requestCount >= this.MAX_REQUESTS;

    if (isLimited) {

      const oldestRequest = await db
        .select({ createdAt: emailVerifications.createdAt })
        .from(emailVerifications)
        .where(
          and(
            eq(emailVerifications.userId, userId),
            gte(emailVerifications.createdAt, windowStart)
          )
        )
        .orderBy(emailVerifications.createdAt)
        .limit(1);

      const retryAfter = oldestRequest[0]
        ? new Date(
            oldestRequest[0].createdAt.getTime() +
              this.WINDOW_MINUTES * 60 * 1000
          )
        : new Date(Date.now() + this.WINDOW_MINUTES * 60 * 1000);

      return { isLimited, retryAfter, requestCount };
    }

    return { isLimited: false, requestCount };
  }

  static async isRateLimited(ipAddress: string): Promise<boolean> {
    const startTime = new Date(Date.now() - this.WINDOW_MS);

    const [result] = await db
      .select({ value: count() })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.ipAddress, ipAddress),
          eq(loginAttempts.success, false),
          gte(loginAttempts.createdAt, startTime)
        )
      );

    return (result?.value || 0) >= this.MAX_ATTEMPTS;
  }
}
