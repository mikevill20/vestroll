import { BadRequestError, NotFoundError } from "../utils/errors";
import { Logger } from "./logger.service";
import { Pool } from "pg";
import "@/server/utils/env";

type UpdateExpenseStatusParams = {
  expenseId: string;
  status: "Approved" | "Rejected";
  comment?: string;
  approverId: string;
};

type ExpenseStatusUpdateResponse = {
  id: string;
  status: "Approved" | "Rejected";
  approverId: string;
  processedAt: Date;
};

export class ExpenseStatusService {
  private static pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  static async updateExpenseStatus(
    params: UpdateExpenseStatusParams,
  ): Promise<ExpenseStatusUpdateResponse> {
    const { expenseId, status, comment, approverId } = params;
    const nextStatus = status.toLowerCase() as "approved" | "rejected";
    const trimmedComment = comment?.trim();

    if (nextStatus === "rejected" && !trimmedComment) {
      throw new BadRequestError(
        "Comment is required when rejecting an expense",
      );
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const existingResult = await client.query(
        `
          select id, status
          from expenses
          where id = $1
          limit 1
        `,
        [expenseId],
      );

      const existingExpense = existingResult.rows?.[0] as
        | { id: string; status: string }
        | undefined;

      if (!existingExpense) {
        throw new NotFoundError("Expense not found");
      }

      if (existingExpense.status !== "pending") {
        throw new BadRequestError(
          "Only expenses in Pending status can be processed",
        );
      }

      const processedAt = new Date();
      const readyForPayout = nextStatus === "approved";

      const updateResult = await client.query(
        `
          update expenses
          set
            status = $1::approval_status,
            ready_for_payout = $2,
            approver_id = $3,
            processed_at = $4,
            rejection_reason = $5,
            updated_at = now()
          where id = $6
          returning id, status, approver_id, processed_at
        `,
        [
          nextStatus,
          readyForPayout,
          approverId,
          processedAt,
          nextStatus === "rejected" ? trimmedComment ?? null : null,
          expenseId,
        ],
      );

      const updatedExpense = updateResult.rows?.[0] as
        | {
            id: string;
            status: "approved" | "rejected";
            approver_id: string;
            processed_at: Date;
          }
        | undefined;

      if (!updatedExpense) {
        throw new NotFoundError("Expense not found");
      }

      await client.query(
        `
          insert into expense_status_audit_logs (
            expense_id,
            previous_status,
            new_status,
            approver_id,
            comment,
            processed_at
          ) values (
            $1,
            $2::approval_status,
            $3::approval_status,
            $4,
            $5,
            $6
          )
        `,
        [
          expenseId,
          existingExpense.status,
          updatedExpense.status,
          approverId,
          trimmedComment ?? null,
          processedAt,
        ],
      );

      await client.query("COMMIT");

      Logger.info("Expense status updated", {
        expenseId,
        approverId,
        previousStatus: existingExpense.status,
        newStatus: updatedExpense.status,
        processedAt: processedAt.toISOString(),
      });

      return {
        id: updatedExpense.id,
        status:
          updatedExpense.status === "approved" ? ("Approved" as const) : ("Rejected" as const),
        approverId: updatedExpense.approver_id,
        processedAt: updatedExpense.processed_at,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
