/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { TwoFactorService } from "@/server/services/two-factor.service";
import { AuthUtils } from "@/server/utils/auth";
import { EmailService } from "@/server/services/email.service";
import { AppError, UnauthorizedError } from "@/server/utils/errors";

vi.mock("@/server/services/two-factor.service");
vi.mock("@/server/utils/auth");
vi.mock("@/server/services/email.service");

describe("POST /api/auth/2fa/disable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
      headers: new Headers(),
    } as unknown as NextRequest;
  };

  it("should successfully disable 2FA for authenticated user", async () => {
    const mockUser = {
      userId: "user-123",
      email: "test@example.com",
      user: { firstName: "Test" },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(TwoFactorService.disableTwoFactor).mockResolvedValue(undefined);
    vi.mocked(EmailService.sendTwoFactorDisabledEmail).mockResolvedValue(
      undefined,
    );

    const req = createMockRequest({
      password: "password123",
      totpCode: "123456",
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe(
      "Two-factor authentication has been disabled on your account.",
    );
    expect(TwoFactorService.disableTwoFactor).toBeCalledWith(
      "user-123",
      "password123",
      "123456",
    );
    expect(EmailService.sendTwoFactorDisabledEmail).toBeCalledWith(
      "test@example.com",
      "Test",
    );
  });

  it("should return 401 for unauthorized access", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError(),
    );

    const req = createMockRequest({
      password: "password123",
      totpCode: "123456",
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("should return 400 for validation errors", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "u1",
    } as any);

    const req = createMockRequest({
      password: "",
      totpCode: "123",
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Validation failed");
  });

  it("should return 400 for invalid TOTP code", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "u1",
    } as any);
    vi.mocked(TwoFactorService.disableTwoFactor).mockRejectedValue(
      new AppError("Invalid TOTP code", 400),
    );

    const req = createMockRequest({
      password: "password123",
      totpCode: "000000",
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Invalid TOTP code");
  });

  it("should return 401 for invalid password", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "u1",
    } as any);
    vi.mocked(TwoFactorService.disableTwoFactor).mockRejectedValue(
      new AppError("Invalid password", 401),
    );

    const req = createMockRequest({
      password: "wrong-password",
      totpCode: "123456",
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.message).toBe("Invalid password");
  });
});
