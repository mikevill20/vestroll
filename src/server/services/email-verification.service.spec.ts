import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EmailVerificationService } from "./email-verification.service";
import { UserService } from "./user.service";
import { OTPService } from "./otp.service";
import { db, emailVerifications, users } from "../db";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/errors";

vi.mock("./user.service");
vi.mock("./otp.service");
vi.mock("../db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
  emailVerifications: {},
  users: {},
}));

describe("EmailVerificationService", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    status: "pending_verification" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVerificationRecord = {
    id: "verification-123",
    userId: "user-123",
    otpHash: "hashed-otp",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    attempts: 0,
    verified: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("verifyEmail", () => {
    it("should throw NotFoundError if user does not exist", async () => {
      vi.mocked(UserService.findByEmail).mockResolvedValue(null as any);
      const promise = EmailVerificationService.verifyEmail("nonexistent@example.com", "123456");
      await expect(promise).rejects.toThrowError(NotFoundError);
      await expect(promise).rejects.toThrowError("User not found");
    });

    it("should throw BadRequestError if user is already verified", async () => {
      const activeUser = { ...mockUser, status: "active" as const };
      vi.mocked(UserService.findByEmail).mockResolvedValue(activeUser as any);

      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "123456")
      ).rejects.toThrow(BadRequestError);
      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "123456")
      ).rejects.toThrow("Email is already verified");
    });

    it("should throw NotFoundError if no verification record exists", async () => {
      vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "123456")
      ).rejects.toThrow(NotFoundError);
      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "123456")
      ).rejects.toThrow("No pending verification found for this email");
    });

    it("should throw ForbiddenError if max attempts exceeded", async () => {
      vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);
      
      const lockedRecord = { ...mockVerificationRecord, attempts: 5 };
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([lockedRecord]),
            }),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "123456")
      ).rejects.toThrow(ForbiddenError);
      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "123456")
      ).rejects.toThrow("Account locked due to too many failed verification attempts");
    });

    it("should throw BadRequestError if OTP is expired", async () => {
      vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);
      
      const expiredRecord = { 
        ...mockVerificationRecord, 
        expiresAt: new Date(Date.now() - 1000)
      };
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([expiredRecord]),
            }),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "123456")
      ).rejects.toThrow(BadRequestError);
      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "123456")
      ).rejects.toThrow("Verification code has expired");
    });

    it("should increment attempts and throw BadRequestError for invalid OTP", async () => {
      vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(OTPService.verifyOTP).mockResolvedValue(false);
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockVerificationRecord]),
            }),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      vi.mocked(db.update).mockImplementation(mockUpdate);

      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "wrong-otp")
      ).rejects.toThrow(BadRequestError);
      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "wrong-otp")
      ).rejects.toThrow("Invalid verification code. 4 attempts remaining.");

      expect(db.update).toHaveBeenCalled();
    });

    it("should throw ForbiddenError on 5th failed attempt", async () => {
      vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(OTPService.verifyOTP).mockResolvedValue(false);
      
      const recordWith4Attempts = { ...mockVerificationRecord, attempts: 4 };
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([recordWith4Attempts]),
            }),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      vi.mocked(db.update).mockImplementation(mockUpdate);

      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "wrong-otp")
      ).rejects.toThrow(ForbiddenError);
      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "wrong-otp")
      ).rejects.toThrow("Account locked due to too many failed verification attempts");
    });

    it("should successfully verify email with valid OTP", async () => {
      vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(OTPService.verifyOTP).mockResolvedValue(true);
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockVerificationRecord]),
            }),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        const txMock = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
        };
        return callback(txMock as never);
      });

      const result = await EmailVerificationService.verifyEmail(
        "test@example.com",
        "123456"
      );

      expect(result).toEqual({
        success: true,
        message: "Email verified successfully",
        user: {
          id: mockUser.id,
          email: mockUser.email,
          status: "active",
        },
      });
    });

    it("should call OTPService.verifyOTP with correct parameters", async () => {
      vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(OTPService.verifyOTP).mockResolvedValue(true);
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockVerificationRecord]),
            }),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        const txMock = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
        };
        return callback(txMock as never);
      });

      await EmailVerificationService.verifyEmail("test@example.com", "123456");

      expect(OTPService.verifyOTP).toHaveBeenCalledWith(
        "123456",
        mockVerificationRecord.otpHash
      );
    });

    it("should show singular 'attempt' when 1 attempt remaining", async () => {
      vi.mocked(UserService.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(OTPService.verifyOTP).mockResolvedValue(false);
      
      const recordWith3Attempts = { ...mockVerificationRecord, attempts: 3 };
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([recordWith3Attempts]),
            }),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      vi.mocked(db.update).mockImplementation(mockUpdate);

      await expect(
        EmailVerificationService.verifyEmail("test@example.com", "wrong-otp")
      ).rejects.toThrow("Invalid verification code. 1 attempt remaining.");
    });
  });
});
