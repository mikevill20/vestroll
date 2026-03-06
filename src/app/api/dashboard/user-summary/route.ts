import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { DashboardService } from "@/server/services/dashboard.service";

/**
 * @swagger
 * /api/dashboard/user-summary:
 *   get:
 *     summary: Get user summary
 *     description: Retrieve identity details for the authenticated user to populate dashboard header greeting and profile previews
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 avatarUrl:
 *                   type: string
 *                   nullable: true
 *                 role:
 *                   type: string
 *                   nullable: true
 *                 organizationName:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await AuthUtils.authenticateRequest(req);

    const userSummary = await DashboardService.getUserSummary(userId);

    if (!userSummary) {
      return ApiResponse.error("User not found", 404);
    }

    return ApiResponse.success(userSummary, "User summary retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[User Summary Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
