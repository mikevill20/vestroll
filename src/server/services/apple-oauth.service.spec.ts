import { describe, it, expect, vi, beforeEach } from "vitest";
import * as jose from "jose";
import { AppleOAuthService } from "./apple-oauth.service";
import {
  InvalidTokenError,
  TokenExpiredError,
  AudienceMismatchError,
  IssuerMismatchError,
} from "../utils/errors";

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(),
  jwtVerify: vi.fn(),
  errors: {
    JWTExpired: class extends Error {
      constructor(message: string) {
        super(message);
      }
    },
    JWTClaimValidationFailed: class extends Error {
      claim: string;
      constructor(message: string, _payload: any, claim: string) {
        super(message);
        this.claim = claim;
      }
    },
  },
}));

describe("AppleOAuthService", () => {
  const mockIdToken = "mock.id.token";
  const mockClientId = "com.example.app";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APPLE_CLIENT_ID = mockClientId;
    (jose.createRemoteJWKSet as any).mockReturnValue(() => {});
  });

  it("should verify a valid token and return user info", async () => {
    const mockPayload = {
      sub: "apple-user-123",
      email: "user@example.com",
    };

    (jose.jwtVerify as any).mockResolvedValue({ payload: mockPayload });

    const result = await AppleOAuthService.verifyIdToken(mockIdToken);

    expect(result).toEqual({
      email: "user@example.com",
      firstName: "",
      lastName: "",
      oauthId: "apple-user-123",
    });
    expect(jose.jwtVerify).toHaveBeenCalledWith(
      mockIdToken,
      expect.any(Function),
      {
        issuer: "https://appleid.apple.com",
        audience: mockClientId,
      },
    );
  });

  it("should throw TokenExpiredError when token is expired", async () => {
    (jose.jwtVerify as any).mockRejectedValue(
      new jose.errors.JWTExpired("Token has expired", {} as any),
    );

    await expect(AppleOAuthService.verifyIdToken(mockIdToken)).rejects.toThrow(
      TokenExpiredError,
    );
  });

  it("should throw AudienceMismatchError when audience mismatch", async () => {
    (jose.jwtVerify as any).mockRejectedValue(
      new jose.errors.JWTClaimValidationFailed(
        "aud mismatch",
        {} as any,
        "aud",
      ),
    );

    await expect(AppleOAuthService.verifyIdToken(mockIdToken)).rejects.toThrow(
      AudienceMismatchError,
    );
  });

  it("should throw IssuerMismatchError when issuer mismatch", async () => {
    (jose.jwtVerify as any).mockRejectedValue(
      new jose.errors.JWTClaimValidationFailed(
        "iss mismatch",
        {} as any,
        "iss",
      ),
    );

    await expect(AppleOAuthService.verifyIdToken(mockIdToken)).rejects.toThrow(
      IssuerMismatchError,
    );
  });

  it("should throw InvalidTokenError when sub or email is missing", async () => {
    (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: "123" } });

    await expect(AppleOAuthService.verifyIdToken(mockIdToken)).rejects.toThrow(
      InvalidTokenError,
    );
  });

  it("should throw error if APPLE_CLIENT_ID is not configured", async () => {
    delete process.env.APPLE_CLIENT_ID;

    await expect(AppleOAuthService.verifyIdToken(mockIdToken)).rejects.toThrow(
      "APPLE_CLIENT_ID is not configured",
    );
  });
});
