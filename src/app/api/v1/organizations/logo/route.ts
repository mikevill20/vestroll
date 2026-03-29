import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { LogoUploadService } from "@/server/services/logo-upload.service";
import { db, users, companyProfiles } from "@/server/db";
import { eq } from "drizzle-orm";

// Allowed domains for logo URLs (same validation as user avatars)
const ALLOWED_LOGO_DOMAINS = [
  "vestroll-assets.s3.amazonaws.com",
  "s3.amazonaws.com",
  "storage.googleapis.com",
];

/**
 * Validates that the logo URL is from an allowed domain
 */
function validateLogoUrl(logoUrl: string): void {
  try {
    const url = new URL(logoUrl);
    const hostname = url.hostname.toLowerCase();

    const isAllowed = ALLOWED_LOGO_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );

    if (!isAllowed) {
      throw new AppError(
        `Logo URL domain '${hostname}' is not allowed. Allowed domains: ${ALLOWED_LOGO_DOMAINS.join(", ")}`,
        400,
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Invalid logo URL format", 400);
  }
}

/**
 * @swagger
 * /organizations/logo:
 *   patch:
 *     summary: Update organization logo
 *     description: Saves the logo URL to the organization's company profile after client uploads to S3
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *                 description: S3 key returned from the signed URL upload (e.g., "logos/{org-id}/{uuid}.png")
 *     responses:
 *       200:
 *         description: Logo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logoUrl:
 *                   type: string
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company profile not found
 *       500:
 *         description: Server error
 */
export async function PATCH(req: NextRequest) {
  try {
    // Authenticate the request
    const { userId, user } = await AuthUtils.authenticateRequest(req);

    // Get organization ID from user's profile
    if (!user.organizationId) {
      throw new AppError("User is not associated with an organization", 400);
    }

    // Parse request body
    const body = await req.json();
    const { key } = body;

    if (!key) {
      throw new AppError("Key is required", 400);
    }

    // Validate the key format (should be logos/{orgId}/{uuid}.{ext})
    if (!key.startsWith("logos/")) {
      throw new AppError("Invalid key format", 400);
    }

    // Construct the logo URL
    const logoUrl = LogoUploadService.getLogoUrl(key);

    // Validate the URL domain
    validateLogoUrl(logoUrl);

    // Check if company profile exists
    const [existingProfile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.organizationId, user.organizationId as string))
      .limit(1);

    if (!existingProfile) {
      // Create a new company profile with the logo
      const [newProfile] = await db
        .insert(companyProfiles)
        .values({
          userId: userId,
          organizationId: user.organizationId as string,
          logoUrl,
          // Required fields - we'll use placeholders for now
          brandName: user.organizationName || "Unknown",
          registeredName: user.organizationName || "Unknown",
          registrationNumber: "",
          country: "",
          address: "",
          city: "",
          billingCountry: "NG", // Default for now
        })
        .returning();

      return ApiResponse.success(
        { logoUrl: newProfile.logoUrl },
        "Logo saved successfully",
      );
    }

    // Update existing profile
    const [updatedProfile] = await db
      .update(companyProfiles)
      .set({
        logoUrl,
        updatedAt: new Date(),
      })
      .where(eq(companyProfiles.organizationId, user.organizationId as string))
      .returning();

    return ApiResponse.success(
      { logoUrl: updatedProfile.logoUrl },
      "Logo updated successfully",
    );
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Logo Update Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
