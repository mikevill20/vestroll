import { describe, it, expect } from "vitest";
import {
  VerifySetupSchema,
  VerifyTwoFactorSchema,
  DisableTwoFactorSchema,
  RegenerateBackupCodesSchema,
} from "./two-factor.schema";

describe("Two-Factor Validation Schemas", () => {
  describe("VerifySetupSchema", () => {
    it("should accept valid 6-digit TOTP code", () => {
      const result = VerifySetupSchema.safeParse({ totpCode: "123456" });
      expect(result.success).toBe(true);
    });

    it("should reject TOTP code with less than 6 digits", () => {
      const result = VerifySetupSchema.safeParse({ totpCode: "12345" });
      expect(result.success).toBe(false);
    });

    it("should reject TOTP code with more than 6 digits", () => {
      const result = VerifySetupSchema.safeParse({ totpCode: "1234567" });
      expect(result.success).toBe(false);
    });

    it("should reject TOTP code with letters", () => {
      const result = VerifySetupSchema.safeParse({ totpCode: "12345a" });
      expect(result.success).toBe(false);
    });

    it("should reject empty TOTP code", () => {
      const result = VerifySetupSchema.safeParse({ totpCode: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("VerifyTwoFactorSchema", () => {
    it("should accept valid userId with TOTP code", () => {
      const result = VerifyTwoFactorSchema.safeParse({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        totpCode: "123456",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid userId with backup code", () => {
      const result = VerifyTwoFactorSchema.safeParse({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        backupCode: "ABCD-1234-EFGH",
      });
      expect(result.success).toBe(true);
    });

    it("should reject when neither TOTP nor backup code is provided", () => {
      const result = VerifyTwoFactorSchema.safeParse({
        userId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid userId format", () => {
      const result = VerifyTwoFactorSchema.safeParse({
        userId: "not-a-uuid",
        totpCode: "123456",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid backup code format", () => {
      const result = VerifyTwoFactorSchema.safeParse({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        backupCode: "invalid-format",
      });
      expect(result.success).toBe(false);
    });

    it("should accept both TOTP and backup code (TOTP takes precedence in service)", () => {
      const result = VerifyTwoFactorSchema.safeParse({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        totpCode: "123456",
        backupCode: "ABCD-1234-EFGH",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("DisableTwoFactorSchema", () => {
    it("should accept valid password and TOTP code", () => {
      const result = DisableTwoFactorSchema.safeParse({
        password: "securePassword123",
        totpCode: "123456",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty password", () => {
      const result = DisableTwoFactorSchema.safeParse({
        password: "",
        totpCode: "123456",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing password", () => {
      const result = DisableTwoFactorSchema.safeParse({
        totpCode: "123456",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing TOTP code", () => {
      const result = DisableTwoFactorSchema.safeParse({
        password: "securePassword123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("RegenerateBackupCodesSchema", () => {
    it("should accept valid TOTP code", () => {
      const result = RegenerateBackupCodesSchema.safeParse({
        totpCode: "123456",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid TOTP code", () => {
      const result = RegenerateBackupCodesSchema.safeParse({
        totpCode: "12345",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing TOTP code", () => {
      const result = RegenerateBackupCodesSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Backup Code Format Validation", () => {
    const validBackupCodes = [
      "ABCD-1234-EFGH",
      "0000-0000-0000",
      "ZZZZ-9999-AAAA",
      "A1B2-C3D4-E5F6",
    ];

    const invalidBackupCodes = [
      "ABCD-1234",
      "ABCD-1234-EFGH-IJKL",
      "abcd-1234-efgh",
      "ABCD1234EFGH",
      "ABCD_1234_EFGH",
      "ABC-1234-EFGHI",
      "ABCD-123-EFGH",
    ];

    validBackupCodes.forEach((code) => {
      it(`should accept valid backup code format: ${code}`, () => {
        const result = VerifyTwoFactorSchema.safeParse({
          userId: "550e8400-e29b-41d4-a716-446655440000",
          backupCode: code,
        });
        expect(result.success).toBe(true);
      });
    });

    invalidBackupCodes.forEach((code) => {
      it(`should reject invalid backup code format: ${code}`, () => {
        const result = VerifyTwoFactorSchema.safeParse({
          userId: "550e8400-e29b-41d4-a716-446655440000",
          backupCode: code,
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
