/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { TwoFactorService } from "@/server/services/two-factor.service";
import { AuthUtils } from "@/server/utils/auth";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/server/utils/errors";

vi.mock("@/server/services/two-factor.service");
vi.mock("@/server/utils/auth");

describe("POST /api/auth/2fa/setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (): NextRequest => {
    return {
      headers: new Headers(),
    } as unknown as NextRequest;
  };

  it("should successfully initialize 2FA setup for authenticated user", async () => {
    const mockUser = {
      userId: "user-123",
      email: "test@example.com",
      user: { id: "user-123", email: "test@example.com" },
    };

    const mockResult = {
      secret: "JBSWY3DPEHPK3PXP",
      qrCodeUrl: "data:image/png;base64,...",
      backupCodes: ["CODE-1", "CODE-2"],
    };

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(TwoFactorService.setupTwoFactor).mockResolvedValue(mockResult);

    const req = createMockRequest();
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockResult);
  });

  it("should return 401 when authentication fails", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError("Unauthorized"),
    );

    const req = createMockRequest();
    const response = await POST(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Unauthorized");
  });

  it("should return 403 when 2FA is already enabled", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
      email: "test@example.com",
      user: {},
    } as any);

    vi.mocked(TwoFactorService.setupTwoFactor).mockRejectedValue(
      new ForbiddenError("Two-factor authentication is already enabled"),
    );

    const req = createMockRequest();
    const response = await POST(req);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Two-factor authentication is already enabled");
  });

  it("should return 404 when user is not found", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
      email: "test@example.com",
      user: {},
    } as any);

    vi.mocked(TwoFactorService.setupTwoFactor).mockRejectedValue(
      new NotFoundError("User not found"),
    );

    const req = createMockRequest();
    const response = await POST(req);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("User not found");
  });

  it("should return 500 for unexpected errors", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
      email: "test@example.com",
      user: {},
    } as any);

    vi.mocked(TwoFactorService.setupTwoFactor).mockRejectedValue(
      new Error("Unexpected"),
    );

    const req = createMockRequest();
    const response = await POST(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Internal server error");
  });
});

