import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import {
  AppError,
  BadRequestError,
  ForbiddenError,
  ValidationError,
} from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { hasAdminOrManagerRole } from "@/server/utils/role";
import { UpdateTimeOffStatusBodySchema } from "@/server/validations/time-off.schema";
import { TimeOffService } from "@/server/services/time-off.service";

/**
 * @swagger
 * /team/time-off/{id}/status:
 *   patch:
 *     summary: Update time-off request status
 *     description: Allows administrators or managers to approve or reject a time-off request
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Time-off request ID
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
 *               reason:
 *                 type: string
 *                 description: Required when status is Rejected
 *     responses:
 *       200:
 *         description: Time-off request status updated successfully
 *       400:
 *         description: Invalid request body or rejection reason missing
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: Only administrators or managers are allowed
 *       404:
 *         description: Time-off request not found
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await AuthUtils.authenticateRequest(req);

    if (!hasAdminOrManagerRole(user.role)) {
      throw new ForbiddenError(
        "Only administrators or managers can update time-off status",
      );
    }

    const body = await req.json();
    const validatedBody = UpdateTimeOffStatusBodySchema.safeParse(body);

    if (!validatedBody.success) {
      throw new ValidationError(
        "Invalid request body",
        validatedBody.error.flatten().fieldErrors as Record<string, unknown>,
      );
    }

    if (validatedBody.data.status === "rejected" && !validatedBody.data.reason) {
      throw new BadRequestError("Reason is required when status is Rejected");
    }

    const actorName = `${user.firstName} ${user.lastName}`.trim() || "a manager";
    const result = await TimeOffService.updateStatus({
      requestId: id,
      actorOrganizationId: user.organizationId ?? null,
      actorRole: user.role ?? null,
      actorName,
      status: validatedBody.data.status,
      reason: validatedBody.data.reason,
    });

    return ApiResponse.success(result, "Time-off request status updated successfully");
  } catch (error) {
    if (error instanceof SyntaxError) {
      return ApiResponse.error("Invalid JSON body", 400);
    }

    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Time Off Status Update Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
