import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { TwoFactorService } from "@/server/services/two-factor.service";

/**
 * @swagger
 * /auth/2fa/status:
 *   get:
 *     summary: Check 2FA status
 *     description: Retrieve the current 2FA status for the authenticated user
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                 backupCodesRemaining:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {

    const { userId } = await AuthUtils.authenticateRequest(req);

    const status = await TwoFactorService.getStatus(userId);

    return ApiResponse.success(
      {
        enabled: status.enabled,
        backupCodesRemaining: status.backupCodesRemaining,
      },
      "2FA status retrieved successfully.",
      200,
    );
  } catch (error) {

    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[2FA Status Error]", error);

    return ApiResponse.error("Internal server error", 500);
  }
}
