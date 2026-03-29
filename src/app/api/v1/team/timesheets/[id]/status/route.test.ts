import { describe, it, expect, beforeEach, vi } from "vitest";
import { PATCH } from "./route";
import { NextRequest } from "next/server";
import { TimesheetService } from "@/server/services/timesheet.service";
import { AuthUtils } from "@/server/utils/auth";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from "@/server/utils/errors";

vi.mock("@/server/services/timesheet.service");
vi.mock("@/server/utils/auth");

describe("PATCH /api/team/timesheets/:id/status", () => {
  const TIMESHEET_ID = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: unknown): NextRequest => {
    return new NextRequest(
      `http://localhost:3000/api/team/timesheets/${TIMESHEET_ID}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  };

  const mockParams = Promise.resolve({ id: TIMESHEET_ID });

  it("should approve a pending timesheet and return 200 with totalApprovedAmount", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(TimesheetService.updateStatus).mockResolvedValue({
      id: TIMESHEET_ID,
      status: "approved",
      totalApprovedAmount: 4000,
    });

    const req = createMockRequest({ status: "approved" });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("Timesheet status updated");
    expect(data.data.id).toBe(TIMESHEET_ID);
    expect(data.data.status).toBe("approved");
    expect(data.data.totalApprovedAmount).toBe(4000);
  });

  it("should reject a pending timesheet and return 200 with null totalApprovedAmount", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(TimesheetService.updateStatus).mockResolvedValue({
      id: TIMESHEET_ID,
      status: "rejected",
      totalApprovedAmount: null,
    });

    const req = createMockRequest({ status: "rejected" });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.status).toBe("rejected");
    expect(data.data.totalApprovedAmount).toBeNull();
  });

  it("should call TimesheetService.updateStatus with correct arguments", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(TimesheetService.updateStatus).mockResolvedValue({
      id: TIMESHEET_ID,
      status: "approved",
      totalApprovedAmount: 4000,
    });

    const req = createMockRequest({ status: "approved" });
    await PATCH(req, { params: mockParams });

    expect(TimesheetService.updateStatus).toHaveBeenCalledWith(
      "user-123",
      TIMESHEET_ID,
      {
        status: "approved",
      },
    );
  });

  it("should return 400 for an invalid status value", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);

    const req = createMockRequest({ status: "pending" });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid request body");
  });

  it("should return 400 when status field is missing", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);

    const req = createMockRequest({});
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("should return 400 when timesheet has already been processed", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(TimesheetService.updateStatus).mockRejectedValue(
      new BadRequestError("Timesheet has already been approved"),
    );

    const req = createMockRequest({ status: "approved" });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Timesheet has already been approved");
  });

  it("should return 401 for unauthenticated requests", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError(),
    );

    const req = createMockRequest({ status: "approved" });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("should return 403 when user has no associated organization", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(TimesheetService.updateStatus).mockRejectedValue(
      new ForbiddenError("User is not associated with any organization"),
    );

    const req = createMockRequest({ status: "approved" });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.message).toBe("User is not associated with any organization");
  });

  it("should return 404 when timesheet does not exist or belongs to another org", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(TimesheetService.updateStatus).mockRejectedValue(
      new NotFoundError("Timesheet not found"),
    );

    const req = createMockRequest({ status: "approved" });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.message).toBe("Timesheet not found");
  });

  it("should return 500 for unexpected errors", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(TimesheetService.updateStatus).mockRejectedValue(
      new Error("Database connection failed"),
    );

    const req = createMockRequest({ status: "approved" });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Internal server error");
  });
});
