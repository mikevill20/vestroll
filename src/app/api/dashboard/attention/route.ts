import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { AttentionService } from "@/server/services/attention.service";

/**
 * @swagger
 * /api/dashboard/attention:
 *   get:
 *     summary: Get required attention items
 *     description: Retrieve counts of items needing immediate action across contracts, milestones, invoices, timesheets, expenses, and time-off requests
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attention items retrieved successfully
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
 *                     contractsPendingSignature:
 *                       type: integer
 *                     milestonesCompleted:
 *                       type: integer
 *                     invoicesRequiringPayment:
 *                       type: integer
 *                     pendingTimesheets:
 *                       type: integer
 *                     pendingExpenses:
 *                       type: integer
 *                     pendingTimeOffRequests:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User not associated with any organization
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await AuthUtils.authenticateRequest(req);

    const attentionItems = await AttentionService.getAttentionItems(userId);

    return ApiResponse.success(attentionItems, "Attention items retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Attention Items Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
