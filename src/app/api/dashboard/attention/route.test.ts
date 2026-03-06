import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { AttentionService } from "@/server/services/attention.service";
import { AuthUtils } from "@/server/utils/auth";
import { UnauthorizedError, ForbiddenError } from "@/server/utils/errors";

vi.mock("@/server/services/attention.service");
vi.mock("@/server/utils/auth");

describe("GET /api/dashboard/attention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (): NextRequest => {
    return {} as unknown as NextRequest;
  };

  it("should successfully retrieve attention items", async () => {
    const mockUser = { userId: "user-123" };
    const mockAttentionItems = {
      contractsPendingSignature: 3,
      milestonesCompleted: 2,
      invoicesRequiringPayment: 5,
      pendingTimesheets: 4,
      pendingExpenses: 1,
      pendingTimeOffRequests: 2,
    };

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(AttentionService.getAttentionItems).mockResolvedValue(mockAttentionItems);

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("Attention items retrieved successfully");
    expect(data.data.contractsPendingSignature).toBe(3);
    expect(data.data.milestonesCompleted).toBe(2);
    expect(data.data.invoicesRequiringPayment).toBe(5);
    expect(data.data.pendingTimesheets).toBe(4);
    expect(data.data.pendingExpenses).toBe(1);
    expect(data.data.pendingTimeOffRequests).toBe(2);
    expect(AttentionService.getAttentionItems).toBeCalledWith("user-123");
  });

  it("should return all zeros when no items need attention", async () => {
    const mockUser = { userId: "user-123" };
    const mockAttentionItems = {
      contractsPendingSignature: 0,
      milestonesCompleted: 0,
      invoicesRequiringPayment: 0,
      pendingTimesheets: 0,
      pendingExpenses: 0,
      pendingTimeOffRequests: 0,
    };

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(AttentionService.getAttentionItems).mockResolvedValue(mockAttentionItems);

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.contractsPendingSignature).toBe(0);
    expect(data.data.milestonesCompleted).toBe(0);
    expect(data.data.invoicesRequiringPayment).toBe(0);
    expect(data.data.pendingTimesheets).toBe(0);
    expect(data.data.pendingExpenses).toBe(0);
    expect(data.data.pendingTimeOffRequests).toBe(0);
  });

  it("should return 401 for unauthorized access", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError(),
    );

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("should return 403 when user has no organization", async () => {
    const mockUser = { userId: "user-123" };

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(AttentionService.getAttentionItems).mockRejectedValue(
      new ForbiddenError("User is not associated with any organization"),
    );

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("User is not associated with any organization");
  });

  it("should return 500 for unexpected errors", async () => {
    const mockUser = { userId: "user-123" };

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(AttentionService.getAttentionItems).mockRejectedValue(
      new Error("Database connection failed"),
    );

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Internal server error");
  });
});
