import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError, ValidationError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { KybSubmitSchema, KYB_FILE_CONSTRAINTS } from "@/server/validations/kyb.schema";
import { KybService } from "@/server/services/kyb.service";
import { ZodError } from "zod";
import { withKybRateLimit } from "@/server/services/rate-limit.service";

/**
 * @swagger
 * /kyb/submit:
 *   post:
 *     summary: Submit KYB documents
 *     description: Upload business registration documents for KYB verification
 *     tags: [General]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - registrationType
 *               - registrationNo
 *               - incorporationCertificate
 *               - memorandumArticle
 *             properties:
 *               registrationType:
 *                 type: string
 *               registrationNo:
 *                 type: string
 *               incorporationCertificate:
 *                 type: string
 *                 format: binary
 *               memorandumArticle:
 *                 type: string
 *                 format: binary
 *               formC02C07:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: KYB documents submitted successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       409:
 *         description: KYB already submitted or approved
 */
export const POST = withKybRateLimit(async (req: NextRequest) => {
  const uploadedPublicIds: string[] = [];

  try {

    const { userId } = await AuthUtils.authenticateRequest(req);

    const formData = await req.formData();

    const registrationType = formData.get("registrationType") as string | null;
    const registrationNo = formData.get("registrationNo") as string | null;

    const validatedFields = KybSubmitSchema.parse({
      registrationType,
      registrationNo,
    });

    const incorporationCertificate = formData.get("incorporationCertificate");
    const memorandumArticle = formData.get("memorandumArticle");
    const formC02C07 = formData.get("formC02C07");

    if (!incorporationCertificate || !(incorporationCertificate instanceof File)) {
      throw new ValidationError("Incorporation certificate is required", {
        fieldErrors: { incorporationCertificate: "File is required" },
      });
    }

    if (!memorandumArticle || !(memorandumArticle instanceof File)) {
      throw new ValidationError("Memorandum & Article of Association is required", {
        fieldErrors: { memorandumArticle: "File is required" },
      });
    }

    const filesToValidate: { file: File; name: string }[] = [
      { file: incorporationCertificate, name: "incorporationCertificate" },
      { file: memorandumArticle, name: "memorandumArticle" },
    ];

    const hasFormC02C07 = formC02C07 && formC02C07 instanceof File;
    if (hasFormC02C07) {
      filesToValidate.push({ file: formC02C07, name: "formC02C07" });
    }

    for (const { file, name } of filesToValidate) {
      if (file.size > KYB_FILE_CONSTRAINTS.maxSizeBytes) {
        throw new ValidationError(`${name} exceeds maximum file size of 5MB`, {
          fieldErrors: { [name]: "File size must be less than 5MB" },
        });
      }

      if (
        !KYB_FILE_CONSTRAINTS.allowedMimeTypes.includes(
          file.type as (typeof KYB_FILE_CONSTRAINTS.allowedMimeTypes)[number],
        )
      ) {
        throw new ValidationError(`${name} has an unsupported file type`, {
          fieldErrors: { [name]: "Allowed types: PNG, JPG, SVG, GIF, PDF" },
        });
      }
    }

    const incCert = await KybService.uploadToCloudinary(
      incorporationCertificate,
      userId,
      "incorporation-certificate",
    );
    uploadedPublicIds.push(incCert.publicId);

    const memArticle = await KybService.uploadToCloudinary(
      memorandumArticle,
      userId,
      "memorandum-article",
    );
    uploadedPublicIds.push(memArticle.publicId);

    let formC02C07Result: { publicId: string; secureUrl: string } | null = null;
    if (hasFormC02C07) {
      formC02C07Result = await KybService.uploadToCloudinary(
        formC02C07,
        userId,
        "form-c02-c07",
      );
      uploadedPublicIds.push(formC02C07Result.publicId);
    }

    const result = await KybService.submit({
      userId,
      registrationType: validatedFields.registrationType,
      registrationNo: validatedFields.registrationNo,
      incorporationCertificatePath: incCert.publicId,
      incorporationCertificateUrl: incCert.secureUrl,
      memorandumArticlePath: memArticle.publicId,
      memorandumArticleUrl: memArticle.secureUrl,
      formC02C07Path: formC02C07Result?.publicId ?? null,
      formC02C07Url: formC02C07Result?.secureUrl ?? null,
    });

    return ApiResponse.success(result, "KYB documents submitted successfully", 201);
  } catch (error) {

    if (uploadedPublicIds.length > 0) {
      await KybService.deleteFromCloudinary(uploadedPublicIds);
    }

    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((issue: any) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      return ApiResponse.error("Validation failed", 400, { fieldErrors });
    }

    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[KYB Submit Error]", error);
    return ApiResponse.error("Internal server error", 500);
}
});
