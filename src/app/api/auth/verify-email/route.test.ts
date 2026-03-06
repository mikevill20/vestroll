import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { EmailVerificationService } from "@/server/services/email-verification.service";
import { AppError } from "@/server/utils/errors";

vi.mock("@/server/services/email-verification.service");

describe("POST /api/auth/verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as unknown as NextRequest;
  };

  it("should successfully verify email", async () => {
    const mockResult = {
      user: { id: "u1", email: "t@e.com", status: "active" },
      message: "Email verified successfully",
    };

    vi.mocked(EmailVerificationService.verifyEmail).mockResolvedValue(
      mockResult as any,
    );

    const req = createMockRequest({
      email: "test@example.com",
      otp: "123456",
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.user.id).toBe("u1");
    expect(EmailVerificationService.verifyEmail).toHaveBeenCalledWith(
      "test@example.com",
      "123456",
    );
  });

  it("should return 400 for validation failure", async () => {
    const req = createMockRequest({
      email: "invalid-email",
      otp: "12",
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Validation failed");
  });

  it("should return 400 for malformed JSON", async () => {
    const req = {
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as NextRequest;

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Malformed JSON in request body");
  });

  it("should handle service errors", async () => {
    vi.mocked(EmailVerificationService.verifyEmail).mockRejectedValue(
      new AppError("Invalid or expired OTP", 400),
    );

    const req = createMockRequest({
      email: "test@example.com",
      otp: "000000",
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Invalid or expired OTP");
  });
});
