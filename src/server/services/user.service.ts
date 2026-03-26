import { eq, sql } from "drizzle-orm";
import { db, users, userStatusEnum, signerTypeEnum } from "../db";
import { AuditLogService } from "./audit-log.service";

export type UserStatus = (typeof userStatusEnum.enumValues)[number];
export type SignerType = (typeof signerTypeEnum.enumValues)[number];


// Whitelist of allowed domains for avatar URLs
const ALLOWED_AVATAR_DOMAINS = [
  "vestroll-assets.s3.amazonaws.com",
  "res.cloudinary.com",
  "s3.amazonaws.com",
  "storage.googleapis.com",
];

// Validate avatar URL domain against whitelist
function validateAvatarUrl(avatarUrl: string | null | undefined): void {
  if (!avatarUrl) return; // Allow null/undefined values

  try {
    const url = new URL(avatarUrl);
    const hostname = url.hostname.toLowerCase();

    const isAllowed = ALLOWED_AVATAR_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );

    if (!isAllowed) {
      throw new Error(
        `Avatar URL domain '${hostname}' is not allowed. Allowed domains: ${ALLOWED_AVATAR_DOMAINS.join(", ")}`,
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Avatar URL domain")) {
      throw error;
    }
    throw new Error("Invalid avatar URL format");
  }
}

export class UserService {
  static async findByEmail(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${normalizedEmail}`)
      .limit(1);

    return user || null;
  }

  static async create(data: {
    firstName: string;
    lastName: string;
    email: string;
  }) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const [user] = await db
      .insert(users)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: normalizedEmail,
        status: "pending_verification",
      })
      .returning();

    return user;
  }

  static async findById(id: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  }

  static async update(
    userId: string,
    data: Partial<typeof users.$inferInsert>,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    if (data.avatarUrl !== undefined) {
      validateAvatarUrl(data.avatarUrl);
    }

    const oldUser = await this.findById(userId);
    if (!oldUser) return null;

    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser) {
      if (data.email && data.email !== oldUser.email) {
        await AuditLogService.logEmailChange({
          userId,
          oldEmail: oldUser.email,
          newEmail: updatedUser.email,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        });
      }
      if (data.role && data.role !== oldUser.role) {
        await AuditLogService.logRoleChange({
          userId,
          oldRole: oldUser.role || "N/A",
          newRole: updatedUser.role || "N/A",
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        });
      }
    }

    return updatedUser || null;
  }
}
