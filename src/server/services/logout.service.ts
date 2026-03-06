import { db } from "../db";
import { sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { JWTTokenService } from "./jwt-token.service";
import { InternalLogoutError } from "../utils/logout-errors";
import { Logger } from "./logger.service";

export class LogoutService {
    
    static async logout(refreshToken?: string | null, metadata?: { ipAddress?: string; userAgent?: string }) {
        if (!refreshToken) {
            Logger.info("No token provided for logout", { ip: metadata?.ipAddress });
            return;
        }

        try {
            const payload = await JWTTokenService.verifyToken(refreshToken);

            if (!payload) {
                Logger.info("Invalid or expired token provided for logout", { ip: metadata?.ipAddress });
                return;
            }

            const sessionId = payload.sessionId as string | undefined;

            if (sessionId) {
                await db.delete(sessions).where(eq(sessions.id, sessionId));
                Logger.info(`Session invalidated`, { sessionId, ip: metadata?.ipAddress });
            } else {
                Logger.info("Token missing sessionId, no session invalidated", { ip: metadata?.ipAddress });
            }
        } catch (error) {
            Logger.error("Logout process failed", { error, ip: metadata?.ipAddress });
            throw new InternalLogoutError();
        }
    }
}
