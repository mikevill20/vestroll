import { db } from "../db";
import { sessions } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { PasswordVerificationService } from "./password-verification.service";

export class SessionManagementService {
  static async createSession(
    userId: string,
    refreshToken: string,
    deviceInfo: unknown,
    expiresAt: Date,
    sessionId?: string
  ) {
    const refreshTokenHash = await PasswordVerificationService.hash(refreshToken);

    const [session] = await db.insert(sessions).values({
      ...(sessionId ? { id: sessionId } : {}),
      userId,
      refreshTokenHash,
      deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
      expiresAt,
    }).returning();

    return session;
  }

  static async invalidateSession(sessionId: string) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  static async invalidateAllUserSessions(userId: string) {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}
