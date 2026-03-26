import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/server/utils/auth", () => ({
  AuthUtils: {
    authenticateRequest: vi.fn(),
  },
}));

vi.mock("@/server/services/bank-verification.service", () => ({
  BankVerificationService: {
    verifyAccount: vi.fn(),
  },
}));

import { AuthUtils } from "@/server/utils/auth";
import { BankVerificationService } from "@/server/services/bank-verification.service";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/team/employees/bank-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/team/employees/bank-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-1",
      email: "test@example.com",
      user: {} as any,
    });
  });

  it("returns 200 with accountName on success", async () => {
    vi.mocked(BankVerificationService.verifyAccount).mockResolvedValue({
      accountName: "John Doe",
    });

    const res = await POST(makeRequest({
      accountNumber: "0001234567",
      bankCode: "058",
      providerId: "paystack",
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.accountName).toBe("John Doe");
  });

  it("returns 400 when accountNumber is missing", async () => {
    const res = await POST(makeRequest({
      bankCode: "058",
      providerId: "paystack",
    }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("returns 400 when accountNumber has non-digit chars", async () => {
    const res = await POST(makeRequest({
      accountNumber: "abc1234567",
      bankCode: "058",
      providerId: "paystack",
    }));

    expect(res.status).toBe(400);
  });

  it("returns 400 when accountNumber is not 10 digits", async () => {
    const res = await POST(makeRequest({
      accountNumber: "12345",
      bankCode: "058",
      providerId: "paystack",
    }));

    expect(res.status).toBe(400);
  });

  it("returns 400 when providerId is not a supported provider", async () => {
    const res = await POST(makeRequest({
      accountNumber: "0001234567",
      bankCode: "058",
      providerId: "stripe",
    }));

    expect(res.status).toBe(400);
  });

  it("returns 400 when provider verification fails", async () => {
    const { BadRequestError } = await import("@/server/utils/errors");
    vi.mocked(BankVerificationService.verifyAccount).mockRejectedValue(
      new BadRequestError("Could not verify account"),
    );

    const res = await POST(makeRequest({
      accountNumber: "0001234567",
      bankCode: "058",
      providerId: "paystack",
    }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toBe("Could not verify account");
  });

  it("returns 401 when not authenticated", async () => {
    const { UnauthorizedError } = await import("@/server/utils/errors");
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError("Authentication required"),
    );

    const res = await POST(makeRequest({
      accountNumber: "0001234567",
      bankCode: "058",
      providerId: "paystack",
    }));

    expect(res.status).toBe(401);
  });

  it("returns 500 for unexpected errors", async () => {
    vi.mocked(BankVerificationService.verifyAccount).mockRejectedValue(
      new Error("Network timeout"),
    );

    const res = await POST(makeRequest({
      accountNumber: "0001234567",
      bankCode: "058",
      providerId: "paystack",
    }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.message).toBe("Internal server error");
  });
});
