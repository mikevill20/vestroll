/**
 * KYB (Know Your Business) Type Definitions
 * Shared types for KYB verification across frontend and backend
 */

export const KYB_REJECTION_CODES = {
  INVALID_CERTIFICATE: "INVALID_CERTIFICATE",
  INVALID_MEMORANDUM: "INVALID_MEMORANDUM",
  INVALID_FORM_C02_C07: "INVALID_FORM_C02_C07",
  INVALID_REGISTRATION_NUMBER: "INVALID_REGISTRATION_NUMBER",
  EXPIRED_DOCUMENTS: "EXPIRED_DOCUMENTS",
  UNREADABLE_DOCUMENTS: "UNREADABLE_DOCUMENTS",
  MISMATCHED_INFORMATION: "MISMATCHED_INFORMATION",
  INCOMPLETE_DOCUMENTS: "INCOMPLETE_DOCUMENTS",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  OTHER: "OTHER",
} as const;

export type KybRejectionCode = (typeof KYB_REJECTION_CODES)[keyof typeof KYB_REJECTION_CODES];

export type KybStatus = "not_started" | "pending" | "verified" | "rejected";

export interface KybVerificationStatus {
  status: KybStatus;
  rejectionReason: string | null;
  rejectionCode: KybRejectionCode | null;
  submittedAt: Date | null;
}

/**
 * Helper to get user-friendly messages for rejection codes
 */
export const KYB_REJECTION_MESSAGES: Record<KybRejectionCode, string> = {
  INVALID_CERTIFICATE: "Please upload a valid incorporation certificate",
  INVALID_MEMORANDUM: "Please upload a valid memorandum of articles",
  INVALID_FORM_C02_C07: "Please upload a valid Form C02/C07",
  INVALID_REGISTRATION_NUMBER: "Please verify your business registration number",
  EXPIRED_DOCUMENTS: "One or more documents have expired. Please upload current documents",
  UNREADABLE_DOCUMENTS: "Documents are unclear. Please upload higher quality scans or photos",
  MISMATCHED_INFORMATION: "Information across documents doesn't match. Please verify and resubmit",
  INCOMPLETE_DOCUMENTS: "Required information is missing. Please upload complete documents",
  SUSPICIOUS_ACTIVITY: "Your submission requires additional review. Please contact support",
  OTHER: "Please review the rejection reason and resubmit",
};

/**
 * Helper to determine which field to highlight based on rejection code
 */
export const KYB_REJECTION_FIELD_MAP: Record<KybRejectionCode, string | null> = {
  INVALID_CERTIFICATE: "incorporationCertificate",
  INVALID_MEMORANDUM: "memorandumArticle",
  INVALID_FORM_C02_C07: "formC02C07",
  INVALID_REGISTRATION_NUMBER: "registrationNo",
  EXPIRED_DOCUMENTS: null, // Multiple fields may be affected
  UNREADABLE_DOCUMENTS: null, // Multiple fields may be affected
  MISMATCHED_INFORMATION: null, // Multiple fields may be affected
  INCOMPLETE_DOCUMENTS: null, // Multiple fields may be affected
  SUSPICIOUS_ACTIVITY: null, // No specific field
  OTHER: null, // No specific field
};
