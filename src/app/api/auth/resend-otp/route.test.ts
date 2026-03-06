import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { OTPResendService } from "@/server/services/otp-resend.service";
import {
  NotFoundError,
  BadRequestError,
  TooManyRequestsError,
} from "@/server/utils/errors";

vi.mock("@/server/services/otp-resend.service");

describe("POST /api/auth/resend-otp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  it("should successfully resend OTP for valid email", async () => {
    const mockResponse = {
      message: "Verification code resent",
      email: "user@example.com",
      userId: "user-123",
    };

    vi.mocked(OTPResendService.resendOTP).mockResolvedValue(mockResponse);

    const req = createMockRequest({ email: "user@example.com" });
    const response = await POST(req);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("Verification code resent");
    expect(data.data).toEqual(mockResponse);
  });

  it("should sanitize email input (trim and lowercase)", async () => {
    const mockResponse = {
      message: "Verification code resent",
      email: "user@example.com",
      userId: "user-123",
    };

    vi.mocked(OTPResendService.resendOTP).mockResolvedValue(mockResponse);

    const req = createMockRequest({ email: "  USER@EXAMPLE.COM  " });
    await POST(req);

    expect(OTPResendService.resendOTP).toHaveBeenCalledWith(
      "user@example.com"
    );
  });

  it("should return 400 for validation errors", async () => {
    const req = createMockRequest({ email: "invalid-email" });
    const response = await POST(req);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Validation failed");
    expect(data.errors).toBeDefined();
    expect(data.errors.fieldErrors).toBeDefined();
  });

  it("should return 400 for missing email", async () => {
    const req = createMockRequest({});
    const response = await POST(req);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Validation failed");
  });

  it("should return 404 when user not found", async () => {
    vi.mocked(OTPResendService.resendOTP).mockRejectedValue(
      new NotFoundError("User not found")
    );

    const req = createMockRequest({ email: "nonexistent@example.com" });
    const response = await POST(req);

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("User not found");
  });

  it("should return 400 when user already verified", async () => {
    vi.mocked(OTPResendService.resendOTP).mockRejectedValue(
      new BadRequestError("User is already verified")
    );

    const req = createMockRequest({ email: "verified@example.com" });
    const response = await POST(req);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("User is already verified");
  });

  it("should return 429 with retry-after header when rate limit exceeded", async () => {
    const retryAfter = 180;
    vi.mocked(OTPResendService.resendOTP).mockRejectedValue(
      new TooManyRequestsError(
        "Too many OTP requests. Please try again later.",
        retryAfter
      )
    );

    const req = createMockRequest({ email: "user@example.com" });
    const response = await POST(req);

    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Too many OTP requests. Please try again later.");
    expect(data.errors).toBeDefined();
    expect(data.errors.retryAfter).toBe(retryAfter);

    const retryAfterHeader = response.headers.get("Retry-After");
    expect(retryAfterHeader).toBe(retryAfter.toString());
  });

  it("should return 500 for internal server errors", async () => {
    vi.mocked(OTPResendService.resendOTP).mockRejectedValue(
      new Error("Database connection failed")
    );

    const req = createMockRequest({ email: "user@example.com" });
    const response = await POST(req);

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Internal server error");
  });

  it("should log rate limit violations", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.mocked(OTPResendService.resendOTP).mockRejectedValue(
      new TooManyRequestsError("Too many requests", 300)
    );

    const req = createMockRequest({ email: "user@example.com" });
    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Rate Limit]")
    );

    consoleSpy.mockRestore();
  });

  it("should log security warnings for not found errors", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.mocked(OTPResendService.resendOTP).mockRejectedValue(
      new NotFoundError("User not found")
    );

    const req = createMockRequest({ email: "user@example.com" });
    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[OTP Resend]")
    );

    consoleSpy.mockRestore();
  });

  it("should log internal errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(OTPResendService.resendOTP).mockRejectedValue(
      new Error("Unexpected error")
    );

    const req = createMockRequest({ email: "user@example.com" });
    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[OTP Resend Error]"),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
