import crypto from "crypto";
import { db, kybVerifications, kybStatusEnum } from "../db";
import { eq } from "drizzle-orm";
import { ConflictError } from "../utils/errors";
import { Logger } from "./logger.service";

export type KybStatus = (typeof kybStatusEnum.enumValues)[number];

// Re-export from shared types for backward compatibility
export { KYB_REJECTION_CODES, type KybRejectionCode } from "@/types/kyb";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export class KybService {
  
  static async getStatus(userId: string) {
    const [verification] = await db
      .select()
      .from(kybVerifications)
      .where(eq(kybVerifications.userId, userId))
      .limit(1);

    if (!verification) {
      return {
        status: "not_started" as KybStatus,
        rejectionReason: null,
        rejectionCode: null,
        submittedAt: null,
      };
    }

    return {
      status: verification.status,
      rejectionReason: verification.rejectionReason,
      rejectionCode: verification.rejectionCode,
      submittedAt: verification.submittedAt,
    };
  }

  static async uploadToCloudinary(
    file: File,
    userId: string,
    fieldName: string,
  ): Promise<{ publicId: string; secureUrl: string }> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error("Cloudinary environment variables are not configured");
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = `kyb/${userId}`;
    const publicId = `${fieldName}-${crypto.randomUUID()}`;

    const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + CLOUDINARY_API_SECRET)
      .digest("hex");

    const formData = new FormData();
    formData.append("file", dataUri);
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);
    formData.append("public_id", publicId);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: "POST", body: formData },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      Logger.error("Cloudinary upload failed", { errorBody, statusCode: response.status });
      throw new Error("Failed to upload file to Cloudinary");
    }

    const result = await response.json();

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
    };
  }

  static async deleteFromCloudinary(publicIds: string[]): Promise<void> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      Logger.warn("Cloudinary environment variables not configured, cannot delete files", { missingEnv: true });
      return;
    }

    for (const publicId of publicIds) {
      try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
        const signature = crypto
          .createHash("sha1")
          .update(paramsToSign + CLOUDINARY_API_SECRET)
          .digest("hex");

        const formData = new FormData();
        formData.append("public_id", publicId);
        formData.append("api_key", CLOUDINARY_API_KEY);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);

        await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
          { method: "POST", body: formData },
        );
      } catch (error) {
        Logger.error("Failed to delete file from Cloudinary", { publicId, error: String(error) });
      }
    }
  }

  static async submit(data: {
    userId: string;
    registrationType: string;
    registrationNo: string;
    incorporationCertificatePath: string;
    incorporationCertificateUrl: string;
    memorandumArticlePath: string;
    memorandumArticleUrl: string;
    formC02C07Path: string | null;
    formC02C07Url: string | null;
  }) {
    return await db.transaction(async (tx) => {

      const [existing] = await tx
        .select()
        .from(kybVerifications)
        .where(eq(kybVerifications.userId, data.userId))
        .limit(1);

      if (existing) {
        if (existing.status === "verified") {
          throw new ConflictError("KYB verification already approved");
        }
        if (existing.status === "pending") {
          throw new ConflictError("A KYB verification is already pending review");
        }

        const oldPublicIds = [
          existing.incorporationCertificatePath,
          existing.memorandumArticlePath,
          existing.formC02C07Path,
        ].filter((id): id is string => id !== null);

        await KybService.deleteFromCloudinary(oldPublicIds);

        await tx
          .delete(kybVerifications)
          .where(eq(kybVerifications.id, existing.id));
      }

      const [record] = await tx
        .insert(kybVerifications)
        .values({
          userId: data.userId,
          registrationType: data.registrationType,
          registrationNo: data.registrationNo,
          incorporationCertificatePath: data.incorporationCertificatePath,
          incorporationCertificateUrl: data.incorporationCertificateUrl,
          memorandumArticlePath: data.memorandumArticlePath,
          memorandumArticleUrl: data.memorandumArticleUrl,
          formC02C07Path: data.formC02C07Path,
          formC02C07Url: data.formC02C07Url,
          status: "pending",
        })
        .returning();

      return {
        id: record.id,
        status: record.status,
        registrationType: record.registrationType,
        registrationNo: record.registrationNo,
        createdAt: record.createdAt,
      };
    });
  }
}
