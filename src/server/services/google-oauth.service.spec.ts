import { describe, it, expect, beforeEach, vi } from "vitest";
import { GoogleOAuthService } from "./google-oauth.service";
import {
  InvalidTokenError,
  TokenExpiredError,
  AudienceMismatchError,
  IssuerMismatchError,
} from "../utils/errors";
import { OAuth2Client } from "google-auth-library";

vi.mock("google-auth-library", () => {
  return {
    OAuth2Client: vi.fn().mockImplementation(function () {
      return {
        verifyIdToken: vi.fn(),
      };
    }),
  };
});

describe("GoogleOAuthService", () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
    (GoogleOAuthService as any).client = undefined;
    vi.clearAllMocks();
  });

  describe("verifyIdToken", () => {
    it("should successfully verify valid Google ID token", async () => {
      const mockPayload = {
        sub: "google-user-123",
        email: "test@example.com",
        name: "John Doe",
        given_name: "John",
        family_name: "Doe",
        aud: "test-client-id.apps.googleusercontent.com",
        iss: "accounts.google.com",
      };

      const mockVerifyIdToken = vi.fn().mockResolvedValue({
        getPayload: () => mockPayload,
      });

      (OAuth2Client as any).mockImplementation(function () {
        return {
          verifyIdToken: mockVerifyIdToken,
        };
      });

      const result = await GoogleOAuthService.verifyIdToken("valid-token");

      expect(result).toEqual({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        oauthId: "google-user-123",
      });

      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: "valid-token",
        audience: "test-client-id.apps.googleusercontent.com",
      });
    });

    it("should extract user info correctly when only name is provided", async () => {
      const mockPayload = {
        sub: "google-user-456",
        email: "jane@example.com",
        name: "Jane Smith",
        aud: "test-client-id.apps.googleusercontent.com",
        iss: "https://accounts.google.com",
      };

      const mockVerifyIdToken = vi.fn().mockResolvedValue({
        getPayload: () => mockPayload,
      });

      (OAuth2Client as any).mockImplementation(function () {
        return {
          verifyIdToken: mockVerifyIdToken,
        };
      });

      const result = await GoogleOAuthService.verifyIdToken("valid-token");

      expect(result.firstName).toBe("Jane");
      expect(result.lastName).toBe("Smith");
    });

    it("should throw InvalidTokenError for empty payload", async () => {
      const mockVerifyIdToken = vi.fn().mockResolvedValue({
        getPayload: () => null,
      });

      (OAuth2Client as any).mockImplementation(function () {
        return {
          verifyIdToken: mockVerifyIdToken,
        };
      });

      await expect(
        GoogleOAuthService.verifyIdToken("invalid-token"),
      ).rejects.toThrow(InvalidTokenError);
    });

    it("should throw AudienceMismatchError for wrong audience", async () => {
      const mockPayload = {
        sub: "google-user-123",
        email: "test@example.com",
        name: "John Doe",
        aud: "wrong-client-id.apps.googleusercontent.com",
        iss: "accounts.google.com",
      };

      const mockVerifyIdToken = vi.fn().mockResolvedValue({
        getPayload: () => mockPayload,
      });

      (OAuth2Client as any).mockImplementation(function () {
        return {
          verifyIdToken: mockVerifyIdToken,
        };
      });

      await expect(
        GoogleOAuthService.verifyIdToken("token-with-wrong-audience"),
      ).rejects.toThrow(AudienceMismatchError);
    });

    it("should throw IssuerMismatchError for invalid issuer", async () => {
      const mockPayload = {
        sub: "google-user-123",
        email: "test@example.com",
        name: "John Doe",
        aud: "test-client-id.apps.googleusercontent.com",
        iss: "evil-issuer.com",
      };

      const mockVerifyIdToken = vi.fn().mockResolvedValue({
        getPayload: () => mockPayload,
      });

      (OAuth2Client as any).mockImplementation(function () {
        return {
          verifyIdToken: mockVerifyIdToken,
        };
      });

      await expect(
        GoogleOAuthService.verifyIdToken("token-with-wrong-issuer"),
      ).rejects.toThrow(IssuerMismatchError);
    });

    it("should throw InvalidTokenError for missing email", async () => {
      const mockPayload = {
        sub: "google-user-123",
        name: "John Doe",
        aud: "test-client-id.apps.googleusercontent.com",
        iss: "accounts.google.com",
      };

      const mockVerifyIdToken = vi.fn().mockResolvedValue({
        getPayload: () => mockPayload,
      });

      (OAuth2Client as any).mockImplementation(function () {
        return {
          verifyIdToken: mockVerifyIdToken,
        };
      });

      await expect(
        GoogleOAuthService.verifyIdToken("token-without-email"),
      ).rejects.toThrow(InvalidTokenError);
    });

    it("should throw TokenExpiredError for expired token", async () => {
      const mockVerifyIdToken = vi
        .fn()
        .mockRejectedValue(new Error("Token used too late"));

      (OAuth2Client as any).mockImplementation(function () {
        return {
          verifyIdToken: mockVerifyIdToken,
        };
      });

      await expect(
        GoogleOAuthService.verifyIdToken("expired-token"),
      ).rejects.toThrow(TokenExpiredError);
    });

    it("should throw InvalidTokenError for verification failure", async () => {
      const mockVerifyIdToken = vi
        .fn()
        .mockRejectedValue(new Error("Invalid signature"));

      (OAuth2Client as any).mockImplementation(function () {
        return {
          verifyIdToken: mockVerifyIdToken,
        };
      });

      await expect(
        GoogleOAuthService.verifyIdToken("invalid-signature-token"),
      ).rejects.toThrow(InvalidTokenError);
    });

    it("should use default firstName if name is missing", async () => {
      const mockPayload = {
        sub: "google-user-789",
        email: "noname@example.com",
        aud: "test-client-id.apps.googleusercontent.com",
        iss: "accounts.google.com",
      };

      const mockVerifyIdToken = vi.fn().mockResolvedValue({
        getPayload: () => mockPayload,
      });

      (OAuth2Client as any).mockImplementation(function () {
        return {
          verifyIdToken: mockVerifyIdToken,
        };
      });

      const result = await GoogleOAuthService.verifyIdToken("valid-token");

      expect(result.firstName).toBe("User");
      expect(result.lastName).toBe("");
    });
  });
});
