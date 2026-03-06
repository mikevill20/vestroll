import { describe, it, expect, beforeAll } from "vitest";
import { TwoFactorService } from "./two-factor.service";

beforeAll(() => {
  process.env.TWO_FACTOR_ENCRYPTION_KEY = "test-encryption-key-for-unit-tests-only";
});

describe("TwoFactorService", () => {
  describe("Secret Generation", () => {
    it("should generate a secret", () => {
      const secret = TwoFactorService.generateSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe("string");
      expect(secret.length).toBeGreaterThan(10);
    });

    it("should generate unique secrets", () => {
      const secret1 = TwoFactorService.generateSecret();
      const secret2 = TwoFactorService.generateSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe("Encryption/Decryption", () => {
    it("should encrypt and decrypt text correctly", () => {
      const originalText = "test-secret-key-12345";
      const encrypted = TwoFactorService.encrypt(originalText);
      const decrypted = TwoFactorService.decrypt(encrypted);

      expect(encrypted).not.toBe(originalText);
      expect(decrypted).toBe(originalText);
    });

    it("should produce different ciphertext for same plaintext (due to random IV)", () => {
      const text = "same-text";
      const encrypted1 = TwoFactorService.encrypt(text);
      const encrypted2 = TwoFactorService.encrypt(text);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should handle special characters", () => {
      const text = "special!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const encrypted = TwoFactorService.encrypt(text);
      const decrypted = TwoFactorService.decrypt(encrypted);

      expect(decrypted).toBe(text);
    });

    it("should throw on invalid encrypted format", () => {
      expect(() => TwoFactorService.decrypt("invalid-format")).toThrow();
    });
  });

  describe("Backup Code Generation", () => {
    it("should generate 10 backup codes by default", () => {
      const codes = TwoFactorService.generateBackupCodes();
      expect(codes).toHaveLength(10);
    });

    it("should generate codes in correct format (XXXX-XXXX-XXXX)", () => {
      const codes = TwoFactorService.generateBackupCodes();
      const formatRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

      codes.forEach((code) => {
        expect(formatRegex.test(code)).toBe(true);
      });
    });

    it("should generate unique codes", () => {
      const codes = TwoFactorService.generateBackupCodes();
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe("Backup Code Hashing & Verification", () => {
    it("should hash and verify backup code", async () => {
      const code = "ABCD-1234-EFGH";
      const hash = await TwoFactorService.hashBackupCode(code);

      expect(hash).not.toBe(code);
      expect(await TwoFactorService.verifyBackupCode(code, hash)).toBe(true);
    });

    it("should normalize codes before hashing (case insensitive)", async () => {
      const code = "ABCD-1234-EFGH";
      const hash = await TwoFactorService.hashBackupCode(code);

      expect(await TwoFactorService.verifyBackupCode("abcd-1234-efgh", hash)).toBe(true);
    });

    it("should normalize codes by removing dashes", async () => {
      const code = "ABCD-1234-EFGH";
      const hash = await TwoFactorService.hashBackupCode(code);

      expect(await TwoFactorService.verifyBackupCode("ABCD1234EFGH", hash)).toBe(true);
    });

    it("should reject incorrect backup code", async () => {
      const code = "ABCD-1234-EFGH";
      const hash = await TwoFactorService.hashBackupCode(code);

      expect(await TwoFactorService.verifyBackupCode("XXXX-XXXX-XXXX", hash)).toBe(false);
    });
  });

  describe("TOTP Verification", () => {
    it("should verify valid TOTP code", async () => {

      const { generate } = await import("otplib");
      const secret = TwoFactorService.generateSecret();

      const token = await generate({ secret });

      const isValid = await TwoFactorService.verifyTOTP(token, secret);
      expect(isValid).toBe(true);
    });

    it("should reject invalid TOTP code", async () => {
      const secret = TwoFactorService.generateSecret();
      const isValid = await TwoFactorService.verifyTOTP("000000", secret);
      expect(isValid).toBe(false);
    });

    it("should reject malformed TOTP code", async () => {
      const secret = TwoFactorService.generateSecret();
      const isValid = await TwoFactorService.verifyTOTP("not-a-code", secret);
      expect(isValid).toBe(false);
    });
  });

  describe("QR Code Generation", () => {
    it("should generate QR code data URL", async () => {
      const secret = TwoFactorService.generateSecret();
      const qrCode = await TwoFactorService.generateQRCode("test@example.com", secret);

      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it("should include email in the QR code", async () => {
      const secret = TwoFactorService.generateSecret();
      const email = "user@vestroll.com";

      const qrCode = await TwoFactorService.generateQRCode(email, secret);
      expect(qrCode).toBeDefined();
    });
  });
});
