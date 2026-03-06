import { NextRequest } from "next/server";
import { RegisterSchema } from "@/server/validations/auth.schema";
import { AuthService } from "@/server/services/auth.service";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { ZodError } from "zod";

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: User registration
 *     description: Register a new user with business email and name
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - businessEmail
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               businessEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Registration successful, verification email sent
 *       400:
 *         description: Bad request - Validation failed
 */
export async function POST(req: NextRequest) {
  try {

    const body = await req.json();
    const validatedData = RegisterSchema.parse(body);

    const registrationData = {
      firstName: validatedData.firstName.trim(),
      lastName: validatedData.lastName.trim(),
      email: validatedData.businessEmail.trim().toLowerCase(),
    };

    const result = await AuthService.register(registrationData);

    return ApiResponse.success(result, "Verification email sent", 201);
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

    console.error("[Registration Error]", error);

    return ApiResponse.error("Internal server error", 500);
  }
}
