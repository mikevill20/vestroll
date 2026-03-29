import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { ExpenseStatusService } from "@/server/services/expense-status.service";
import { JWTTokenService } from "@/server/services/jwt-token.service";
import {
  AppError,
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "@/server/utils/errors";
import { UpdateExpenseStatusSchema } from "@/server/validations/expense-status.schema";

/**
 * @swagger
 * /team/expenses/{id}/status:
 *   patch:
 *     summary: Approve or reject an expense submission
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Approved, Rejected]
 *               comment:
 *                 type: string
 *                 description: Required when status is Rejected
 *     responses:
 *       200:
 *         description: Expense status updated
 *       400:
 *         description: Invalid request or business rule violation
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Expense not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid authorization header");
    }

    const token = authHeader.slice(7);
    const payload = await JWTTokenService.verifyToken(token);

    const approverId = payload?.userId as string | undefined;
    const role = String(payload?.role || "").toLowerCase();

    if (!approverId) {
      throw new UnauthorizedError("Invalid token payload");
    }

    if (role !== "admin" && role !== "administrator") {
      throw new ForbiddenError(
        "Only administrators can approve or reject expenses",
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedBody = UpdateExpenseStatusSchema.safeParse(body);

    if (!validatedBody.success) {
      throw new ValidationError(
        "Invalid request body",
        validatedBody.error.flatten().fieldErrors as Record<string, unknown>,
      );
    }

    if (
      validatedBody.data.status === "Rejected" &&
      !validatedBody.data.comment?.trim()
    ) {
      throw new BadRequestError(
        "Comment is required when rejecting an expense",
      );
    }

    const result = await ExpenseStatusService.updateExpenseStatus({
      expenseId: id,
      status: validatedBody.data.status,
      comment: validatedBody.data.comment,
      approverId,
    });

    return ApiResponse.success(result, "Expense status updated successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("Update expense status route error:", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
