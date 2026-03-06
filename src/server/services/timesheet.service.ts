import { db } from "../db";
import { timesheets, employees, users } from "../db/schema";
import { eq, and, count, SQL } from "drizzle-orm";
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from "../utils/errors";
import {
  GetTimesheetsQuery,
  UpdateTimesheetStatusInput,
} from "../validations/timesheet.schema";

export class TimesheetService {
  static async getTimesheets(userId: string, query: GetTimesheetsQuery) {
    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.organizationId) {
      throw new ForbiddenError("User is not associated with any organization");
    }

    const conditions: SQL[] = [
      eq(timesheets.organizationId, user.organizationId),
    ];

    if (query.status) {
      conditions.push(
        eq(
          timesheets.status,
          query.status.toLowerCase() as "pending" | "approved" | "rejected",
        ),
      );
    }

    const whereClause = and(...conditions);

    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(timesheets)
      .where(whereClause);

    const offset = (query.page - 1) * query.limit;

    const rows = await db
      .select({
        id: timesheets.id,
        totalHours: timesheets.totalWorked,
        rate: timesheets.rate,
        totalAmount: timesheets.totalAmount,
        status: timesheets.status,
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
      })
      .from(timesheets)
      .innerJoin(employees, eq(timesheets.employeeId, employees.id))
      .where(whereClause)
      .orderBy(timesheets.createdAt)
      .limit(query.limit)
      .offset(offset);

    const data = rows.map((row) => ({
      id: row.id,
      employeeName: `${row.employeeFirstName} ${row.employeeLastName}`,
      totalHours: row.totalHours,
      rate: row.rate,
      totalAmount: row.totalAmount,
      status: row.status,
    }));

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / query.limit),
      },
    };
  }

  static async updateStatus(
    userId: string,
    timesheetId: string,
    input: UpdateTimesheetStatusInput,
  ) {
    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.organizationId) {
      throw new ForbiddenError("User is not associated with any organization");
    }

    const [timesheet] = await db
      .select()
      .from(timesheets)
      .where(
        and(
          eq(timesheets.id, timesheetId),
          eq(timesheets.organizationId, user.organizationId),
        ),
      )
      .limit(1);

    if (!timesheet) {
      throw new NotFoundError("Timesheet not found");
    }

    if (timesheet.status !== "pending") {
      throw new BadRequestError(
        `Timesheet has already been ${timesheet.status}`,
      );
    }

    const now = new Date();
    const totalApprovedAmount =
      input.status === "approved"
        ? timesheet.rate * timesheet.totalWorked
        : null;

    const [updated] = await db
      .update(timesheets)
      .set({
        status: input.status,
        totalApprovedAmount,
        lockedForPayroll: input.status === "approved",
        approvedBy: userId,
        approvedAt: now,
        updatedAt: now,
      })
      .where(eq(timesheets.id, timesheetId))
      .returning({
        id: timesheets.id,
        status: timesheets.status,
        totalApprovedAmount: timesheets.totalApprovedAmount,
      });

    return updated;
  }
}
