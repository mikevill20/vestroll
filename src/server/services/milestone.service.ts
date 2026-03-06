import { db, milestones } from "../db";
import { eq } from "drizzle-orm";

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
      const error = new Error("Milestone not found");
      (error as any).status = 404;
      throw error;
    }

    const terminalStates = ["approved", "rejected"];
    if (terminalStates.includes(milestone.status)) {
      const error = new Error("Cannot update milestone in terminal state");
      (error as any).status = 400;
      throw error;
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
