import bcrypt from "bcryptjs";
import { Logger } from "./logger.service";

export class PasswordVerificationService {
  static async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      Logger.error("Password verification failed", { error: String(error) });
      return false;
    }
  }

  static async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }
}
