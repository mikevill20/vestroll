import { and, desc, eq } from "drizzle-orm";
import { db, employees, timeOffRequests, users } from "../db";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { hasAdminOrManagerRole } from "../utils/role";
import { EmailService } from "./email.service";
import { Logger } from "./logger.service";

interface UpdateTimeOffStatusInput {
  requestId: string;
  actorOrganizationId: string | null;
  actorRole: string | null;
  actorName: string;
  status: "approved" | "rejected";
  reason?: string;
}

export interface UpdateTimeOffStatusResult {
  id: string;
  status: "approved" | "rejected";
  reason: string | null;
  updatedAt: Date;
}

export class TimeOffService {
  static async updateStatus(
    input: UpdateTimeOffStatusInput,
  ): Promise<UpdateTimeOffStatusResult> {
    if (!input.actorOrganizationId) {
      throw new ForbiddenError("User is not associated with any organization");
    }

    if (!hasAdminOrManagerRole(input.actorRole)) {
      throw new ForbiddenError(
        "Only administrators or managers can update time-off status",
      );
    }

    const [request] = await db
      .select({
        id: timeOffRequests.id,
        employeeEmail: employees.email,
        employeeFirstName: employees.firstName,
      })
      .from(timeOffRequests)
      .innerJoin(employees, eq(timeOffRequests.employeeId, employees.id))
      .where(
        and(
          eq(timeOffRequests.id, input.requestId),
          eq(timeOffRequests.organizationId, input.actorOrganizationId),
        ),
      )
      .limit(1);

    if (!request) {
      throw new NotFoundError("Time-off request not found");
    }

    const [updatedRequest] = await db
      .update(timeOffRequests)
      .set({
        status: input.status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(timeOffRequests.id, input.requestId),
          eq(timeOffRequests.organizationId, input.actorOrganizationId),
        ),
      )
      .returning({
        id: timeOffRequests.id,
        status: timeOffRequests.status,
        updatedAt: timeOffRequests.updatedAt,
      });

    if (!updatedRequest) {
      throw new NotFoundError("Time-off request not found");
    }

    const normalizedReason = input.reason?.trim();
    const rejectionReason =
      input.status === "rejected" ? normalizedReason || null : null;

    await this.notifyEmployee({
      to: request.employeeEmail,
      firstName: request.employeeFirstName,
      status: input.status,
      actorName: input.actorName,
      reason: rejectionReason,
    });

    return {
      id: updatedRequest.id,
      status: updatedRequest.status as "approved" | "rejected",
      reason: rejectionReason,
      updatedAt: updatedRequest.updatedAt,
    };
  }

  private static async notifyEmployee(input: {
    to: string;
    firstName: string;
    status: "approved" | "rejected";
    actorName: string;
    reason: string | null;
  }) {
    const statusLabel = input.status === "approved" ? "Approved" : "Rejected";
    const safeFirstName = this.escapeHtml(input.firstName || "there");
    const safeActorName = this.escapeHtml(input.actorName || "a manager");
    const reasonBlock =
      input.status === "rejected" && input.reason
        ? `<p><strong>Reason:</strong> ${this.escapeHtml(input.reason)}</p>`
        : "";

    const html = `
      <h2>Time-off Request ${statusLabel}</h2>
      <p>Hi ${safeFirstName},</p>
      <p>Your time-off request has been <strong>${statusLabel.toLowerCase()}</strong> by ${safeActorName}.</p>
      ${reasonBlock}
      <p>You can log in to your VestRoll dashboard for more details.</p>
    `;

    try {
      await EmailService.send({
        to: input.to,
        subject: `Time-off request ${statusLabel}`,
        html,
      });
    } catch (error) {
      Logger.error("Failed to send time-off notification email", { to: input.to, status: input.status, error: String(error) });
    }
  }

  private static escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  static async getTimeOffRequests(userId: string) {
    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.organizationId) {
      throw new ForbiddenError("User is not associated with any organization");
    }

    const results = await db
      .select({
        id: timeOffRequests.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        type: timeOffRequests.type,
        startDate: timeOffRequests.startDate,
        endDate: timeOffRequests.endDate,
        totalDuration: timeOffRequests.totalDuration,
        status: timeOffRequests.status,
        submittedAt: timeOffRequests.submittedAt,
      })
      .from(timeOffRequests)
      .innerJoin(employees, eq(timeOffRequests.employeeId, employees.id))
      .where(eq(timeOffRequests.organizationId, user.organizationId))
      .orderBy(desc(timeOffRequests.submittedAt));

    return results.map((req) => ({
      id: req.id,
      employeeName: `${req.firstName} ${req.lastName}`.trim(),
      type: req.type,
      startDate: req.startDate,
      endDate: req.endDate,
      totalDuration: req.totalDuration,
      status: req.status,
      submittedAt: req.submittedAt,
    }));
  }
}
