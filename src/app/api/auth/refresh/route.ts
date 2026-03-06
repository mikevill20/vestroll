import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { TokenRefreshService } from "@/server/services/token-refresh.service";
import { ApiResponse } from "@/server/utils/api-response";
import { AuthUtils } from "@/server/utils/auth";
import { AppError } from "@/server/utils/errors";
import { refreshSchema } from "@/server/validations/auth-refresh.schema";
import {
  InvalidTokenFormatError,
  InvalidTokenSignatureError,
  ExpiredTokenError,
  TokenSessionMismatchError,
  SessionNotFoundError,
} from "@/server/utils/auth-errors";

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Rotate refresh token and get a new access token
 *     tags: [Auth]
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
 *         description: Token refreshed successfully
 *       400:
 *         description: Refresh token is required
 *       401:
 *         description: Invalid or expired token
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("refreshToken")?.value;

    let refreshToken = cookieToken;
    if (!refreshToken) {
      try {
        const body = await request.json();
        const validation = refreshSchema.safeParse(body);
        if (validation.success) {
          refreshToken = validation.data.refreshToken;
        }
      } catch {
      }
    }

    if (!refreshToken) {
      return ApiResponse.error("Refresh token is required", 400);
    }

    const ipAddress = AuthUtils.getClientIp(request);
    const userAgent = AuthUtils.getUserAgent(request);
    const result = await TokenRefreshService.refresh(
      refreshToken,
      userAgent,
      ipAddress,
    );
    const response = ApiResponse.success(
      result,
      "Token refreshed successfully",
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    };
    response.cookies.set("refreshToken", result.refreshToken, cookieOptions);

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("Refresh route error:", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
