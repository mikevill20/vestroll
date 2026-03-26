import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { invitationService } from "@/server/services/invitation.service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      throw new AppError("Invitation token is required", 400);
    }

    const invitation = await invitationService.getInvitationByToken(token);

    if (!invitation) {
      throw new AppError("Invalid invitation token", 404);
    }

    if (invitation.status !== "pending") {
      throw new AppError(`Invitation is ${invitation.status}`, 400);
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expiresAt)) {
      await invitationService.updateInvitationStatus(invitation.id, "expired");
      throw new AppError("Invitation has expired", 400);
    }

    const invitationDetails = {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      organizationName: invitation.organization.name,
      invitedByName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
      message: invitation.message,
      expiresAt: invitation.expiresAt,
    };

    return ApiResponse.success(
      { invitation: invitationDetails },
      "Invitation validated successfully"
    );
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode);
    }

    console.error("[Validate Invitation Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
