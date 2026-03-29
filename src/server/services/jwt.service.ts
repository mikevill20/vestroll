import * as jose from "jose";
import { InvalidTokenError, TokenExpiredError } from "../utils/errors";

export interface JWTPayload extends jose.JWTPayload {
  userId: string;
  email: string;
}

export class JWTService {
  private static get ACCESS_SECRET() {
    return new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || "");
  }
  private static get REFRESH_SECRET() {
    return new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || "");
  }
  private static get ACCESS_EXPIRATION() {
    return process.env.JWT_ACCESS_EXPIRATION || "15m";
  }
  private static get REFRESH_EXPIRATION() {
    return process.env.JWT_REFRESH_EXPIRATION || "7d";
  }

  static async generateAccessToken(payload: JWTPayload): Promise<string> {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(this.ACCESS_EXPIRATION)
      .sign(this.ACCESS_SECRET);
  }

  static async generateRefreshToken(payload: JWTPayload): Promise<string> {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is not configured");
    }

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(this.REFRESH_EXPIRATION)
      .sign(this.REFRESH_SECRET);
  }

  static async verifyAccessToken(token: string): Promise<JWTPayload> {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    try {
      const { payload } = await jose.jwtVerify(token, this.ACCESS_SECRET);
      return payload as JWTPayload;
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        throw new TokenExpiredError("Access token has expired");
      }
      throw new InvalidTokenError("Invalid access token");
    }
  }

  static async verifyRefreshToken(token: string): Promise<JWTPayload> {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is not configured");
    }

    try {
      const { payload } = await jose.jwtVerify(token, this.REFRESH_SECRET);
      return payload as JWTPayload;
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        throw new TokenExpiredError("Refresh token has expired");
      }
      throw new InvalidTokenError("Invalid refresh token");
    }
  }

  // Synchronous versions for non-async contexts if needed,
  // though jose is primarily async.
  // In Middleware it MUST be async.
}
