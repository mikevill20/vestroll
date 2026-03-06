import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { TokenRefreshService } from "@/server/services/token-refresh.service";
import { AuthUtils } from "@/server/utils/auth";
import { AppError } from "@/server/utils/errors";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));
vi.mock("@/server/services/token-refresh.service");
vi.mock("@/server/utils/auth");

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any = {}): NextRequest => {
    return {
      json: async () => body,
      headers: new Headers(),
    } as unknown as NextRequest;
  };

  it("should successfully refresh token using cookie", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "cookie-rt" }),
    };
    const mockResult = { accessToken: "new-at", refreshToken: "new-rt" };

    vi.mocked(cookies as any).mockResolvedValue(mockCookieStore);
    vi.mocked(TokenRefreshService.refresh).mockResolvedValue(mockResult as any);

    const req = createMockRequest();
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.accessToken).toBe("new-at");

    expect(response.cookies.get("refreshToken")?.value).toBe("new-rt");
  });

  it("should return 400 if no refresh token provided", async () => {
    vi.mocked(cookies as any).mockResolvedValue({ get: () => undefined });

    const req = createMockRequest({});
    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Refresh token is required");
  });

  it("should handle service errors", async () => {
    vi.mocked(cookies as any).mockResolvedValue({
      get: () => ({ value: "rt" }),
    });
    vi.mocked(TokenRefreshService.refresh).mockRejectedValue(
      new AppError("Invalid token", 401),
    );

    const req = createMockRequest();
    const response = await POST(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.message).toBe("Invalid token");
  });
});
