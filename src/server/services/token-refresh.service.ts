import { db } from "../db";
import { sessions, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { JWTVerificationService } from "./jwt-verification.service";
import { JWTTokenService } from "./jwt-token.service";
import { PasswordVerificationService } from "./password-verification.service";
import {
    ExpiredTokenError,
    SessionNotFoundError,
    TokenSessionMismatchError,
    InternalAuthError
} from "../utils/auth-errors";

export class TokenRefreshService {
    static async refresh(refreshToken: string, userAgent?: string, ipAddress?: string) {
        let payload;
        try {
            payload = await JWTVerificationService.verify(refreshToken);
        } catch (error) {
            console.error(`[TokenRefresh] Verification failed for IP ${ipAddress}:`, error);
            throw error;
        }
        const sessionId = payload.sessionId as string;
        if (!sessionId) {
            console.error(`[TokenRefresh] No sessionId in token for IP ${ipAddress}`);
            throw new TokenSessionMismatchError("Token missing session ID");
        }
        const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

        if (!session) {
            console.error(`[TokenRefresh] Session ${sessionId} not found for IP ${ipAddress}`);
            throw new SessionNotFoundError();
        }
        const isValid = await PasswordVerificationService.verify(refreshToken, session.refreshTokenHash);

        if (!isValid) {
            console.error(`[TokenRefresh] Token hash mismatch for session ${sessionId}, IP ${ipAddress}. Potential replay attack.`);
            await db.delete(sessions).where(eq(sessions.id, sessionId));
            throw new TokenSessionMismatchError("Invalid refresh token");
        }
        if (new Date() > session.expiresAt) {
            console.error(`[TokenRefresh] Session ${sessionId} expired for IP ${ipAddress}`);
            await db.delete(sessions).where(eq(sessions.id, sessionId));
            throw new ExpiredTokenError("Session expired");
        }
        const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
        if (!user) {
            throw new InternalAuthError("User not found");
        }

        const accessToken = await JWTTokenService.generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        const tokenExp = payload.exp as number;

        const newRefreshToken = await JWTTokenService.generateRotatedRefreshToken({
            userId: user.id,
            email: user.email,
            sessionId
        }, tokenExp);
        const newRefreshTokenHash = await PasswordVerificationService.hash(newRefreshToken);
        await db.update(sessions).set({
            refreshTokenHash: newRefreshTokenHash,
            lastUsedAt: new Date(),
        }).where(eq(sessions.id, sessionId));

        console.log(`[TokenRefresh] Success for user ${user.id}, session ${sessionId}`);

        return {
            accessToken,
            refreshToken: newRefreshToken
        };
    }
}
