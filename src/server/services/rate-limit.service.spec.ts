import { describe, it, expect, beforeEach, vi } from "vitest";
import { RateLimitService } from "./rate-limit.service";
import { db } from "../db";

type DbSelect = typeof db.select;

vi.mock("../db", () => ({
  db: {
    select: vi.fn(),
  },
}));

describe("RateLimitService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow request when under rate limit", async () => {

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 2 }]),
      }),
    });
    (db.select as unknown as DbSelect) = mockSelect;

    const result = await RateLimitService.checkResendLimit("user-id-123");

    expect(result.isLimited).toBe(false);
    expect(result.requestCount).toBe(2);
    expect(result.retryAfter).toBeUndefined();
  });

  it("should block request when rate limit exceeded", async () => {
    const now = new Date();
    const oldestRequest = new Date(now.getTime() - 4 * 60 * 1000);

    const mockSelectCount = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 3 }]),
      }),
    });

    const mockSelectOldest = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ createdAt: oldestRequest }]),
          }),
        }),
      }),
    });

    let callCount = 0;
    (db.select as unknown as DbSelect) = vi.fn(() => {
      callCount++;
      return callCount === 1 ? mockSelectCount() : mockSelectOldest();
    });

    const result = await RateLimitService.checkResendLimit("user-id-123");

    expect(result.isLimited).toBe(true);
    expect(result.requestCount).toBe(3);
    expect(result.retryAfter).toBeInstanceOf(Date);
    expect(result.retryAfter!.getTime()).toBeGreaterThan(now.getTime());
  });

  it("should allow request with 0 previous attempts", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    });
    (db.select as unknown as DbSelect) = mockSelect;

    const result = await RateLimitService.checkResendLimit("user-id-123");

    expect(result.isLimited).toBe(false);
    expect(result.requestCount).toBe(0);
  });

  it("should calculate retry-after correctly", async () => {
    const now = new Date();
    const oldestRequest = new Date(now.getTime() - 2 * 60 * 1000);

    const mockSelectCount = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 5 }]),
      }),
    });

    const mockSelectOldest = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ createdAt: oldestRequest }]),
          }),
        }),
      }),
    });

    let callCount = 0;
    (db.select as unknown as DbSelect) = vi.fn(() => {
      callCount++;
      return callCount === 1 ? mockSelectCount() : mockSelectOldest();
    });

    const result = await RateLimitService.checkResendLimit("user-id-123");

    expect(result.isLimited).toBe(true);

    const retryInMs = result.retryAfter!.getTime() - now.getTime();
    expect(retryInMs).toBeGreaterThan(2.5 * 60 * 1000);
    expect(retryInMs).toBeLessThan(3.5 * 60 * 1000);
  });
});
