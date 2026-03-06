import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { DashboardService } from "@/server/services/dashboard.service";
import { AuthUtils } from "@/server/utils/auth";
import { UnauthorizedError } from "@/server/utils/errors";

vi.mock("@/server/services/dashboard.service");
vi.mock("@/server/utils/auth");

describe("GET /api/dashboard/user-summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (): NextRequest => {
    return {} as unknown as NextRequest;
  };

  it("should successfully retrieve user summary", async () => {
    const mockUser = { userId: "user-123" };
    const mockSummary = {
      firstName: "John",
      lastName: "Doe",
      avatarUrl: null,
      role: null,
      organizationName: null,
    };

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(DashboardService.getUserSummary).mockResolvedValue(mockSummary);

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe("John");
    expect(data.data.lastName).toBe("Doe");
    expect(data.data.avatarUrl).toBeNull();
    expect(data.data.role).toBeNull();
    expect(data.data.organizationName).toBeNull();
    expect(DashboardService.getUserSummary).toBeCalledWith("user-123");
  });

  it("should return 401 for unauthorized access", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError(),
    );

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it("should return 404 when user not found", async () => {
    const mockUser = { userId: "user-123" };

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(DashboardService.getUserSummary).mockResolvedValue(null);

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("User not found");
  });
});
