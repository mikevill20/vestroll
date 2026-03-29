import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError, ValidationError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { bankAccountService } from "@/server/services/bank-account.service";
import { validateAccountNumberSchema } from "@/server/validations/account.schema";

/**
 * @swagger
 * /accounts/validate:
 *   post:
 *     summary: Validate bank account
 *     description: Validate bank account number and details.
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *             properties:
 *               accountNumber:
 *                 type: string
 *               routingNumber:
 *                 type: string
 *               sortCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account validation completed
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: User not associated with an organization
 */
export async function POST(req: NextRequest) {
  try {
    const { user } = await AuthUtils.authenticateRequest(req);
    if (!user.organizationId) {
      throw new AppError("User not associated with an organization", 403);
    }

    const body = await req.json();
    const validatedBody = validateAccountNumberSchema.safeParse(body);

    if (!validatedBody.success) {
      throw new ValidationError(
        "Invalid request body",
        validatedBody.error.flatten().fieldErrors as Record<string, unknown>,
      );
    }

    const validationResult = await bankAccountService.validateBankAccount({
      accountNumber: validatedBody.data.accountNumber,
      routingNumber: validatedBody.data.routingNumber,
      sortCode: validatedBody.data.sortCode,
      iban: validatedBody.data.iban,
      swiftCode: validatedBody.data.swiftCode,
      bankCountry: validatedBody.data.bankCountry,
    });

    return ApiResponse.success(validationResult, "Account validation completed");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }
    console.error("[Account Validation Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
