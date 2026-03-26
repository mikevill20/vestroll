import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError, ValidationError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { bankAccountService } from "@/server/services/bank-account.service";
import { verifyAccountSchema } from "@/server/validations/account.schema";

export async function POST(req: NextRequest) {
  try {
    const { user } = await AuthUtils.authenticateRequest(req);
    if (!user.organizationId) {
      throw new AppError("User not associated with an organization", 403);
    }

    const body = await req.json();
    const validatedBody = verifyAccountSchema.safeParse(body);

    if (!validatedBody.success) {
      throw new ValidationError(
        "Invalid request body",
        validatedBody.error.flatten().fieldErrors as Record<string, unknown>,
      );
    }

    const verificationResult = await bankAccountService.verifyEmployeeAccount(
      validatedBody.data.employeeId,
      validatedBody.data.accountNumber,
      validatedBody.data.bankName
    );

    return ApiResponse.success(verificationResult, "Account verification completed");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }
    console.error("[Account Verification Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
