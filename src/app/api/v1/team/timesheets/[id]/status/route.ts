import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError, ValidationError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { TimesheetService } from "@/server/services/timesheet.service";
import { UpdateTimesheetStatusSchema } from "@/server/validations/timesheet.schema";

/**
 * @swagger
 * /team/timesheets/{id}/status:
 *   patch:
 *     summary: Update timesheet status
 *     description: Approve or reject a submitted timesheet. Approved timesheets are locked and queued for payroll processing.
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Timesheet ID
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
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: Timesheet status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 totalApprovedAmount:
 *                   type: integer
 *                   nullable: true
 *       400:
 *         description: Invalid input or timesheet already processed
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: Timesheet not found
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await AuthUtils.authenticateRequest(req);
    const { id } = await params;

    const body = await req.json();
    const validated = UpdateTimesheetStatusSchema.safeParse(body);

    if (!validated.success) {
      throw new ValidationError(
        "Invalid request body",
        validated.error.flatten().fieldErrors as Record<string, unknown>,
      );
    }

    const result = await TimesheetService.updateStatus(
      userId,
      id,
      validated.data,
    );

    return ApiResponse.success(result, "Timesheet status updated");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Timesheet Status Update Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
