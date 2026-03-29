import { db } from "../db";
import { emailVerifications, loginAttempts } from "../db/schema";
import { eq, and, gte, count } from "drizzle-orm";
import { NextRequest } from "next/server";
import { ApiResponse } from "../utils/api-response";

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
          gte(emailVerifications.createdAt, windowStart),
        ),
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
            gte(emailVerifications.createdAt, windowStart),
          ),
        )
        .orderBy(emailVerifications.createdAt)
        .limit(1);

      const retryAfter = oldestRequest[0]
        ? new Date(
            oldestRequest[0].createdAt.getTime() +
              this.WINDOW_MINUTES * 60 * 1000,
          )
        : new Date(Date.now() + this.WINDOW_MINUTES * 60 * 1000);

      return { isLimited, retryAfter, requestCount };
    }

    return { isLimited: false, requestCount };
  }

  static async isRateLimited(ipAddress: string): Promise<boolean> {
    if (process.env.NODE_ENV === "development") {
      return false;
    }
    const startTime = new Date(Date.now() - this.WINDOW_MS);

    const [result] = await db
      .select({ value: count() })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.ipAddress, ipAddress),
          eq(loginAttempts.success, false),
          gte(loginAttempts.createdAt, startTime),
        ),
      );

    return (result?.value || 0) >= this.MAX_ATTEMPTS;
  }

  private static readonly kybRateLimits = new Map<string, { count: number; resetTime: number }>();
  private static readonly KYB_MAX_REQUESTS = 10;
  private static readonly KYB_WINDOW_MS = 60 * 1000; // 1 minute for rapid testing

  static async isKybRateLimited(identifier: string): Promise<boolean> {
    const now = Date.now();
    const limitData = this.kybRateLimits.get(identifier);

    if (!limitData || limitData.resetTime < now) {
      this.kybRateLimits.set(identifier, {
        count: 1,
        resetTime: now + this.KYB_WINDOW_MS,
      });
      return false;
    }

    if (limitData.count >= this.KYB_MAX_REQUESTS) {
      return true;
    }

    limitData.count++;
    return false;
  }
}

export function withKybRateLimit(
  handler: (req: NextRequest, ...args: unknown[]) => Promise<Response>,
) {
  return async (req: NextRequest, ...args: unknown[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let identifier = req.headers.get("x-forwarded-for") || (req as any).ip;
    
    // Fallback if IP is not available
    if (!identifier) {
      const token =
        req.cookies.get("access_token")?.value ??
        req.headers.get("authorization")?.replace("Bearer ", "");
      identifier = token ? `token-${token.substring(0, 10)}` : "unknown-ip";
    }

    const isLimited = await RateLimitService.isKybRateLimited(identifier);
    if (isLimited) {
      return ApiResponse.error("Too many requests", 429);
    }
    
    return handler(req, ...args);
  };
}
