import { describe, it, expect, beforeEach, vi } from "vitest";
import { DELETE } from "./route";
import { NextRequest } from "next/server";
import { AccountDeletionService } from "@/server/services/account-deletion.service";
import { AuthUtils } from "@/server/utils/auth";
import { AppError, UnauthorizedError } from "@/server/utils/errors";

vi.mock("@/server/db", () => ({
     db: {
          transaction: vi.fn(),
          delete: vi.fn(),
     },
}));

vi.mock("next/headers", () => ({
     cookies: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/server/services/account-deletion.service", () => ({
     AccountDeletionService: {
          deleteAccount: vi.fn(),
     },
}));

vi.mock("@/server/utils/auth", () => ({
     AuthUtils: {
          authenticateRequest: vi.fn(),
     },
}));

vi.mock("@/server/services/logger.service", () => ({
     Logger: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
     },
}));

describe("DELETE /api/v1/auth/account", () => {
     beforeEach(() => {
          vi.clearAllMocks();
     });

     const createMockRequest = (): NextRequest => {
          return {
               headers: new Headers(),
          } as unknown as NextRequest;
     };

     it("should delete account for authenticated user and return 200", async () => {
          vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({ userId: "user-123" } as any);
          vi.mocked(AccountDeletionService.deleteAccount).mockResolvedValue(undefined);

          const req = createMockRequest();
          const response = await DELETE(req);
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.message).toBe("Success");
          expect(AccountDeletionService.deleteAccount).toHaveBeenCalledOnce();
          expect(AccountDeletionService.deleteAccount).toHaveBeenCalledWith("user-123");
     });

     it("should clear the refreshToken cookie on successful deletion", async () => {
          vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({ userId: "user-123" } as any);
          vi.mocked(AccountDeletionService.deleteAccount).mockResolvedValue(undefined);

          const req = createMockRequest();
          const response = await DELETE(req);

          const setCookieHeader = response.headers.get("set-cookie");
          expect(setCookieHeader).toMatch(/refreshToken/);
          expect(setCookieHeader).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
     });

     it("should return 401 for unauthenticated request", async () => {
          vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(new UnauthorizedError());

          const req = createMockRequest();
          const response = await DELETE(req);
          const data = await response.json();

          expect(response.status).toBe(401);
          expect(data.success).toBe(false);
          expect(data.message).toBe("Authentication required");
          expect(AccountDeletionService.deleteAccount).not.toHaveBeenCalled();
     });

     it("should return 401 with custom message when UnauthorizedError has custom message", async () => {
          vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
               new UnauthorizedError("Token has expired")
          );

          const req = createMockRequest();
          const response = await DELETE(req);
          const data = await response.json();

          expect(response.status).toBe(401);
          expect(data.success).toBe(false);
          expect(data.message).toBe("Token has expired");
     });

     it("should return 500 when deletion service throws an AppError", async () => {
          vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({ userId: "user-123" } as any);
          vi.mocked(AccountDeletionService.deleteAccount).mockRejectedValue(
               new AppError("Failed to delete account", 500)
          );

          const req = createMockRequest();
          const response = await DELETE(req);
          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.success).toBe(false);
          expect(data.message).toBe("Failed to delete account");
     });

     it("should return 500 when an unexpected error is thrown", async () => {
          vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({ userId: "user-123" } as any);
          vi.mocked(AccountDeletionService.deleteAccount).mockRejectedValue(
               new Error("Unexpected database crash")
          );

          const req = createMockRequest();
          const response = await DELETE(req);
          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.success).toBe(false);
          expect(data.message).toBe("Internal server error");
     });

     it("should not call deleteAccount if authentication fails", async () => {
          vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(new UnauthorizedError());

          const req = createMockRequest();
          await DELETE(req);

          expect(AccountDeletionService.deleteAccount).not.toHaveBeenCalled();
     });
});


