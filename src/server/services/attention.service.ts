import { db } from "../db";
import {
  users,
  contracts,
  milestones,
  invoices,
  timesheets,
  expenses,
  timeOffRequests,
} from "../db/schema";
import { eq, and, or, count } from "drizzle-orm";
import { ForbiddenError } from "../utils/errors";

export class AttentionService {
  static async getAttentionItems(userId: string) {
    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.organizationId) {
      throw new ForbiddenError("User is not associated with any organization");
    }

    const orgId = user.organizationId;

    const [
      [{ contractsPendingSignature }],
      [{ milestonesCompleted }],
      [{ invoicesRequiringPayment }],
      [{ pendingTimesheets }],
      [{ pendingExpenses }],
      [{ pendingTimeOffRequests }],
    ] = await Promise.all([
      db
        .select({ contractsPendingSignature: count() })
        .from(contracts)
        .where(
          and(
            eq(contracts.organizationId, orgId),
            eq(contracts.status, "pending_signature"),
          ),
        ),
      db
        .select({ milestonesCompleted: count() })
        .from(milestones)
        .where(
          and(
            eq(milestones.organizationId, orgId),
            eq(milestones.status, "completed"),
          ),
        ),
      db
        .select({ invoicesRequiringPayment: count() })
        .from(invoices)
        .where(
          and(
            eq(invoices.organizationId, orgId),
            or(
              eq(invoices.status, "unpaid"),
              eq(invoices.status, "overdue"),
            ),
          ),
        ),
      db
        .select({ pendingTimesheets: count() })
        .from(timesheets)
        .where(
          and(
            eq(timesheets.organizationId, orgId),
            eq(timesheets.status, "pending"),
          ),
        ),
      db
        .select({ pendingExpenses: count() })
        .from(expenses)
        .where(
          and(
            eq(expenses.organizationId, orgId),
            eq(expenses.status, "pending"),
          ),
        ),
      db
        .select({ pendingTimeOffRequests: count() })
        .from(timeOffRequests)
        .where(
          and(
            eq(timeOffRequests.organizationId, orgId),
            eq(timeOffRequests.status, "pending"),
          ),
        ),
    ]);

    return {
      contractsPendingSignature,
      milestonesCompleted,
      invoicesRequiringPayment,
      pendingTimesheets,
      pendingExpenses,
      pendingTimeOffRequests,
    };
  }
}
