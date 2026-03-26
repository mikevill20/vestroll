/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { TwoFactorService } from "@/server/services/two-factor.service";
import { AuthUtils } from "@/server/utils/auth";
import { EmailService } from "@/server/services/email.service";
import { UnauthorizedError } from "@/server/utils/errors";

vi.mock("@/server/services/two-factor.service");
vi.mock("@/server/utils/auth");
vi.mock("@/server/services/email.service");

describe("POST /api/auth/2fa/verify-setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as unknown as NextRequest;
  };

  it("should successfully verify 2FA setup", async () => {
    const mockUser = {
      userId: "user-123",
      email: "test@example.com",
      user: { firstName: "Test" },
    };

    const mockResult = { backupCodes: ["C1", "C2"] };

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(TwoFactorService.verifySetup).mockResolvedValue(mockResult);
    vi.mocked(EmailService.sendTwoFactorEnabledEmail).mockResolvedValue(
      undefined,
    );

    const req = createMockRequest({ totpCode: "123456" });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.backupCodes).toEqual(mockResult.backupCodes);
    expect(TwoFactorService.verifySetup).toBeCalledWith("user-123", "123456");
    expect(EmailService.sendTwoFactorEnabledEmail).toBeCalledWith(
      "test@example.com",
      "Test",
    );
  });

  it("should return 400 for validation failures", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "u1",
    } as any);

    const req = createMockRequest({ totpCode: "123" });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Validation failed");
  });

  it("should return 401 for unauthorized access", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError(),
    );

    const req = createMockRequest({ totpCode: "123456" });
    const response = await POST(req);

    expect(response.status).toBe(401);
  });
});

