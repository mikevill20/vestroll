import { db } from "../db";
import { users } from "../db/schema";
import { eq, sql } from "drizzle-orm";

export class AccountLockoutService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000;

  static isLocked(user: typeof users.$inferSelect): boolean {
    if (!user.lockedUntil) return false;
    return new Date() < user.lockedUntil;
  }

  static async incrementFailures(userId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) return;

    const newAttempts = user.failedLoginAttempts + 1;
    let lockedUntil = user.lockedUntil;

    if (newAttempts >= this.MAX_ATTEMPTS) {
      lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS);
    }

    await db
      .update(users)
      .set({
        failedLoginAttempts: newAttempts,
        lockedUntil,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  static async resetFailures(userId: string) {
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}
