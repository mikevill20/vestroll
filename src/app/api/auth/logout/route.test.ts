import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/server/services/auth.service";
import { AuthUtils } from "@/server/utils/auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));
vi.mock("@/server/services/auth.service");
vi.mock("@/server/utils/auth");
vi.mock("@/server/services/logger.service");

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any = {}): NextRequest => {
    return {
      json: async () => body,
      headers: new Headers(),
    } as unknown as NextRequest;
  };

  it("should successfully logout using cookie token", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "cookie-rt" }),
    };
    vi.mocked(cookies as any).mockResolvedValue(mockCookieStore);
    vi.mocked(AuthService.logout).mockResolvedValue(undefined);

    const req = createMockRequest();
    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(AuthService.logout).toHaveBeenCalledWith(
      "cookie-rt",
      expect.any(Object),
    );

    const setCookieHeader = response.headers.get("set-cookie");
    expect(setCookieHeader).toMatch(/refreshToken/);
  });

  it("should successfully logout using body token if no cookie", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined),
      delete: vi.fn(),
    };
    vi.mocked(cookies as any).mockResolvedValue(mockCookieStore);
    vi.mocked(AuthService.logout).mockResolvedValue(undefined);

    const req = createMockRequest({ refreshToken: "body-rt" });
    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(AuthService.logout).toHaveBeenCalledWith(
      "body-rt",
      expect.any(Object),
    );
  });

  it("should return 500 if logout service fails with 500", async () => {
    vi.mocked(cookies as any).mockResolvedValue({
      get: () => ({ value: "rt" }),
      delete: vi.fn(),
    });
    vi.mocked(AuthService.logout).mockRejectedValue({
      statusCode: 500,
      message: "Fail",
    });

    const req = createMockRequest();
    const response = await POST(req);

    expect(response.status).toBe(500);
  });
});
