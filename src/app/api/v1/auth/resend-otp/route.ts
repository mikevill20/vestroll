import { NextRequest } from "next/server";
import { ResendOTPSchema } from "@/server/validations/auth.schema";
import { OTPResendService } from "@/server/services/otp-resend.service";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError, TooManyRequestsError } from "@/server/utils/errors";
import { ZodError } from "zod";

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend verification OTP
 *     description: Resend a new one-time password for email verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Invalid email or validation error
 *       429:
 *         description: Too many requests - Rate limit exceeded
 */
export async function POST(req: NextRequest) {
  try {

    const body = await req.json();
    const validatedData = ResendOTPSchema.parse(body);

    const result = await OTPResendService.resendOTP(validatedData.email);

    return ApiResponse.success(result, result.message, 200);
  } catch (error) {

    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      return ApiResponse.error("Validation failed", 400, { fieldErrors });
    }

    if (error instanceof TooManyRequestsError) {

      const retryAfter = error.retryAfter || 300;
      console.warn(
        `[Rate Limit] OTP resend rate limit exceeded. Retry after: ${retryAfter}s`,
      );

      return new Response(
        JSON.stringify({
          success: false,
          message: error.message,
          errors: { retryAfter },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
          },
        },
      );
    }

    if (error instanceof AppError) {

      if (error.statusCode === 404 || error.statusCode === 400) {
        console.warn(`[OTP Resend] ${error.message}`);
      }
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[OTP Resend Error]", error);

    return ApiResponse.error("Internal server error", 500);
  }
}
