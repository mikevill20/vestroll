import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { OnboardingService } from "@/server/services/onboarding.service";

/**
 * @swagger
 * /dashboard/onboarding:
 *   get:
 *     summary: Get onboarding status
 *     description: Retrieve the organization's onboarding progress across email verification, company profile, KYB verification, and wallet funding
 *     tags: [General]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emailVerified:
 *                   type: boolean
 *                 companyInfoProvided:
 *                   type: boolean
 *                 kybVerified:
 *                   type: boolean
 *                 walletFunded:
 *                   type: boolean
 *                 completedSteps:
 *                   type: number
 *                 totalSteps:
 *                   type: number
 *                 progressPercentage:
 *                   type: number
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                       label:
 *                         type: string
 *                       completed:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: User not found
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await AuthUtils.authenticateRequest(req);

    const onboardingStatus = await OnboardingService.getOnboardingStatus(userId);

    if (!onboardingStatus) {
      return ApiResponse.error("User not found", 404);
    }

    return ApiResponse.success(onboardingStatus, "Onboarding status retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Onboarding Status Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
