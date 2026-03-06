import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { TeamService } from "@/server/services/team.service";
import { db, users } from "@/server/db";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await AuthUtils.authenticateRequest(req);

    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !["Manager", "Admin"].includes(user.role ?? "")) {
      return ApiResponse.error("Forbidden", 403);
    }

    const body = await req.json();
    const { status, reason } = body;

    const validStatuses = ["Approved", "Rejected", "In Progress"];
    if (!status || !validStatuses.includes(status)) {
      return ApiResponse.error("Invalid status value", 400);
    }

    const result = await TeamService.updateMilestoneStatus(params.id, { status, reason });

    return ApiResponse.success(result, "Milestone status updated successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Milestone Status Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
