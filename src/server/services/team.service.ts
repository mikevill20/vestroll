import { db, users, organizations, milestones } from "../db";
import { eq, sql } from "drizzle-orm";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";

export class TeamService {
  static async addEmployee(data: { email: string; organizationId?: string }) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const [existingUser] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${normalizedEmail}`)
      .limit(1);

    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,

        firstName: "",
        lastName: "",
        status: "pending_verification",
        organizationId: data.organizationId || null,
      })
      .returning({
        id: users.id,
        status: users.status,
        invitedAt: users.createdAt,
      });

    return newUser;
  }

  static async updateMilestoneStatus(
    milestoneId: string,
    data: { status: "approved" | "rejected" | "in_progress"; reason?: string },
  ) {
    if (data.status === "rejected" && !data.reason) {
      throw new BadRequestError(
        "A reason is required when rejecting a milestone",
      );
    }

    const [milestone] = await db
      .select()
      .from(milestones)
      .where(eq(milestones.id, milestoneId))
      .limit(1);

    if (!milestone) {
      throw new NotFoundError("Milestone not found");
    }

    const [updated] = await db
      .update(milestones)
      .set({
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(milestones.id, milestoneId))
      .returning({
        id: milestones.id,
        newStatus: milestones.status,
        updatedAt: milestones.updatedAt,
      });

    return updated;
  }

  static async getExpenses(organizationId: string) {
    return [];
  }
}
