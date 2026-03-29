import { describe, it, expect } from "vitest";
import { OTPService } from "./otp.service";

describe("OTPService", () => {
  describe("generateOTP", () => {
    it("should return a string of exactly 6 numeric digits", () => {
      const otp = OTPService.generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it("should always produce exactly 6 digits across 100 iterations", () => {
      for (let i = 0; i < 100; i++) {
        const otp = OTPService.generateOTP();
        expect(otp).toHaveLength(6);
        expect(otp).toMatch(/^\d{6}$/);
      }
    });

    it("should never contain alphabetic or special characters", () => {
      for (let i = 0; i < 100; i++) {
        const otp = OTPService.generateOTP();
        expect(/[a-zA-Z]/.test(otp)).toBe(false);
        expect(/[^0-9]/.test(otp)).toBe(false);
      }
    });

    it("should generate different OTPs across calls (not hardcoded)", () => {
      const otps = new Set<string>();
      for (let i = 0; i < 20; i++) {
        otps.add(OTPService.generateOTP());
      }
      // With 20 random 6-digit OTPs, we should see at least 2 unique values
      expect(otps.size).toBeGreaterThan(1);
    });
  });

  describe("hashOTP", () => {
    it("should hash and verify OTP correctly", async () => {
      const otp = "123456";
      const hash = await OTPService.hashOTP(otp);
      expect(hash).not.toBe(otp);

      const isValid = await OTPService.verifyOTP(otp, hash);
      expect(isValid).toBe(true);

      const isInvalid = await OTPService.verifyOTP("654321", hash);
      expect(isInvalid).toBe(false);
    }, 10000);
  });
});
