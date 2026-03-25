import { z } from "zod";

const base64UrlRegex = /^[A-Za-z0-9_-]+$/;

const base64UrlString = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required`)
    .regex(base64UrlRegex, `${fieldName} must be a valid base64url string`);

export const RegisterSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  businessEmail: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agreement: z
    .boolean()
    .refine((val) => val === true, "You must agree to the terms"),
  accountType: z.string().optional(),
  companyName: z.string().optional(),
  companySize: z.string().optional(),
  companyIndustry: z.string().optional(),
  headquarterCountry: z.string().optional(),
  businessDescription: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const ResendOTPSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z.string().email("Invalid email format"),
  ),
});

export type ResendOTPInput = z.infer<typeof ResendOTPSchema>;

export const GoogleOAuthSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export type GoogleOAuthInput = z.infer<typeof GoogleOAuthSchema>;

export const AppleOAuthSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
  user: z
    .object({
      name: z
        .object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
        })
        .optional(),
      email: z.string().optional(),
    })
    .optional(),
});

export type AppleOAuthInput = z.infer<typeof AppleOAuthSchema>;

export const VerifyEmailSchema = z.object({
  email: z
    .string()
    .transform((email) => email.toLowerCase().trim())
    .pipe(z.string().email("Invalid email format")),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .transform((email) => email.toLowerCase().trim())
    .pipe(z.string().email("Invalid email format")),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const PasskeyRegistrationSchema = z
  .object({
    challenge: base64UrlString("Challenge").max(
      1024,
      "Challenge must be at most 1024 characters",
    ),
    credentialId: base64UrlString("Credential ID").max(
      1024,
      "Credential ID must be at most 1024 characters",
    ),
    attestationObject: base64UrlString("Attestation object").max(
      20000,
      "Attestation object must be at most 20000 characters",
    ),
    clientDataJSON: base64UrlString("Client data JSON").max(
      5000,
      "Client data JSON must be at most 5000 characters",
    ),
  })
  .strict();

export type PasskeyRegistrationInput = z.infer<
  typeof PasskeyRegistrationSchema
>;
