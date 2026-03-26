import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { KybService } from "@/server/services/kyb.service";
import { AuthUtils } from "@/server/utils/auth";
import { UnauthorizedError } from "@/server/utils/errors";

vi.mock("@/server/services/kyb.service");
vi.mock("@/server/utils/auth");

describe("GET /api/kyb/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (): NextRequest => {
    return {} as unknown as NextRequest;
  };

  it("should return not_started when no KYB record exists", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(KybService.getStatus).mockResolvedValue({
      status: "not_started",
      rejectionReason: null,
      rejectionCode: null,
      submittedAt: null,
    });

    const response = await GET(createMockRequest());

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe("not_started");
    expect(data.data.rejectionReason).toBeNull();
    expect(data.data.rejectionCode).toBeNull();
    expect(data.data.submittedAt).toBeNull();
    expect(KybService.getStatus).toHaveBeenCalledWith("user-123");
  });

  it("should return pending status with submittedAt", async () => {
    const submittedAt = new Date("2026-01-15T10:00:00Z");
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(KybService.getStatus).mockResolvedValue({
      status: "pending",
      rejectionReason: null,
      rejectionCode: null,
      submittedAt,
    });

    const response = await GET(createMockRequest());

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.status).toBe("pending");
    expect(data.data.submittedAt).toBe(submittedAt.toISOString());
  });

  it("should return rejected status with rejectionReason", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(KybService.getStatus).mockResolvedValue({
      status: "rejected",
      rejectionReason: "Invalid business registration number",
      rejectionCode: "INVALID_REGISTRATION_NUMBER",
      submittedAt: new Date("2026-01-15T10:00:00Z"),
    });

    const response = await GET(createMockRequest());

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.status).toBe("rejected");
    expect(data.data.rejectionReason).toBe("Invalid business registration number");
    expect(data.data.rejectionCode).toBe("INVALID_REGISTRATION_NUMBER");
  });

  it("should return verified status", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(KybService.getStatus).mockResolvedValue({
      status: "verified",
      rejectionReason: null,
      rejectionCode: null,
      submittedAt: new Date("2026-01-10T10:00:00Z"),
    });

    const response = await GET(createMockRequest());

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.status).toBe("verified");
  });

  it("should return 401 for unauthenticated requests", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError(),
    );

    const response = await GET(createMockRequest());

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("should return 500 for unexpected errors", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(KybService.getStatus).mockRejectedValue(new Error("DB connection failed"));

    const response = await GET(createMockRequest());

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Internal server error");
  });
});
