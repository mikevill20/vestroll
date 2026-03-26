import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { GoogleOAuthService } from "@/server/services/google-oauth.service";
import { OAuthUserProvisioningService } from "@/server/services/oauth-user-provisioning.service";
import { JWTService } from "@/server/services/jwt.service";
import { SessionService } from "@/server/services/session.service";

vi.mock("@/server/services/google-oauth.service");
vi.mock("@/server/services/oauth-user-provisioning.service");
vi.mock("@/server/services/jwt.service");
vi.mock("@/server/services/session.service");

describe("POST /api/auth/google", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as unknown as NextRequest;
  };

  it("should successfully authenticate with Google", async () => {
    const mockGoogleUser = { email: "test@gmail.com", sub: "google-id" };
    const mockUser = {
      id: "u1",
      email: "test@gmail.com",
      firstName: "F",
      lastName: "L",
    };

    vi.mocked(GoogleOAuthService.verifyIdToken).mockResolvedValue(
      mockGoogleUser as any,
    );
    vi.mocked(OAuthUserProvisioningService.provisionUser).mockResolvedValue(
      mockUser as any,
    );
    vi.mocked(JWTService.generateAccessToken).mockReturnValue("access-token");
    vi.mocked(JWTService.generateRefreshToken).mockReturnValue("refresh-token");
    vi.mocked(SessionService.createSession).mockResolvedValue({
      id: "sess-1",
      userId: "u1",
      refreshTokenHash: "hash",
      deviceInfo: null,
      expiresAt: new Date(),
      createdAt: new Date(),
      lastUsedAt: null,
    });

    const req = createMockRequest({ idToken: "valid-token" });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.accessToken).toBe("access-token");
    expect(response.cookies.get("refreshToken")?.value).toBe("refresh-token");
  });

  it("should return 400 for missing idToken", async () => {
    const req = createMockRequest({});
    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Validation failed");
  });

  it("should return internal server error on unexpected failure", async () => {
    vi.mocked(GoogleOAuthService.verifyIdToken).mockRejectedValue(
      new Error("Network fail"),
    );

    const req = createMockRequest({ idToken: "valid-token" });
    const response = await POST(req);

    expect(response.status).toBe(500);
  });
});
