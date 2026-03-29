import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError, ValidationError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { bankAccountService } from "@/server/services/bank-account.service";
import { updateEmployeeAccountSchema } from "@/server/validations/account.schema";

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Get employee account details
 *     description: Retrieve bank account details for a specific employee.
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Account details retrieved successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: User not associated with an organization
 *       404:
 *         description: Employee account not found
 *   put:
 *     summary: Update employee account details
 *     description: Update bank account details for a specific employee.
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
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: string
 *               accountHolderName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               routingNumber:
 *                 type: string
 *               bankName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account details updated successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: User not associated with an organization
 */
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
