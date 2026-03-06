import { describe, it, expect } from "vitest";
import { OTPService } from "./otp.service";

describe("OTPService", () => {
  it("should generate a 6-digit OTP", () => {
    const otp = OTPService.generateOTP();
    expect(otp).toHaveLength(6);
    expect(/^\d+$/.test(otp)).toBe(true);
  });

  it("should generate random OTPs", () => {
    const otp1 = OTPService.generateOTP();
    const otp2 = OTPService.generateOTP();
    expect(otp1).not.toBe(otp2);
  });

  it("should hash and verify OTP", async () => {
    const otp = "123456";
    const hash = await OTPService.hashOTP(otp);
    expect(hash).not.toBe(otp);

    const isValid = await OTPService.verifyOTP(otp, hash);
    expect(isValid).toBe(true);

    const isInvalid = await OTPService.verifyOTP("654321", hash);
    expect(isInvalid).toBe(false);
  }, 10000);
});
