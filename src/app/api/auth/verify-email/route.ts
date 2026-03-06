import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { VerifyEmailSchema } from "@/server/validations/auth.schema";
import { EmailVerificationService } from "@/server/services/email-verification.service";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email with OTP
 *     description: Verify user's email address using the one-time password sent to them
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 description: 6-digit verification code
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid OTP or validation error
 *       404:
 *         description: User not found or no pending verification
 */
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      if (jsonError instanceof SyntaxError) {
        console.error("[Bad Request] Malformed JSON in verify-email route");
        return ApiResponse.error("Malformed JSON in request body", 400);
      }
      throw jsonError;
    }

    const validatedData = VerifyEmailSchema.parse(body);

    const result = await EmailVerificationService.verifyEmail(
      validatedData.email,
      validatedData.otp,
    );

    return ApiResponse.success({ user: result.user }, result.message, 200);
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors = error.issues.reduce<Record<string, string>>(
        (acc, curr) => {
          const field = curr.path.join(".");
          acc[field] = curr.message;
          return acc;
        },
        {},
      );

      console.error("[Validation Error] verify-email:", fieldErrors);
      return ApiResponse.error("Validation failed", 400, fieldErrors);
    }

    if (error instanceof AppError) {
      console.error(`[${error.name}] verify-email: ${error.message}`);
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Internal Error] verify-email:", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
