import { z } from "zod";

export const RegisterSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  businessEmail: z.string().email("Invalid email format"),
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
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
