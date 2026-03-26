import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { AppleOAuthService } from "@/server/services/apple-oauth.service";
import { OAuthUserProvisioningService } from "@/server/services/oauth-user-provisioning.service";
import { JWTService } from "@/server/services/jwt.service";
import { SessionService } from "@/server/services/session.service";

vi.mock("@/server/services/apple-oauth.service");
vi.mock("@/server/services/oauth-user-provisioning.service");
vi.mock("@/server/services/jwt.service");
vi.mock("@/server/services/session.service");

describe("POST /api/auth/apple", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as unknown as NextRequest;
  };

  it("should successfully authenticate with Apple", async () => {
    const mockAppleUser = {
      email: "test@apple.com",
      firstName: "F",
      lastName: "L",
    };
    const mockUser = {
      id: "u1",
      email: "test@apple.com",
      firstName: "F",
      lastName: "L",
    };

    vi.mocked(AppleOAuthService.verifyIdToken).mockResolvedValue(
      mockAppleUser as any,
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

    const req = createMockRequest({
      idToken: "valid-token",
      user: {
        name: { firstName: "First", lastName: "Last" },
        email: "provided@email.com",
      },
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.accessToken).toBe("access-token");

    expect(OAuthUserProvisioningService.provisionUser).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: "First", lastName: "Last" }),
      "apple",
    );
  });

  it("should return 400 for validation failure", async () => {
    const req = createMockRequest({});
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("should handle service errors gracefully", async () => {
    vi.mocked(AppleOAuthService.verifyIdToken).mockRejectedValue(
      new Error("Apple offline"),
    );
    const req = createMockRequest({ idToken: "tk" });
    const response = await POST(req);
    expect(response.status).toBe(500);
  });
});
