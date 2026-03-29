import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { TwoFactorService } from "@/server/services/two-factor.service";
import { EmailService } from "@/server/services/email.service";

/**
 * @swagger
 * /auth/2fa/setup:
 *   post:
 *     summary: Initialize 2FA setup
 *     description: Generate security secret, QR code URL, and backup codes for the authenticated user
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA setup initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                 qrCodeUrl:
 *                   type: string
 *                 backupCodes:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {

    const { userId, email, user } = await AuthUtils.authenticateRequest(req);

    const result = await TwoFactorService.setupTwoFactor(userId, email);

    return ApiResponse.success(
      {
        secret: result.secret,
        qrCodeUrl: result.qrCodeUrl,
        backupCodes: result.backupCodes,
      },
      "2FA setup initialized. Please verify with your authenticator app.",
      200,
    );
  } catch (error) {

    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[2FA Setup Error]", error);

    return ApiResponse.error("Internal server error", 500);
  }
}
