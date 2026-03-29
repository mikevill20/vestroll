import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { AuthUtils } from "@/server/utils/auth";
import {
  UnauthorizedError,
  BadRequestError,
} from "@/server/utils/errors";

vi.mock("@/server/services/auth.service");
vi.mock("@/server/utils/auth");

describe("POST /api/v1/auth/change-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
      headers: new Headers(),
    } as unknown as NextRequest;
  };

  const mockAuthUser = {
    userId: "user-123",
    email: "test@example.com",
    user: {
      id: "user-123",
      passwordHash: "$2a$10$hashedpassword",
      firstName: "Test",
    },
  };

  it("should change password successfully", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(
      mockAuthUser as any,
    );
    vi.mocked(AuthService.changePassword).mockResolvedValue(undefined);

    const req = createMockRequest({
      currentPassword: "OldPassword123",
      newPassword: "NewPassword456",
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("Password changed successfully");
    expect(AuthService.changePassword).toHaveBeenCalledWith(
      "user-123",
      "$2a$10$hashedpassword",
      "OldPassword123",
      "NewPassword456",
    );
  });

  it("should return 401 for unauthenticated request", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError(),
    );

    const req = createMockRequest({
      currentPassword: "OldPassword123",
      newPassword: "NewPassword456",
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("should return 401 for incorrect current password", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(
      mockAuthUser as any,
    );
    vi.mocked(AuthService.changePassword).mockRejectedValue(
      new UnauthorizedError("Current password is incorrect"),
    );

    const req = createMockRequest({
      currentPassword: "WrongPassword",
      newPassword: "NewPassword456",
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Current password is incorrect");
  });

  it("should return 400 for OAuth-only account with no password", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(
      mockAuthUser as any,
    );
    vi.mocked(AuthService.changePassword).mockRejectedValue(
      new BadRequestError(
        "No password set for this account. Password change is not available for OAuth-only accounts.",
      ),
    );

    const req = createMockRequest({
      currentPassword: "anything",
      newPassword: "NewPassword456",
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain("No password set for this account");
  });

  it("should return 400 when new password is same as current", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(
      mockAuthUser as any,
    );
    vi.mocked(AuthService.changePassword).mockRejectedValue(
      new BadRequestError(
        "New password must be different from current password",
      ),
    );

    const req = createMockRequest({
      currentPassword: "SamePassword123",
      newPassword: "SamePassword123",
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe(
      "New password must be different from current password",
    );
  });

  it("should return 400 for validation errors - missing current password", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(
      mockAuthUser as any,
    );

    const req = createMockRequest({
      currentPassword: "",
      newPassword: "NewPassword456",
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Validation failed");
    expect(data.errors.fieldErrors.currentPassword).toBeDefined();
  });

  it("should return 400 for validation errors - new password too short", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(
      mockAuthUser as any,
    );

    const req = createMockRequest({
      currentPassword: "OldPassword123",
      newPassword: "short",
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Validation failed");
    expect(data.errors.fieldErrors.newPassword).toBeDefined();
  });
});


