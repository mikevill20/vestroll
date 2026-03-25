import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/server/services/auth.service";
import { ApiResponse } from "@/server/utils/api-response";
import { AuthUtils } from "@/server/utils/auth";
import { AppError } from "@/server/utils/errors";
import { logoutSchema } from "@/server/validations/auth-logout.schema";
import { Logger } from "@/server/services/logger.service";

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Clear security cookies and invalidate current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("refreshToken")?.value;

    let refreshToken = cookieToken;

    if (!refreshToken) {
      try {
        const body = await request.json();
        const validation = logoutSchema.safeParse(body);
        if (validation.success && validation.data.refreshToken) {
          refreshToken = validation.data.refreshToken;
        }
      } catch {
      }
    }

    const ipAddress = AuthUtils.getClientIp(request);
    const userAgent = AuthUtils.getUserAgent(request);

    Logger.info("Logout attempt initiated", { ip: ipAddress });

    await AuthService.logout(refreshToken, { userAgent, ipAddress });

    const response = ApiResponse.success({
      message: "Logged out successfully",
    });
    response.cookies.delete("refreshToken");

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      if (error.statusCode === 500) {
        Logger.error("Logout internal error", { message: error.message });
        return ApiResponse.error(error.message, 500);
      }
    }
    Logger.error("Unhandled logout error", { error });
    return ApiResponse.error("Internal server error", 500);
  }
}
