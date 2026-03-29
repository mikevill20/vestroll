import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError, ValidationError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { invitationService } from "@/server/services/invitation.service";
import { 
  createInvitationSchema, 
  listInvitationsSchema,
  resendInvitationSchema,
  deleteInvitationSchema
} from "@/server/validations/invitation.schema";

/**
 * @swagger
 * /invitations:
 *   get:
 *     summary: List invitations
 *     description: Retrieve all invitations for the authenticated user's organization.
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invitations retrieved successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: User not associated with an organization
 *   post:
 *     summary: Create invitation
 *     description: Invite a new user to join the organization.
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invitation created successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: User not associated with an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { user } = await AuthUtils.authenticateRequest(req);

    if (!user.organizationId) {
      throw new AppError("User not associated with an organization", 403);
    }

    const searchParams = req.nextUrl.searchParams;
    const rawQuery = {
      status: searchParams.get("status") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    };

    const validatedQuery = listInvitationsSchema.safeParse(rawQuery);
    if (!validatedQuery.success) {
      throw new ValidationError(
        "Invalid query parameters",
        validatedQuery.error.flatten().fieldErrors as Record<string, unknown>,
      );
    }

    const result = await invitationService.listInvitations(
      user.organizationId,
      validatedQuery.data
    );

    return ApiResponse.success(result, "Invitations retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Invitations List Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await AuthUtils.authenticateRequest(req);

    if (!user.organizationId) {
      throw new AppError("User not associated with an organization", 403);
    }

    const body = await req.json();
    const validatedBody = createInvitationSchema.safeParse(body);

    if (!validatedBody.success) {
      throw new ValidationError(
        "Invalid request body",
        validatedBody.error.flatten().fieldErrors as Record<string, unknown>,
      );
    }

    const invitation = await invitationService.createInvitation({
      organizationId: user.organizationId,
      invitedByUserId: user.id,
      ...validatedBody.data,
    });

    return ApiResponse.success(invitation, "Invitation created successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Create Invitation Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
