import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError, ValidationError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { bankAccountService } from "@/server/services/bank-account.service";
import { updateEmployeeAccountSchema } from "@/server/validations/account.schema";

export async function PUT(req: NextRequest) {
  try {
    const { user } = await AuthUtils.authenticateRequest(req);
    if (!user.organizationId) {
      throw new AppError("User not associated with an organization", 403);
    }

    const body = await req.json();
    const { employeeId, ...accountData } = body;

    if (!employeeId) {
      throw new ValidationError("Employee ID is required", {});
    }

    const validatedData = updateEmployeeAccountSchema.safeParse(accountData);

    if (!validatedData.success) {
      throw new ValidationError(
        "Invalid request body",
        validatedData.error.flatten().fieldErrors as Record<string, unknown>,
      );
    }

    await bankAccountService.updateEmployeeAccount(employeeId, validatedData.data);

    return ApiResponse.success(
      { message: "Account details updated successfully" },
      "Account details updated successfully"
    );
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }
    console.error("[Update Account Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await AuthUtils.authenticateRequest(req);
    if (!user.organizationId) {
      throw new AppError("User not associated with an organization", 403);
    }

    const searchParams = req.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      throw new ValidationError("Employee ID is required", {});
    }

    const accountDetails = await bankAccountService.getEmployeeAccount(employeeId);

    if (!accountDetails) {
      throw new AppError("Employee account not found", 404);
    }

    return ApiResponse.success(accountDetails, "Account details retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }
    console.error("[Get Account Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
