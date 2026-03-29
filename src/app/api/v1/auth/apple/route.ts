import { NextRequest } from "next/server";
import { AppleOAuthSchema } from "@/server/validations/auth.schema";
import { AppleOAuthService } from "@/server/services/apple-oauth.service";
import { OAuthUserProvisioningService } from "@/server/services/oauth-user-provisioning.service";
import { JWTService } from "@/server/services/jwt.service";
import { SessionService } from "@/server/services/session.service";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { ZodError } from "zod";

/**
 * @swagger
 * /auth/apple:
 *   post:
 *     summary: Apple OAuth login
 *     description: Authenticate or register user using Apple ID
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
 *               user:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                   email:
 *                     type: string
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
    const validatedData = AppleOAuthSchema.parse(body);

    console.log("[Apple OAuth] Verifying ID token");
    const oauthUserInfo = await AppleOAuthService.verifyIdToken(
      validatedData.idToken,
    );

    if (validatedData.user) {
      if (validatedData.user.name) {
        oauthUserInfo.firstName =
          validatedData.user.name.firstName || oauthUserInfo.firstName;
        oauthUserInfo.lastName =
          validatedData.user.name.lastName || oauthUserInfo.lastName;
      }

      if (validatedData.user.email) {
        oauthUserInfo.email = validatedData.user.email;
      }
    }

    console.log("[Apple OAuth] Provisioning user:", oauthUserInfo.email);
    const user = await OAuthUserProvisioningService.provisionUser(
      oauthUserInfo,
      "apple",
    );

    const jwtPayload = {
      userId: user.id,
      email: user.email,
    };

    console.log("[Apple OAuth] Generating tokens");
    const accessToken = JWTService.generateAccessToken(jwtPayload);
    const refreshToken = JWTService.generateRefreshToken(jwtPayload);

    console.log("[Apple OAuth] Creating session");
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

    console.log("[Apple OAuth] Authentication successful for:", user.email);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      console.error("[Apple OAuth] Validation error:", fieldErrors);
      return ApiResponse.error("Validation failed", 400, { fieldErrors });
    }

    if (error instanceof AppError) {
      console.error(
        `[Apple OAuth] ${error.name}:`,
        error.message,
        error.statusCode,
      );
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Apple OAuth] Unexpected error:", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
