import { db, milestones } from "../db";
import { eq } from "drizzle-orm";
import { BadRequestError, NotFoundError } from "../utils/errors";

export class MilestoneService {
  static async updateMilestoneStatus(
    milestoneId: string,
    status: "pending" | "in_progress" | "completed" | "approved" | "rejected"
  ) {
    const [milestone] = await db
      .select()
      .from(milestones)
      .where(eq(milestones.id, milestoneId))
      .limit(1);

    if (!milestone) {
      throw new NotFoundError("Milestone not found");
    }

    const terminalStates = ["approved", "rejected"];
    if (terminalStates.includes(milestone.status)) {
      throw new BadRequestError("Cannot update milestone in terminal state");
    }

    const [updated] = await db
      .update(milestones)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(milestones.id, milestoneId))
      .returning({
        id: milestones.id,
        status: milestones.status,
        updatedAt: milestones.updatedAt,
      });

    return updated;
  }
}
