import { db, sessions } from "../db";
import { eq, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";

export class SessionService {
    static async createSession(userId: string, refreshToken: string) {
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const [session] = await db
            .insert(sessions)
            .values({
                userId,
                refreshTokenHash,
                expiresAt,
            })
            .returning();

        return session;
    }

    static async validateSession(refreshToken: string, userId: string) {
        const userSessions = await db
            .select()
            .from(sessions)
            .where(eq(sessions.userId, userId));

        for (const session of userSessions) {
            const isValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);

            if (isValid) {
                if (new Date() > session.expiresAt) {
                    await this.deleteSession(session.id);
                    return null;
                }

                await db
                    .update(sessions)
                    .set({ lastUsedAt: new Date() })
                    .where(eq(sessions.id, session.id));

                return session;
            }
        }

        return null;
    }

    static async deleteSession(sessionId: string) {
        await db.delete(sessions).where(eq(sessions.id, sessionId));
    }

    static async cleanupExpiredSessions() {
        const now = new Date();
        await db.delete(sessions).where(lt(sessions.expiresAt, now));
    }
}
