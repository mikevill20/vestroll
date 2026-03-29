import { NextRequest } from "next/server";
import { GoogleOAuthSchema } from "@/server/validations/auth.schema";
import { GoogleOAuthService } from "@/server/services/google-oauth.service";
import { OAuthUserProvisioningService } from "@/server/services/oauth-user-provisioning.service";
import { JWTService } from "@/server/services/jwt.service";
import { SessionService } from "@/server/services/session.service";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { ZodError } from "zod";

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Google OAuth login
 *     description: Authenticate or register user using Google account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         description: Validation failed
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = GoogleOAuthSchema.parse(body);

    console.log("[Google OAuth] Verifying ID token");
    const googleUserInfo = await GoogleOAuthService.verifyIdToken(
      validatedData.idToken,
    );

    console.log("[Google OAuth] Provisioning user:", googleUserInfo.email);
    const user = await OAuthUserProvisioningService.provisionUser(
      googleUserInfo,
      "google",
    );

    const jwtPayload = {
      userId: user.id,
      email: user.email,
    };

    console.log("[Google OAuth] Generating tokens");
    const accessToken = JWTService.generateAccessToken(jwtPayload);
    const refreshToken = JWTService.generateRefreshToken(jwtPayload);

    console.log("[Google OAuth] Creating session");
    await SessionService.createSession(user.id, refreshToken);

    const response = ApiResponse.success(
      {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      "Authentication successful",
      200,
    );

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    console.log("[Google OAuth] Authentication successful for:", user.email);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      console.error("[Google OAuth] Validation error:", fieldErrors);
      return ApiResponse.error("Validation failed", 400, { fieldErrors });
    }

    if (error instanceof AppError) {
      console.error(
        `[Google OAuth] ${error.name}:`,
        error.message,
        error.statusCode,
      );
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Google OAuth] Unexpected error:", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
