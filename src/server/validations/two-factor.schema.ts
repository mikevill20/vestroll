import { z } from "zod";

const totpCodeSchema = z
  .string()
  .length(6, "TOTP code must be exactly 6 digits")
  .regex(/^\d{6}$/, "TOTP code must contain only digits");

const backupCodeSchema = z
  .string()
  .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Invalid backup code format. Expected format: XXXX-XXXX-XXXX");

export const VerifySetupSchema = z.object({
  totpCode: totpCodeSchema,
});

export const VerifyTwoFactorSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  totpCode: totpCodeSchema.optional(),
  backupCode: backupCodeSchema.optional(),
}).refine(
  (data) => data.totpCode || data.backupCode,
  { message: "Either totpCode or backupCode is required" }
);

export const DisableTwoFactorSchema = z.object({
  password: z.string().min(1, "Password is required"),
  totpCode: totpCodeSchema,
});

export const RegenerateBackupCodesSchema = z.object({
  totpCode: totpCodeSchema,
});

export type VerifySetupInput = z.infer<typeof VerifySetupSchema>;
export type VerifyTwoFactorInput = z.infer<typeof VerifyTwoFactorSchema>;
export type DisableTwoFactorInput = z.infer<typeof DisableTwoFactorSchema>;
export type RegenerateBackupCodesInput = z.infer<typeof RegenerateBackupCodesSchema>;
