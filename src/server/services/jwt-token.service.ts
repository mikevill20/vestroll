import * as jose from "jose";
import { Logger } from "./logger.service";

export class JWTTokenService {
  private static readonly ACCESS_TOKEN_EXPIRY = "15m";
  private static readonly REFRESH_TOKEN_EXPIRY_LONG = "30d";
  private static readonly REFRESH_TOKEN_EXPIRY_SHORT = "7d";

  private static getPrivateKey() {
    const key = process.env.JWT_PRIVATE_KEY;
    if (!key) {
      return new TextEncoder().encode(process.env.JWT_SECRET || "vestroll-fallback-secret");
    }
    return jose.importPKCS8(key, "RS256");
  }

  private static getPublicKey() {
    const key = process.env.JWT_PUBLIC_KEY;
    if (!key) {
      return new TextEncoder().encode(process.env.JWT_SECRET || "vestroll-fallback-secret");
    }
    return jose.importSPKI(key, "RS256");
  }

  static async generateAccessToken(payload: { userId: string; email: string }): Promise<string> {
    const key = await this.getPrivateKey();
    const alg = key instanceof Uint8Array ? "HS256" : "RS256";

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime(this.ACCESS_TOKEN_EXPIRY)
      .sign(key);
  }

  static async generateRefreshToken(
    payload: { userId: string; email: string; sessionId?: string },
    rememberMe: boolean = false
  ): Promise<string> {
    const key = await this.getPrivateKey();
    const alg = key instanceof Uint8Array ? "HS256" : "RS256";
    const expiry = rememberMe ? this.REFRESH_TOKEN_EXPIRY_LONG : this.REFRESH_TOKEN_EXPIRY_SHORT;

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime(expiry)
      .sign(key);
  }

  static async generateRotatedRefreshToken(
    payload: { userId: string; email: string; sessionId?: string },
    exp: number
  ): Promise<string> {
    const key = await this.getPrivateKey();
    const alg = key instanceof Uint8Array ? "HS256" : "RS256";

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(key);
  }

  static async verifyToken(token: string) {
    const key = await this.getPublicKey();
    try {
      const { payload } = await jose.jwtVerify(token, key);
      return payload;
    } catch (error) {
      Logger.error("JWT verification failed", { error: String(error) });
      return null;
    }
  }
}
