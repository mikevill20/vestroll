import { db, users, sessions, emailVerifications, backupCodes, trustedDevices, twoFactorAttempts, loginAttempts } from "../db";
import { eq } from "drizzle-orm";
import { InternalServerError } from "../utils/errors";
import { Logger } from "./logger.service";
import { UserService } from "./user.service";

export class AccountDeletionService {
     
     static async deleteAccount(userId: string) {
          try {
               const user = await UserService.findById(userId);

               if (!user) {
                    Logger.warn("Attempted to delete non-existent user", { userId });
                    return;
               }

               await db.transaction(async (tx) => {

                    await tx.delete(sessions).where(eq(sessions.userId, userId));

                    try {
                         await tx.delete(emailVerifications).where(eq(emailVerifications.userId, userId));
                    } catch { }

                    try {
                         await tx.delete(backupCodes).where(eq(backupCodes.userId, userId));
                    } catch { }

                    try {
                         await tx.delete(trustedDevices).where(eq(trustedDevices.userId, userId));
                    } catch { }

                    try {
                         await tx.delete(twoFactorAttempts).where(eq(twoFactorAttempts.userId, userId));
                    } catch { }

                    try {
                         await tx.delete(loginAttempts).where(eq(loginAttempts.email, user.email));
                    } catch { }

                    await tx.delete(users).where(eq(users.id, userId));
               });

               Logger.info("User account deleted", { userId });
          } catch (error) {
               Logger.error("Account deletion failed", { error, userId });
               throw new InternalServerError("Failed to delete account");
          }
     }
}
