import jwt, {
  SignOptions,
  JwtPayload,
  TokenExpiredError as JWTTokenExpiredError,
} from "jsonwebtoken";
import { InvalidTokenError, TokenExpiredError } from "../utils/errors";

export interface JWTPayload extends JwtPayload {
  userId: string;
  email: string;
}

export class JWTService {
  private static get ACCESS_SECRET() {
    return process.env.JWT_ACCESS_SECRET || "";
  }
  private static get REFRESH_SECRET() {
    return process.env.JWT_REFRESH_SECRET || "";
  }
  private static get ACCESS_EXPIRATION() {
    return process.env.JWT_ACCESS_EXPIRATION || "15m";
  }
  private static get REFRESH_EXPIRATION() {
    return process.env.JWT_REFRESH_EXPIRATION || "7d";
  }

  static generateAccessToken(payload: JWTPayload): string {
    if (!this.ACCESS_SECRET) {
      throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    const options: SignOptions = {
      expiresIn: this.ACCESS_EXPIRATION as SignOptions["expiresIn"],
    };

    return jwt.sign(payload, this.ACCESS_SECRET, options);
  }

  static generateRefreshToken(payload: JWTPayload): string {
    if (!this.REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is not configured");
    }

    const options: SignOptions = {
      expiresIn: this.REFRESH_EXPIRATION as SignOptions["expiresIn"],
    };

    return jwt.sign(payload, this.REFRESH_SECRET, options);
  }

  static verifyAccessToken(token: string): JWTPayload {
    if (!this.ACCESS_SECRET) {
      throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    try {
      const decoded = jwt.verify(token, this.ACCESS_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof JWTTokenExpiredError) {
        throw new TokenExpiredError("Access token has expired");
      }
      throw new InvalidTokenError("Invalid access token");
    }
  }

  static verifyRefreshToken(token: string): JWTPayload {
    if (!this.REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is not configured");
    }

    try {
      const decoded = jwt.verify(token, this.REFRESH_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof JWTTokenExpiredError) {
        throw new TokenExpiredError("Refresh token has expired");
      }
      throw new InvalidTokenError("Invalid refresh token");
    }
  }
}
