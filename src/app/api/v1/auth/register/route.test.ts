import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { ConflictError, AppError } from "@/server/utils/errors";

vi.mock("@/server/services/auth.service");

describe("POST /api/v1/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  it("should successfully register a new user", async () => {
    const mockResult = {
      userId: "user-123",
      email: "test@example.com",
      message: "Verification email sent",
    };

    vi.mocked(AuthService.register).mockResolvedValue(mockResult);

    const req = createMockRequest({
      firstName: "Test",
      lastName: "User",
      businessEmail: "test@example.com",
    });

    const response = await POST(req);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("Verification email sent");
    expect(data.data).toEqual(mockResult);
  });

  it("should return 400 for validation errors (invalid email)", async () => {
    const req = createMockRequest({
      firstName: "Test",
      lastName: "User",
      businessEmail: "invalid-email",
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Validation failed");
  });

  it("should return 400 for validation errors (missing fields)", async () => {
    const req = createMockRequest({
      firstName: "T",
      businessEmail: "test@example.com",
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Validation failed");
  });

  it("should return 409 when email already exists", async () => {
    vi.mocked(AuthService.register).mockRejectedValue(
      new ConflictError("Email already exists"),
    );

    const req = createMockRequest({
      firstName: "Test",
      lastName: "User",
      businessEmail: "existing@example.com",
    });

    const response = await POST(req);

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Email already exists");
  });

  it("should return 500 for unexpected errors", async () => {
    vi.mocked(AuthService.register).mockRejectedValue(new Error("Unexpected"));

    const req = createMockRequest({
      firstName: "Test",
      lastName: "User",
      businessEmail: "test@example.com",
    });

    const response = await POST(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Internal server error");
  });
});


