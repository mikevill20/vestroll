import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import {
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
} from "@/server/utils/errors";

vi.mock("@/server/services/auth.service");
vi.mock("@/server/utils/auth", () => ({
  AuthUtils: {
    getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
    getUserAgent: vi.fn().mockReturnValue("test-agent"),
  },
}));

describe("POST /api/v1/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>): NextRequest => {
    return {
      json: async () => body,
      headers: new Headers(),
    } as unknown as NextRequest;
  };

  it("should successfully login with valid credentials", async () => {
    const mockResult = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: {
        id: "user-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
    };

    vi.mocked(AuthService.login).mockResolvedValue(mockResult);

    const req = createMockRequest({
      email: "test@example.com",
      password: "password123",
      rememberMe: true,
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockResult);

    expect(response.cookies.get("refreshToken")?.value).toBe("refresh-token");
  });

  it("should return 400 for validation errors", async () => {
    const req = createMockRequest({
      email: "invalid-email",

    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid request body");
  });

  it("should return 401 for invalid credentials", async () => {
    vi.mocked(AuthService.login).mockRejectedValue(
      new UnauthorizedError("Invalid email or password"),
    );

    const req = createMockRequest({
      email: "test@example.com",
      password: "wrong-password",
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid email or password");
  });

  it("should return 403 when account is verification pending", async () => {
    vi.mocked(AuthService.login).mockRejectedValue(
      new ForbiddenError(
        "Account verification pending. Please check your email.",
      ),
    );

    const req = createMockRequest({
      email: "unverified@example.com",
      password: "password123",
    });

    const response = await POST(req);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe(
      "Account verification pending. Please check your email.",
    );
  });

  it("should return 500 for unexpected errors", async () => {
    vi.mocked(AuthService.login).mockRejectedValue(new Error("Unexpected"));

    const req = createMockRequest({
      email: "test@example.com",
      password: "password123",
    });

    const response = await POST(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Internal server error");
  });
});


