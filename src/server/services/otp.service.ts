import bcrypt from "bcryptjs";
import crypto from "crypto";

export class OTPService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly OTP_LENGTH = 6;

  static generateOTP(): string {
    return crypto.randomInt(0, 10 ** this.OTP_LENGTH)
      .toString()
      .padStart(this.OTP_LENGTH, "0");
  }

  static async hashOTP(otp: string): Promise<string> {
    return bcrypt.hash(otp, this.SALT_ROUNDS);
  }

  static async verifyOTP(otp: string, hashedOtp: string): Promise<boolean> {
    return bcrypt.compare(otp, hashedOtp);
  }
}
