import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError, ValidationError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { BankVerificationService } from "@/server/services/bank-verification.service";
import { BankVerificationSchema } from "@/server/validations/bank-verification.schema";

/**
 * @swagger
 * /team/employees/bank-verification:
 *   post:
 *     summary: Verify bank account
 *     description: Validates a bank account number against the selected provider and returns the account holder name
 *     tags: [Team]
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
 *               - bankCode
 *               - providerId
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 description: The bank account number to verify
 *                 example: "0001234567"
 *               bankCode:
 *                 type: string
 *                 description: The bank code identifying the bank
 *                 example: "058"
 *               providerId:
 *                 type: string
 *                 description: The payment provider to use for verification
 *                 enum: [paystack, flutterwave]
 *                 example: "paystack"
 *     responses:
 *       200:
 *         description: Account verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     accountName:
 *                       type: string
 *       400:
 *         description: Invalid input or account verification failed
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {
    await AuthUtils.authenticateRequest(req);

    const body = await req.json();

    const parsed = BankVerificationSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid request body",
        parsed.error.flatten().fieldErrors as Record<string, unknown>,
      );
    }

    const { accountNumber, bankCode, providerId } = parsed.data;

    const result = await BankVerificationService.verifyAccount(
      accountNumber,
      bankCode,
      providerId,
    );

    return ApiResponse.success(result, "Account verified successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Bank Verification Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
