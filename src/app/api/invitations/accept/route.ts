import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError, ValidationError } from "@/server/utils/errors";
import { invitationService } from "@/server/services/invitation.service";
import { acceptInvitationSchema, declineInvitationSchema } from "@/server/validations/invitation.schema";

/**
 * @swagger
 * /invitations/accept:
 *   post:
 *     summary: Accept organization invitation
 *     description: Accept an invitation to join an organization and create user account
 *     tags: [Invitations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - firstName
 *               - lastName
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Invitation token from email
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *       400:
 *         description: Invalid request body or invitation
 *       404:
 *         description: Invalid invitation token
 *       410:
 *         description: Invitation has expired
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedBody = acceptInvitationSchema.safeParse(body);
    if (!validatedBody.success) {
      throw new ValidationError(
        "Invalid request body",
        validatedBody.error.flatten().fieldErrors as Record<string, unknown>,
      );
    }
    const invitation = await invitationService.getInvitationByToken(validatedBody.data.token);
    
    if (!invitation) {
      throw new AppError("Invalid invitation token", 404);
    }
    if (invitation.status !== "pending") {
      throw new AppError("Invitation is no longer valid", 400);
    }
    return ApiResponse.success(
      { message: "Invitation accepted successfully" },
      "Invitation accepted successfully"
    );
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }
    console.error("[Accept Invitation Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
