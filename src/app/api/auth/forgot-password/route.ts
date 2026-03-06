import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { ForgotPasswordSchema } from "@/server/validations/auth.schema";
import { PasswordResetService } from "@/server/services/password-reset.service";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     description: Sends a password reset link to the user's email if it exists. Always returns 200 to prevent user enumeration.
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
 *         description: If the email exists, a reset link has been sent
 *       400:
 *         description: Validation error
 */
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      if (jsonError instanceof SyntaxError) {
        console.error("[Bad Request] Malformed JSON in forgot-password route");
        return ApiResponse.error("Malformed JSON in request body", 400);
      }
      throw jsonError;
    }

    const validatedData = ForgotPasswordSchema.parse(body);

    await PasswordResetService.requestPasswordReset(validatedData.email);

    return ApiResponse.success(
      null,
      "If an account with that email exists, a password reset link has been sent.",
      200
    );
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

      console.error("[Validation Error] forgot-password:", fieldErrors);
      return ApiResponse.error("Validation failed", 400, fieldErrors);
    }

    if (error instanceof AppError) {
      console.error(`[${error.name}] forgot-password: ${error.message}`);
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Internal Error] forgot-password:", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
