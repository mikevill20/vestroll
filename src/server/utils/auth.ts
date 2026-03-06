import { NextRequest } from "next/server";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { UnauthorizedError } from "./errors";
import crypto from "crypto";

interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class AuthUtils {
  private static readonly SECRET = process.env.JWT_SECRET || "vestroll-secret-key";
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

  static generateToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      iat: Date.now(),
      exp: Date.now() + this.TOKEN_EXPIRY,
    };

    const payloadString = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", this.SECRET)
      .update(payloadString)
      .digest("base64url");

    return `${payloadString}.${signature}`;
  }

  static verifyToken(token: string): TokenPayload | null {
    try {
      const [payloadString, signature] = token.split(".");

      if (!payloadString || !signature) {
        return null;
      }

      const expectedSignature = crypto
        .createHmac("sha256", this.SECRET)
        .update(payloadString)
        .digest("base64url");

      if (signature !== expectedSignature) {
        return null;
      }

      const payload: TokenPayload = JSON.parse(
        Buffer.from(payloadString, "base64url").toString()
      );

      if (payload.exp < Date.now()) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  static extractToken(request: NextRequest): string | null {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return null;
    }

    if (authHeader.startsWith("Bearer ")) {
      return authHeader.slice(7);
    }

    return null;
  }

  static async authenticateRequest(request: NextRequest): Promise<{
    userId: string;
    email: string;
    user: typeof users.$inferSelect;
  }> {
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedError("Authentication required");
    }

    const payload = this.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId));

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (user.status === "suspended") {
      throw new UnauthorizedError("Account is suspended");
    }

    return {
      userId: payload.userId,
      email: payload.email,
      user,
    };
  }

  static getClientIp(request: NextRequest): string | undefined {

    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
      return realIp;
    }

    return undefined;
  }

  static getUserAgent(request: NextRequest): string | undefined {
    return request.headers.get("user-agent") || undefined;
  }
}
