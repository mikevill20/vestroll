import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { ResetPasswordSchema } from "@/server/validations/auth.schema";
import { PasswordResetService } from "@/server/services/password-reset.service";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a valid token
 *     description: Validates the reset token and updates the user's password. The token is deleted after successful use.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: The reset token from the email link
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (min 8 chars, must include uppercase, lowercase, number)
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid/expired token or validation error
 */
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      if (jsonError instanceof SyntaxError) {
        console.error("[Bad Request] Malformed JSON in reset-password route");
        return ApiResponse.error("Malformed JSON in request body", 400);
      }
      throw jsonError;
    }

    const validatedData = ResetPasswordSchema.parse(body);

    await PasswordResetService.resetPassword(
      validatedData.token,
      validatedData.password
    );

    return ApiResponse.success(null, "Password has been reset successfully.", 200);
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors = error.issues.reduce<Record<string, string>>(
        (acc, curr) => {
          const field = curr.path.join(".");
          acc[field] = curr.message;
          return acc;
        },
        {}
      );

      console.error("[Validation Error] reset-password:", fieldErrors);
      return ApiResponse.error("Validation failed", 400, fieldErrors);
    }

    if (error instanceof AppError) {
      console.error(`[${error.name}] reset-password: ${error.message}`);
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Internal Error] reset-password:", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
