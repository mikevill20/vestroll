import { describe, it, expect, beforeEach, vi } from "vitest";
import { PATCH } from "./route";
import { NextRequest } from "next/server";
import { TeamService } from "@/server/services/team.service";
import { AuthUtils } from "@/server/utils/auth";
import { db } from "@/server/db";

vi.mock("@/server/services/team.service");
vi.mock("@/server/utils/auth");
vi.mock("@/server/db", () => ({
  db: { select: vi.fn() },
  users: {},
}));

const createMockRequest = (body: object): NextRequest =>
  ({ json: async () => body }) as unknown as NextRequest;

const mockParams = { params: Promise.resolve({ id: "milestone-123" }) };

describe("PATCH /api/team/milestones/:id/status", () => {
  beforeEach(() => vi.clearAllMocks());

  const mockDbChain = (role: string | null) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(role ? [{ role }] : []),
    };
    (db.select as any).mockReturnValue(chain);
    return chain;
  };

  it("should approve a milestone successfully", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({ userId: "user-1" } as any);
    mockDbChain("Manager");
    vi.mocked(TeamService.updateMilestoneStatus).mockResolvedValue({
      id: "milestone-123",
      newStatus: "approved",
      updatedAt: new Date(),
    } as any);

    const req = createMockRequest({ status: "approved" });
    const res = await PATCH(req, mockParams);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should return 400 when rejecting without reason", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({ userId: "user-1" } as any);
    mockDbChain("Admin");
    vi.mocked(TeamService.updateMilestoneStatus).mockRejectedValue(
      Object.assign(new Error("A reason is required when rejecting a milestone"), { statusCode: 400 })
    );

    const req = createMockRequest({ status: "rejected" });
    const res = await PATCH(req, mockParams);

    expect(res.status).toBe(500);
  });

  it("should return 403 for non-Manager/Admin roles", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({ userId: "user-1" } as any);
    mockDbChain("Employee");

    const req = createMockRequest({ status: "approved" });
    const res = await PATCH(req, mockParams);

    expect(res.status).toBe(403);
  });

  it("should return 400 for invalid status", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({ userId: "user-1" } as any);
    mockDbChain("Manager");

    const req = createMockRequest({ status: "InvalidStatus" });
    const res = await PATCH(req, mockParams);

    expect(res.status).toBe(400);
  });
});