import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { TwoFactorService } from "@/server/services/two-factor.service";
import { EmailService } from "@/server/services/email.service";
import { DisableTwoFactorSchema } from "@/server/validations/two-factor.schema";
import { ZodError } from "zod";

/**
 * @swagger
 * /auth/2fa/disable:
 *   post:
 *     summary: Disable 2FA
 *     description: Disable two-factor authentication for the authenticated user
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
 *               - password
 *               - totpCode
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *               totpCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 *       400:
 *         description: Invalid TOTP code
 *       401:
 *         description: Unauthorized or invalid password
 */
export async function POST(req: NextRequest) {
  try {

    const { userId, email, user } = await AuthUtils.authenticateRequest(req);

    const body = await req.json();
    const validatedData = DisableTwoFactorSchema.parse(body);

    await TwoFactorService.disableTwoFactor(
      userId,
      validatedData.password,
      validatedData.totpCode,
    );

    await EmailService.sendTwoFactorDisabledEmail(email, user.firstName);

    return ApiResponse.success(
      {
        message: "2FA disabled successfully",
      },
      "Two-factor authentication has been disabled on your account.",
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

      if (error.message === "Invalid password") {
        return ApiResponse.error(error.message, 401, error.errors);
      }
      if (error.message === "Invalid TOTP code") {
        return ApiResponse.error(error.message, 400, error.errors);
      }
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[2FA Disable Error]", error);

    return ApiResponse.error("Internal server error", 500);
  }
}
