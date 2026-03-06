import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { TwoFactorService } from "@/server/services/two-factor.service";
import { EmailService } from "@/server/services/email.service";
import { VerifySetupSchema } from "@/server/validations/two-factor.schema";
import { ZodError } from "zod";

/**
 * @swagger
 * /auth/2fa/verify-setup:
 *   post:
 *     summary: Complete 2FA setup
 *     description: Verify the provided TOTP code to finalize 2FA enablement
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totpCode
 *             properties:
 *               totpCode:
 *                 type: string
 *                 description: 6-digit verification code from app
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 *       400:
 *         description: Invalid TOTP code or validation error
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {

    const { userId, email, user } = await AuthUtils.authenticateRequest(req);

    const body = await req.json();
    const validatedData = VerifySetupSchema.parse(body);

    const result = await TwoFactorService.verifySetup(
      userId,
      validatedData.totpCode,
    );

    await EmailService.sendTwoFactorEnabledEmail(email, user.firstName);

    return ApiResponse.success(
      {
        message: "2FA enabled successfully",
        backupCodes: result.backupCodes,
      },
      "Two-factor authentication has been enabled on your account.",
      200,
    );
  } catch (error) {

    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      return ApiResponse.error("Validation failed", 400, { fieldErrors });
    }

    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[2FA Verify Setup Error]", error);

    return ApiResponse.error("Internal server error", 500);
  }
}
