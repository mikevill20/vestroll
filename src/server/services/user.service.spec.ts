import { describe, it, expect, beforeEach, vi } from "vitest";
import { UserService } from "./user.service";
import { db, users } from "../db";
type InsertChain = {
  values: ReturnType<typeof vi.fn>;
};

type SelectChain = {
  from: ReturnType<typeof vi.fn>;
};

type UserCreateTx = Parameters<typeof UserService.create>[1];

vi.mock("../db", () => ({
  db: {
    transaction: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  users: {},
  userStatusEnum: {
    enumValues: ["pending_verification", "active", "inactive"],
  },
  signerTypeEnum: {
    enumValues: ["individual", "organization"],
  },
}));

vi.mock("./audit-log.service", () => ({
  AuditLogService: {
    logEmailChange: vi.fn(),
    logRoleChange: vi.fn(),
  },
}));

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a user with normalized email", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "JOHN.DOE@example.com  ",
      };

      const mockUser = {
        id: "user-123",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        status: "pending_verification",
        passwordHash: null,
        avatarUrl: null,
        role: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        failedTwoFactorAttempts: 0,
        twoFactorLockoutUntil: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        oauthProvider: null,
        oauthId: null,
        signerType: "individual",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockUser]);

      const mockValues = vi.fn().mockReturnValue({
        returning: mockReturning,
      });

      vi.mocked(db.insert).mockReturnValue({
        values: mockValues,
      } as any);

      const result = await UserService.create(userData);

      expect(db.insert).toHaveBeenCalledWith(users);
      expect(mockValues).toHaveBeenCalledWith({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        status: "pending_verification",
      });
      expect(result).toEqual(mockUser);
      expect(result.email).toBe("john.doe@example.com");
    });

    it("should accept an optional transaction context", async () => {
      const userData = {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
      };

      const mockUser = {
        id: "user-456",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        status: "pending_verification",
        passwordHash: null,
        avatarUrl: null,
        role: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        failedTwoFactorAttempts: 0,
        twoFactorLockoutUntil: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        oauthProvider: null,
        oauthId: null,
        signerType: "individual",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockUser]);

      const mockValues = vi.fn().mockReturnValue({
        returning: mockReturning,
      });

      const mockTx = {
        insert: vi.fn().mockReturnValue({
          values: mockValues,
        }),
      };

      const result = await UserService.create(userData, mockTx as any);

      expect(mockTx.insert).toHaveBeenCalledWith(users);
      expect(mockValues).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        status: "pending_verification",
      });
      expect(result).toEqual(mockUser);
    });

    it("should use db directly when no transaction is provided", async () => {
      const userData = {
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob.johnson@example.com",
      };

      const mockUser = {
        id: "user-789",
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob.johnson@example.com",
        status: "pending_verification",
        passwordHash: null,
        avatarUrl: null,
        role: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        failedTwoFactorAttempts: 0,
        twoFactorLockoutUntil: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        oauthProvider: null,
        oauthId: null,
        signerType: "individual",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockUser]);

      const mockValues = vi.fn().mockReturnValue({
        returning: mockReturning,
      });

      vi.mocked(db.insert).mockReturnValue({
        values: mockValues,
      } as InsertChain);

      const result = await UserService.create(userData);

      expect(db.insert).toHaveBeenCalledWith(users);
      expect(result).toEqual(mockUser);
    });

    it("should verify rollback behavior when downstream operation fails in transaction", async () => {
      const userData = {
        firstName: "Alice",
        lastName: "Williams",
        email: "alice.williams@example.com",
      };

      const mockUser = {
        id: "user-101",
        firstName: "Alice",
        lastName: "Williams",
        email: "alice.williams@example.com",
        status: "pending_verification",
        passwordHash: null,
        avatarUrl: null,
        role: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        failedTwoFactorAttempts: 0,
        twoFactorLockoutUntil: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        oauthProvider: null,
        oauthId: null,
        signerType: "individual",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockUser]);

      const mockValues = vi.fn().mockReturnValue({
        returning: mockReturning,
      });

      const mockTx = {
        insert: vi.fn().mockReturnValue({
          values: mockValues,
        }),
      };

      const transactionCallback = vi.fn(async (callback) => {
        try {
          const result = await callback(mockTx);
          return result;
        } catch (error) {
          throw error;
        }
      });

      vi.mocked(db.transaction).mockImplementation(transactionCallback as never);

      const result = await UserService.create(userData, mockTx as any);

      expect(result).toEqual(mockUser);
      expect(mockTx.insert).toHaveBeenCalledWith(users);
    });

    it("should handle transaction context with multiple DB operations", async () => {
      const userData = {
        firstName: "Charlie",
        lastName: "Brown",
        email: "charlie.brown@example.com",
      };

      const mockUser = {
        id: "user-200",
        firstName: "Charlie",
        lastName: "Brown",
        email: "charlie.brown@example.com",
        status: "pending_verification",
        passwordHash: null,
        avatarUrl: null,
        role: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        failedTwoFactorAttempts: 0,
        twoFactorLockoutUntil: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        oauthProvider: null,
        oauthId: null,
        signerType: "individual",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockUser]);

      const mockValues = vi.fn().mockReturnValue({
        returning: mockReturning,
      });

      const mockTx = {
        insert: vi.fn().mockReturnValue({
          values: mockValues,
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };

      const result = await UserService.create(userData, mockTx as any);

      expect(result).toEqual(mockUser);
      expect(mockTx.insert).toHaveBeenCalledWith(users);
      expect(result.id).toBe("user-200");
    });

    it("should normalize email addresses with different formats", async () => {
      const testCases = [
        { input: "Test@Example.com   ", expected: "test@example.com" },
        { input: "  UPPERCASE@DOMAIN.COM", expected: "uppercase@domain.com" },
        {
          input: "mixed.Case@Example.co.uk ",
          expected: "mixed.case@example.co.uk",
        },
      ];

      const mockUser = {
        id: "user-300",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        status: "pending_verification",
        passwordHash: null,
        avatarUrl: null,
        role: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        failedTwoFactorAttempts: 0,
        twoFactorLockoutUntil: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        oauthProvider: null,
        oauthId: null,
        signerType: "individual",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      for (const testCase of testCases) {
        vi.clearAllMocks();

        const mockReturning = vi.fn().mockResolvedValue([mockUser]);

        const mockValues = vi.fn().mockReturnValue({
          returning: mockReturning,
        });

        vi.mocked(db.insert).mockReturnValue({
          values: mockValues,
        } as InsertChain);

        await UserService.create({
          firstName: "Test",
          lastName: "User",
          email: testCase.input,
        });

        const callArgs = mockValues.mock.calls[0][0];
        expect(callArgs.email).toBe(testCase.expected);
      }
    });
  });

  describe("findByEmail", () => {
    it("should find a user by email", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        status: "active" as const,
        passwordHash: null,
        avatarUrl: null,
        role: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        failedTwoFactorAttempts: 0,
        twoFactorLockoutUntil: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        oauthProvider: null,
        oauthId: null,
        signerType: "individual",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLimit = vi.fn().mockResolvedValue([mockUser]);

      const mockWhere = vi.fn().mockReturnValue({
        limit: mockLimit,
      });

      const mockFrom = vi.fn().mockReturnValue({
        where: mockWhere,
      });

      vi.mocked(db.select).mockReturnValue({
        from: mockFrom,
      } as SelectChain);

      const result = await UserService.findByEmail("TEST@EXAMPLE.COM  ");

      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(users);
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);

      const mockWhere = vi.fn().mockReturnValue({
        limit: mockLimit,
      });

      const mockFrom = vi.fn().mockReturnValue({
        where: mockWhere,
      });

      vi.mocked(db.select).mockReturnValue({
        from: mockFrom,
      } as SelectChain);

      const result = await UserService.findByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });
});
