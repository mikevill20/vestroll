import { z } from "zod";

const VALID_REGISTRATION_TYPES = [
  "Limited Liability Company (LLC)",
  "Corporation",
  "Partnership",
  "Sole Proprietorship",
  "Limited Partnership (LP)",
  "Limited Liability Partnership (LLP)",
  "S Corporation",
  "Non-Profit Corporation",
  "Professional Corporation",
  "Other",
] as const;

export const KybSubmitSchema = z.object({
  registrationType: z.enum(VALID_REGISTRATION_TYPES, {
    message: "Invalid business registration type",
  }),
  registrationNo: z
    .string()
    .min(1, "Registration number is required")
    .max(100, "Registration number is too long")
    .trim(),
});

export type KybSubmitInput = z.infer<typeof KybSubmitSchema>;

export const KYB_FILE_CONSTRAINTS = {
  maxSizeBytes: 5 * 1024 * 1024,
  allowedMimeTypes: [
    "image/png",
    "image/jpeg",
    "image/svg+xml",
    "image/gif",
    "application/pdf",
  ],
} as const;
