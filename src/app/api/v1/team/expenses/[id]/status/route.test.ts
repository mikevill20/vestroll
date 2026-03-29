import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "./route";
import { JWTTokenService } from "@/server/services/jwt-token.service";
import { ExpenseStatusService } from "@/server/services/expense-status.service";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/utils/errors";

vi.mock("@/server/services/jwt-token.service", () => ({
  JWTTokenService: {
    verifyToken: vi.fn(),
  },
}));

vi.mock("@/server/services/expense-status.service", () => ({
  ExpenseStatusService: {
    updateExpenseStatus: vi.fn(),
  },
}));

const createRequest = (
  body: Record<string, unknown>,
  token: string = "valid-token",
): NextRequest =>
  ({
    json: async () => body,
    headers: new Headers({
      authorization: `Bearer ${token}`,
    }),
  }) as unknown as NextRequest;

describe("PATCH /api/team/expenses/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(JWTTokenService.verifyToken).mockResolvedValue({
      userId: "admin-123",
      role: "admin",
    } as any);
  });

  it("returns 200 and response shape for a successful approval", async () => {
    vi.mocked(ExpenseStatusService.updateExpenseStatus).mockResolvedValue({
      id: "expense-123",
      status: "Approved",
      approverId: "admin-123",
      processedAt: new Date("2026-02-20T10:00:00.000Z"),
    });

    const response = await PATCH(createRequest({ status: "Approved" }), {
      params: Promise.resolve({ id: "expense-123" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.id).toBe("expense-123");
    expect(data.data.status).toBe("Approved");
    expect(data.data.approverId).toBe("admin-123");
    expect(data.data.processedAt).toBe("2026-02-20T10:00:00.000Z");
  });

  it("returns 400 when rejected status has no comment", async () => {
    const response = await PATCH(createRequest({ status: "Rejected" }), {
      params: Promise.resolve({ id: "expense-123" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Comment is required when rejecting an expense");
  });

  it("returns 401 when authorization header is missing", async () => {
    const request = {
      json: async () => ({ status: "Approved" }),
      headers: new Headers(),
    } as unknown as NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "expense-123" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 403 when user role is not admin", async () => {
    vi.mocked(JWTTokenService.verifyToken).mockResolvedValue({
      userId: "member-123",
      role: "member",
    } as any);

    const response = await PATCH(createRequest({ status: "Approved" }), {
      params: Promise.resolve({ id: "expense-123" }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 400 when expense is not pending", async () => {
    vi.mocked(ExpenseStatusService.updateExpenseStatus).mockRejectedValue(
      new BadRequestError("Only expenses in Pending status can be processed"),
    );

    const response = await PATCH(createRequest({ status: "Approved" }), {
      params: Promise.resolve({ id: "expense-123" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Only expenses in Pending status can be processed");
  });

  it("returns 404 when expense does not exist", async () => {
    vi.mocked(ExpenseStatusService.updateExpenseStatus).mockRejectedValue(
      new NotFoundError("Expense not found"),
    );

    const response = await PATCH(createRequest({ status: "Approved" }), {
      params: Promise.resolve({ id: "missing-expense" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.message).toBe("Expense not found");
  });

  it("returns 500 for unexpected errors", async () => {
    vi.mocked(ExpenseStatusService.updateExpenseStatus).mockRejectedValue(
      new Error("db is down"),
    );

    const response = await PATCH(createRequest({ status: "Approved" }), {
      params: Promise.resolve({ id: "expense-123" }),
    });

    expect(response.status).toBe(500);
  });

  it("maps rejected request to service with comment", async () => {
    vi.mocked(ExpenseStatusService.updateExpenseStatus).mockResolvedValue({
      id: "expense-123",
      status: "Rejected",
      approverId: "admin-123",
      processedAt: new Date("2026-02-20T10:00:00.000Z"),
    });

    await PATCH(
      createRequest({ status: "Rejected", comment: "Missing receipt" }),
      { params: Promise.resolve({ id: "expense-123" }) },
    );

    expect(ExpenseStatusService.updateExpenseStatus).toHaveBeenCalledWith({
      expenseId: "expense-123",
      status: "Rejected",
      comment: "Missing receipt",
      approverId: "admin-123",
    });
  });

  it("returns 400 when service enforces rejected comment business rule", async () => {
    vi.mocked(ExpenseStatusService.updateExpenseStatus).mockRejectedValue(
      new BadRequestError("Comment is required when rejecting an expense"),
    );

    const response = await PATCH(createRequest({ status: "Rejected" }), {
      params: Promise.resolve({ id: "expense-123" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Comment is required when rejecting an expense");
  });

  it("returns 403 when service throws forbidden", async () => {
    vi.mocked(ExpenseStatusService.updateExpenseStatus).mockRejectedValue(
      new ForbiddenError("Only administrators can approve or reject expenses"),
    );

    const response = await PATCH(createRequest({ status: "Approved" }), {
      params: Promise.resolve({ id: "expense-123" }),
    });

    expect(response.status).toBe(403);
  });
});
