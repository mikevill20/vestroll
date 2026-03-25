import { eq } from "drizzle-orm";
import { db, users, userStatusEnum, signerTypeEnum } from "../db";

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
function validateAvatarUrl(avatarUrl: string | undefined): void {
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
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user || null;
  }

  static async create(data: {
    firstName: string;
    lastName: string;
    email: string;
  }) {
    const [user] = await db
      .insert(users)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
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

  static async updateStatus(userId: string, status: UserStatus) {
    const [updatedUser] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser || null;
  }

  static async update(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      role?: string;
      organizationName?: string;
    },
  ) {
    // Validate avatar URL if provided
    if (data.avatarUrl !== undefined) {
      validateAvatarUrl(data.avatarUrl);
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser || null;
  }
}
