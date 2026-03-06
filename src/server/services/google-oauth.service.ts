import { OAuth2Client } from "google-auth-library";
import {
  InvalidTokenError,
  TokenExpiredError,
  AudienceMismatchError,
  IssuerMismatchError,
} from "../utils/errors";
import { OAuthUserInfo } from "./oauth-user-provisioning.service";

export class GoogleOAuthService {
  private static client: OAuth2Client;

  private static getClient(): OAuth2Client {
    if (!this.client) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error("GOOGLE_CLIENT_ID is not configured");
      }
      this.client = new OAuth2Client(clientId);
    }
    return this.client;
  }

  static async verifyIdToken(idToken: string): Promise<OAuthUserInfo> {
    const client = this.getClient();
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID is not configured");
    }

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new InvalidTokenError("Token payload is empty");
      }

      if (payload.aud !== clientId) {
        throw new AudienceMismatchError(
          "Token audience does not match GOOGLE_CLIENT_ID",
        );
      }

      const validIssuers = [
        "accounts.google.com",
        "https://accounts.google.com",
      ];
      if (!validIssuers.includes(payload.iss)) {
        throw new IssuerMismatchError("Token issuer is not Google");
      }

      if (!payload.email || !payload.sub) {
        throw new InvalidTokenError("Token missing required fields");
      }

      return this.extractUserInfo(payload);
    } catch (error) {
      if (
        error instanceof AudienceMismatchError ||
        error instanceof IssuerMismatchError ||
        error instanceof InvalidTokenError
      ) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes("Token used too late")) {
          throw new TokenExpiredError("Google token has expired");
        }

        console.error("[Google OAuth Error]", error.message);
        throw new InvalidTokenError("Failed to verify Google token");
      }

      throw new InvalidTokenError("Failed to verify Google token");
    }
  }

  private static extractUserInfo(payload: any): OAuthUserInfo {
    const nameParts = (payload.name || "").split(" ");
    const firstName = nameParts[0] || payload.given_name || "";
    const lastName = nameParts.slice(1).join(" ") || payload.family_name || "";

    return {
      email: payload.email,
      firstName: firstName || "User",
      lastName: lastName || "",
      oauthId: payload.sub,
    };
  }
}
