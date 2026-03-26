import { describe, it, expect, beforeEach, vi } from "vitest";
import { OTPResendService } from "./otp-resend.service";
import { UserService } from "./user.service";
import { OTPService } from "./otp.service";
import { RateLimitService } from "./rate-limit.service";
import { db } from "../db";
import {
  NotFoundError,
  BadRequestError,
  TooManyRequestsError,
} from "../utils/errors";

type MockUser = Awaited<ReturnType<typeof UserService.findByEmail>>;
type DbTransaction = typeof db.transaction;

vi.mock("./user.service");
vi.mock("./otp.service");
vi.mock("./rate-limit.service");
vi.mock("../db", () => ({
  db: {
    transaction: vi.fn(),
  },
}));

describe("OTPResendService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("should throw NotFoundError if user does not exist", async () => {
    vi.mocked(UserService.findByEmail).mockResolvedValue(null as unknown as MockUser);

    await expect(
      OTPResendService.resendOTP("nonexistent@example.com")
    ).rejects.toThrow(NotFoundError);
    await expect(
      OTPResendService.resendOTP("nonexistent@example.com")
    ).rejects.toThrow("User not found");
  });

  it("should throw BadRequestError if user is already verified", async () => {
    const mockUser = {
      id: "user-123",
      email: "user@example.com",
      status: "active" as const,
      firstName: "John",
      lastName: "Doe",
      passwordHash: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorEnabledAt: null,
      failedTwoFactorAttempts: 0,
      twoFactorLockoutUntil: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      oauthProvider: null,
      oauthId: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);

    await expect(
      OTPResendService.resendOTP("user@example.com")
    ).rejects.toThrow(BadRequestError);
    await expect(
      OTPResendService.resendOTP("user@example.com")
    ).rejects.toThrow("User is already verified");
  });

  it("should throw TooManyRequestsError if rate limit exceeded", async () => {
    const mockUser = {
      id: "user-123",
      email: "user@example.com",
      status: "pending_verification" as const,
      firstName: "John",
      lastName: "Doe",
      passwordHash: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorEnabledAt: null,
      failedTwoFactorAttempts: 0,
      twoFactorLockoutUntil: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      oauthProvider: null,
      oauthId: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const retryAfter = new Date(Date.now() + 3 * 60 * 1000);

    vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);
    vi.mocked(RateLimitService.checkResendLimit).mockResolvedValue({
      isLimited: true,
      retryAfter,
      requestCount: 3,
    });

    await expect(
      OTPResendService.resendOTP("user@example.com")
    ).rejects.toThrow(TooManyRequestsError);
  });

  it("should successfully resend OTP for valid user", async () => {
    const mockUser = {
      id: "user-123",
      email: "user@example.com",
      status: "pending_verification" as const,
      firstName: "John",
      lastName: "Doe",
      passwordHash: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorEnabledAt: null,
      failedTwoFactorAttempts: 0,
      twoFactorLockoutUntil: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      oauthProvider: null,
      oauthId: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockOTP = "123456";
    const mockOTPHash = "hashed-otp";

    vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);
    vi.mocked(RateLimitService.checkResendLimit).mockResolvedValue({
      isLimited: false,
      requestCount: 1,
    });
    vi.mocked(OTPService.generateOTP).mockReturnValue(mockOTP);
    vi.mocked(OTPService.hashOTP).mockResolvedValue(mockOTPHash);

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const mockTransaction = vi.fn(async (callback) => {
      const tx = {
        update: mockUpdate,
        insert: mockInsert,
      };
      return await callback(tx);
    });

    (db.transaction as unknown as DbTransaction) = mockTransaction;

    const result = await OTPResendService.resendOTP("user@example.com");

    expect(result).toEqual({
      message: "Verification code resent",
      email: "user@example.com",
      userId: "user-123",
    });

    expect(UserService.findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(RateLimitService.checkResendLimit).toHaveBeenCalledWith("user-123");
    expect(OTPService.generateOTP).toHaveBeenCalled();
    expect(OTPService.hashOTP).toHaveBeenCalledWith(mockOTP);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("should invalidate previous OTP records in transaction", async () => {
    const mockUser = {
      id: "user-123",
      email: "user@example.com",
      status: "pending_verification" as const,
      firstName: "John",
      lastName: "Doe",
      passwordHash: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorEnabledAt: null,
      failedTwoFactorAttempts: 0,
      twoFactorLockoutUntil: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      oauthProvider: null,
      oauthId: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);
    vi.mocked(RateLimitService.checkResendLimit).mockResolvedValue({
      isLimited: false,
      requestCount: 0,
    });
    vi.mocked(OTPService.generateOTP).mockReturnValue("123456");
    vi.mocked(OTPService.hashOTP).mockResolvedValue("hashed");

    const mockSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    const mockUpdate = vi.fn().mockReturnValue({
      set: mockSet,
    });

    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const mockTransaction = vi.fn(async (callback) => {
      const tx = {
        update: mockUpdate,
        insert: mockInsert,
      };
      return await callback(tx);
    });

    (db.transaction as unknown as DbTransaction) = mockTransaction;

    await OTPResendService.resendOTP("user@example.com");

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({ verified: false });
  });

  it("should reset attempts counter to 0 when creating new OTP", async () => {
    const mockUser = {
      id: "user-123",
      email: "user@example.com",
      status: "pending_verification" as const,
      firstName: "John",
      lastName: "Doe",
      passwordHash: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorEnabledAt: null,
      failedTwoFactorAttempts: 0,
      twoFactorLockoutUntil: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      oauthProvider: null,
      oauthId: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);
    vi.mocked(RateLimitService.checkResendLimit).mockResolvedValue({
      isLimited: false,
      requestCount: 0,
    });
    vi.mocked(OTPService.generateOTP).mockReturnValue("123456");
    vi.mocked(OTPService.hashOTP).mockResolvedValue("hashed");

    const mockValues = vi.fn().mockResolvedValue(undefined);
    const mockInsert = vi.fn().mockReturnValue({
      values: mockValues,
    });

    const mockTransaction = vi.fn(async (callback) => {
      const tx = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
        insert: mockInsert,
      };
      return await callback(tx);
    });

    (db.transaction as unknown as DbTransaction) = mockTransaction;

    await OTPResendService.resendOTP("user@example.com");

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        attempts: 0,
      })
    );
  });
});
