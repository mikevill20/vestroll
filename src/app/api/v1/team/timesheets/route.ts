import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError, ValidationError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { TimesheetService } from "@/server/services/timesheet.service";
import { GetTimesheetsQuerySchema } from "@/server/validations/timesheet.schema";

/**
 * @swagger
 * /team/timesheets:
 *   get:
 *     summary: List timesheets
 *     description: Retrieve all hourly logs submitted by contractors for the authenticated user's organization
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Items per page (max 100)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Approved, Rejected]
 *         description: Filter by timesheet status
 *     responses:
 *       200:
 *         description: Timesheets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           employeeName:
 *                             type: string
 *                           totalHours:
 *                             type: number
 *                           rate:
 *                             type: number
 *                           totalAmount:
 *                             type: number
 *                           status:
 *                             type: string
 *                             enum: [Pending, Approved, Rejected]
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         total:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: User not associated with an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await AuthUtils.authenticateRequest(req);

    const { searchParams } = new URL(req.url);
    const queryParams = {
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const validatedQuery = GetTimesheetsQuerySchema.parse(queryParams);
    const result = await TimesheetService.getTimesheets(userId, validatedQuery);

    return ApiResponse.success(result, "Timesheets retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    if (error instanceof Error && error.name === "ZodError") {
      return ApiResponse.error("Invalid query parameters", 400, {
        validation: error,
      });
    }

    return ApiResponse.error("Internal server error", 500);
  }
}
