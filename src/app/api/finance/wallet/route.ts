import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { FinanceWalletService } from "@/server/services/finance-wallet.service";

/**
 * @swagger
 * /api/finance/wallet:
 *   get:
 *     summary: Get organization wallet funding details
 *     description: Return the authenticated organization's NGN virtual account details for bank transfer funding.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet funding details retrieved successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *   post:
 *     summary: Ensure organization wallet funding details
 *     description: Generate and persist a virtual account for the authenticated organization when one does not exist.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet funding details generated successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 */
export async function GET(req: NextRequest) {
  try {
    const { user } = await AuthUtils.authenticateRequestOrRefreshCookie(req);
    const wallet = await FinanceWalletService.getOrganizationWallet(
      user.organizationId ?? "",
    );

    return ApiResponse.success(
      wallet,
      "Wallet funding details retrieved successfully",
    );
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Finance Wallet GET Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await AuthUtils.authenticateRequestOrRefreshCookie(req);
    const wallet = await FinanceWalletService.ensureVirtualAccount(
      user.organizationId ?? "",
    );

    return ApiResponse.success(
      wallet,
      "Wallet funding details generated successfully",
    );
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Finance Wallet POST Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
