import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { TimeOffService } from "@/server/services/time-off.service";

/**
 * @swagger
 * /team/time-off:
 *   get:
 *     summary: Get all time-off requests
 *     description: Retrieve all leave requests (Sick, Vacation, etc.) for the organization.
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Time-off requests retrieved successfully
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

        const result = await TimeOffService.getTimeOffRequests(userId);

        return ApiResponse.success(result, "Time-off requests retrieved successfully");
    } catch (error) {
        if (error instanceof AppError) {
            return ApiResponse.error(error.message, error.statusCode, error.errors);
        }

        console.error("[Team Time-Off Error]", error);
        return ApiResponse.error("Internal server error", 500);
    }
}
