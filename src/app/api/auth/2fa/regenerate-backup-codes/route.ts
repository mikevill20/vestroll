import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { TwoFactorService } from "@/server/services/two-factor.service";
import { EmailService } from "@/server/services/email.service";
import { RegenerateBackupCodesSchema } from "@/server/validations/two-factor.schema";
import { ZodError } from "zod";

/**
 * @swagger
 * /auth/2fa/regenerate-backup-codes:
 *   post:
 *     summary: Regenerate backup codes
 *     description: Generate a new set of backup codes. Requires TOTP verification.
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
 *     responses:
 *       200:
 *         description: Backup codes regenerated successfully
 *       400:
 *         description: Invalid TOTP code
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {

    const { userId, email, user } = await AuthUtils.authenticateRequest(req);

    const body = await req.json();
    const validatedData = RegenerateBackupCodesSchema.parse(body);

    const backupCodes = await TwoFactorService.regenerateBackupCodes(
      userId,
      validatedData.totpCode,
    );

    await EmailService.sendBackupCodesRegeneratedEmail(email, user.firstName);

    return ApiResponse.success(
      {
        backupCodes,
        warning:
          "Please save these backup codes in a secure location. They will not be shown again.",
      },
      "Backup codes regenerated successfully.",
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

    console.error("[2FA Regenerate Backup Codes Error]", error);

    return ApiResponse.error("Internal server error", 500);
  }
}
