import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { LogoUploadService } from "@/server/services/logo-upload.service";
import { db, users } from "@/server/db";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /organizations/logo-upload-url:
 *   get:
 *     summary: Get signed upload URL for organization logo
 *     description: Generates a pre-signed URL for uploading an organization logo directly to S3
 *     tags: [General]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Original filename (e.g., "logo.png")
 *       - in: query
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *         description: MIME type of the file (e.g., "image/png")
 *     responses:
 *       200:
 *         description: Signed URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 signedUrl:
 *                   type: string
 *                 key:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate the request
    const { userId, user } = await AuthUtils.authenticateRequest(req);

    // Get organization ID from user's profile
    if (!user.organizationId) {
      throw new AppError("User is not associated with an organization", 400);
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    const contentType = searchParams.get("contentType");

    // Validate required parameters
    if (!filename) {
      throw new AppError("Filename is required", 400);
    }

    if (!contentType) {
      throw new AppError("Content type is required", 400);
    }

    // Generate signed upload URL
    const result = await LogoUploadService.getSignedUploadUrl(
      user.organizationId,
      filename,
      contentType,
    );

    return ApiResponse.success(
      {
        signedUrl: result.signedUrl,
        key: result.key,
        expiresAt: result.expiresAt,
      },
      "Signed upload URL generated successfully",
    );
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Logo Upload URL Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
