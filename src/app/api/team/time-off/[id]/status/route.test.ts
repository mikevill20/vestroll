import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "./route";
import { AuthUtils } from "@/server/utils/auth";
import { TimeOffService } from "@/server/services/time-off.service";
import {
  NotFoundError,
  UnauthorizedError,
} from "@/server/utils/errors";

vi.mock("@/server/utils/auth");
vi.mock("@/server/services/time-off.service");

describe("PATCH /api/team/time-off/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: unknown): NextRequest => {
    return {
      json: async () => body,
    } as unknown as NextRequest;
  };

  it("should update status when requester is an authorized manager", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
      email: "manager@company.com",
      user: {
        firstName: "Mina",
        lastName: "Manager",
        role: "Team manager",
        organizationId: "org-1",
      },
    } as any);

    vi.mocked(TimeOffService.updateStatus).mockResolvedValue({
      id: "time-off-1",
      status: "approved",
      reason: null,
      updatedAt: new Date("2026-02-23T12:00:00.000Z"),
    });

    const req = createMockRequest({ status: "Approved" });
    const response = await PATCH(req, {
      params: Promise.resolve({ id: "time-off-1" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("Time-off request status updated successfully");
    expect(TimeOffService.updateStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "time-off-1",
        actorOrganizationId: "org-1",
        actorRole: "Team manager",
        status: "approved",
      }),
    );
  });

  it("should return 400 when status is Rejected and reason is missing", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
      email: "admin@company.com",
      user: {
        firstName: "Ada",
        lastName: "Admin",
        role: "Administrator",
        organizationId: "org-1",
      },
    } as any);

    const req = createMockRequest({ status: "Rejected" });
    const response = await PATCH(req, {
      params: Promise.resolve({ id: "time-off-1" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Reason is required when status is Rejected");
    expect(TimeOffService.updateStatus).not.toHaveBeenCalled();
  });

  it("should return 403 when requester is not an administrator or manager", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
      email: "member@company.com",
      user: {
        firstName: "Eli",
        lastName: "Member",
        role: "Employee",
        organizationId: "org-1",
      },
    } as any);

    const req = createMockRequest({ status: "Approved" });
    const response = await PATCH(req, {
      params: Promise.resolve({ id: "time-off-1" }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe(
      "Only administrators or managers can update time-off status",
    );
    expect(TimeOffService.updateStatus).not.toHaveBeenCalled();
  });

  it("should return 401 when requester is not authenticated", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError(),
    );

    const req = createMockRequest({ status: "Approved" });
    const response = await PATCH(req, {
      params: Promise.resolve({ id: "time-off-1" }),
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(TimeOffService.updateStatus).not.toHaveBeenCalled();
  });

  it("should return 404 when time-off request does not exist", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
      email: "admin@company.com",
      user: {
        firstName: "Ada",
        lastName: "Admin",
        role: "Administrator",
        organizationId: "org-1",
      },
    } as any);

    vi.mocked(TimeOffService.updateStatus).mockRejectedValue(
      new NotFoundError("Time-off request not found"),
    );

    const req = createMockRequest({
      status: "Rejected",
      reason: "Business-critical project deadline",
    });
    const response = await PATCH(req, {
      params: Promise.resolve({ id: "missing-request" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Time-off request not found");
  });

  it("should return 500 for unexpected errors", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
      email: "admin@company.com",
      user: {
        firstName: "Ada",
        lastName: "Admin",
        role: "Administrator",
        organizationId: "org-1",
      },
    } as any);

    vi.mocked(TimeOffService.updateStatus).mockRejectedValue(
      new Error("DB down"),
    );

    const req = createMockRequest({ status: "Approved" });
    const response = await PATCH(req, {
      params: Promise.resolve({ id: "time-off-1" }),
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Internal server error");
  });
});
