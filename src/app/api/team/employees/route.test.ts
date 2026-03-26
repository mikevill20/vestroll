import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { EmployeeService } from "@/server/services/employee.service";
import { AuthUtils } from "@/server/utils/auth";
import { UnauthorizedError, ForbiddenError } from "@/server/utils/errors";

vi.mock("@/server/services/employee.service");
vi.mock("@/server/utils/auth");

describe("GET /api/team/employees", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (
    query: Record<string, string> = {},
  ): NextRequest => {
    const url = new URL("http://localhost:3000/api/team/employees");
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new NextRequest(url);
  };

  const mockEmployeesResponse = {
    data: [
      {
        id: "emp-1",
        name: "James Akinbiola",
        email: "james@company.com",
        role: "Front-end developer",
        status: "Active" as const,
        type: "Freelancer" as const,
        avatarUrl: "/profileImage.png" as string | null,
      },
    ],
    meta: {
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    },
  };

  it("should return paginated employees for authenticated user", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(EmployeeService.getEmployees).mockResolvedValue(
      mockEmployeesResponse,
    );

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("Employees retrieved successfully");
    expect(data.data.data).toHaveLength(1);
    expect(data.data.meta.total).toBe(1);
    expect(data.data.meta.page).toBe(1);
    expect(data.data.meta.limit).toBe(12);
    expect(data.data.meta.totalPages).toBe(1);
  });

  it("should pass default page and limit when not provided", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(EmployeeService.getEmployees).mockResolvedValue(
      mockEmployeesResponse,
    );

    const req = createMockRequest();
    await GET(req);

    expect(EmployeeService.getEmployees).toHaveBeenCalledWith("user-123", {
      page: 1,
      limit: 12,
      search: "",
      status: undefined,
      type: undefined,
    });
  });

  it("should pass search parameter to service", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(EmployeeService.getEmployees).mockResolvedValue(
      mockEmployeesResponse,
    );

    const req = createMockRequest({ search: "john" });
    await GET(req);

    expect(EmployeeService.getEmployees).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({ search: "john" }),
    );
  });

  it("should pass status filter to service", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(EmployeeService.getEmployees).mockResolvedValue(
      mockEmployeesResponse,
    );

    const req = createMockRequest({ status: "Active" });
    await GET(req);

    expect(EmployeeService.getEmployees).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({ status: "Active" }),
    );
  });

  it("should pass type filter to service", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(EmployeeService.getEmployees).mockResolvedValue(
      mockEmployeesResponse,
    );

    const req = createMockRequest({ type: "Freelancer" });
    await GET(req);

    expect(EmployeeService.getEmployees).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({ type: "Freelancer" }),
    );
  });

  it("should return 400 for invalid query parameters", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);

    const req = createMockRequest({ page: "-1" });
    const response = await GET(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid query parameters");
  });

  it("should return 400 for invalid status filter value", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);

    const req = createMockRequest({ status: "InvalidStatus" });
    const response = await GET(req);

    expect(response.status).toBe(400);
  });

  it("should return 401 for unauthenticated request", async () => {
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
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(EmployeeService.getEmployees).mockRejectedValue(
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
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
    } as any);
    vi.mocked(EmployeeService.getEmployees).mockRejectedValue(
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
