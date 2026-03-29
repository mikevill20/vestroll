import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { AuthService } from "@/server/services/auth.service";
import { ChangePasswordSchema } from "@/server/validations/auth.schema";
import { ZodError } from "zod";

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Change the authenticated user's password by confirming their current password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation failed or OAuth-only account
 *       401:
 *         description: Unauthorized or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, user } = await AuthUtils.authenticateRequest(req);

    const body = await req.json();
    const validatedData = ChangePasswordSchema.parse(body);

    await AuthService.changePassword(
      userId,
      user.passwordHash,
      validatedData.currentPassword,
      validatedData.newPassword,
    );

    return ApiResponse.success(null, "Password changed successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((issue: any) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      return ApiResponse.error("Validation failed", 400, { fieldErrors });
    }

    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Change Password Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
