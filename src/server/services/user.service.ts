import { db, users, userStatusEnum } from "../db";
import { eq, sql } from "drizzle-orm";

export type UserStatus = (typeof userStatusEnum.enumValues)[number];

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

  static async updateStatus(userId: string, status: UserStatus) {
    const [updatedUser] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser || null;
  }
}
