import * as jose from "jose";
import {
  InvalidTokenError,
  TokenExpiredError,
  AudienceMismatchError,
  IssuerMismatchError,
} from "../utils/errors";
import { OAuthUserInfo } from "./oauth-user-provisioning.service";
import { Logger } from "./logger.service";

export class AppleOAuthService {
  private static APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";
  private static APPLE_ISSUER = "https://appleid.apple.com";

  static async verifyIdToken(idToken: string): Promise<OAuthUserInfo> {
    const clientId = process.env.APPLE_CLIENT_ID;

    if (!clientId) {
      throw new Error("APPLE_CLIENT_ID is not configured");
    }

    try {

      const JWKS = jose.createRemoteJWKSet(new URL(this.APPLE_KEYS_URL));

      const { payload } = await jose.jwtVerify(idToken, JWKS, {
        issuer: this.APPLE_ISSUER,
        audience: clientId,
      });

      if (!payload.sub || !payload.email) {
        throw new InvalidTokenError(
          "Apple token missing required claims (sub, email)",
        );
      }

      return {
        email: payload.email as string,
        firstName: "",
        lastName: "",
        oauthId: payload.sub,
      };
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        throw new TokenExpiredError("Apple token has expired");
      }
      if (error instanceof jose.errors.JWTClaimValidationFailed) {
        if (error.claim === "aud") {
          throw new AudienceMismatchError("Apple token audience mismatch");
        }
        if (error.claim === "iss") {
          throw new IssuerMismatchError("Apple token issuer mismatch");
        }
      }

      Logger.error("Apple OAuth token verification failed", { error: String(error) });
      if (error instanceof Error) {
        throw new InvalidTokenError(
          `Failed to verify Apple token: ${error.message}`,
        );
      }
      throw new InvalidTokenError("Failed to verify Apple token");
    }
  }
}
