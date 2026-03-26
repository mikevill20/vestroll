import { 
  KYB_REJECTION_CODES, 
  KYB_REJECTION_MESSAGES, 
  KYB_REJECTION_FIELD_MAP,
  type KybRejectionCode 
} from "@/types/kyb";

interface KybStatusResponse {
  status: "not_started" | "pending" | "verified" | "rejected";
  rejectionReason: string | null;
  rejectionCode: KybRejectionCode | null;
  submittedAt: string | null;
}

export function useKybRejectionHandler(status: KybStatusResponse) {
  if (status.status !== "rejected" || !status.rejectionCode) {
    return null;
  }

  const code = status.rejectionCode;
  const fieldToHighlight = KYB_REJECTION_FIELD_MAP[code];
  const defaultMessage = KYB_REJECTION_MESSAGES[code];

  return {
    code,
    fieldToHighlight,
    message: status.rejectionReason || defaultMessage,
    defaultMessage,
  };
}