import { db, kybVerifications } from "../db";
import { eq } from "drizzle-orm";
import { KYB_REJECTION_CODES, type KybRejectionCode } from "./kyb.service";

export class KybAdminService {
 static async rejectVerification(
    verificationId: string,
    rejectionCode: KybRejectionCode,
    rejectionReason: string,
    reviewedBy: string
  ) {
    await db
      .update(kybVerifications)
      .set({
        status: "rejected",
        rejectionCode,
        rejectionReason,
        reviewedAt: new Date(),
      })
      .where(eq(kybVerifications.id, verificationId));

    return {
      success: true,
      message: "KYB verification rejected",
    };
  }

  /**
   * Example: Approve a KYB verification
   */
  static async approveVerification(
    verificationId: string,
    reviewedBy: string
  ) {
    await db
      .update(kybVerifications)
      .set({
        status: "verified",
        rejectionCode: null,
        rejectionReason: null,
        reviewedAt: new Date(),
      })
      .where(eq(kybVerifications.id, verificationId));

    return {
      success: true,
      message: "KYB verification approved",
    };
  }
}