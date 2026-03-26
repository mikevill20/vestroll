import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { KybService } from "@/server/services/kyb.service";

/**
 * @swagger
 * /kyb/status:
 *   get:
 *     summary: Get KYB verification status
 *     description: Return the current state of the user's Know Your Business (KYB) verification
 *     tags: [KYB]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYB status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [not_started, pending, verified, rejected]
 *                 rejectionReason:
 *                   type: string
 *                   nullable: true
 *                 rejectionCode:
 *                   type: string
 *                   nullable: true
 *                   description: Machine-readable rejection code (e.g., INVALID_CERTIFICATE, INVALID_MEMORANDUM)
 *                 submittedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await AuthUtils.authenticateRequest(req);

    const status = await KybService.getStatus(userId);

    return ApiResponse.success(status, "KYB status retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[KYB Status Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
