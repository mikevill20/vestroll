/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { TwoFactorService } from "@/server/services/two-factor.service";
import { AuthUtils } from "@/server/utils/auth";
import { UnauthorizedError } from "@/server/utils/errors";

vi.mock("@/server/services/two-factor.service");
vi.mock("@/server/utils/auth");

describe("GET /api/auth/2fa/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (): NextRequest => {
    return {} as unknown as NextRequest;
  };

  it("should successfully retrieve 2FA status", async () => {
    const mockUser = { userId: "user-123" };
    const mockStatus = { enabled: true, backupCodesRemaining: 5 };

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(TwoFactorService.getStatus).mockResolvedValue(mockStatus);

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.enabled).toBe(true);
    expect(data.data.backupCodesRemaining).toBe(5);
    expect(TwoFactorService.getStatus).toBeCalledWith("user-123");
  });

  it("should return 401 for unauthorized access", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError(),
    );

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(401);
  });
});

