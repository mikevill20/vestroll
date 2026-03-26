import { z } from "zod";

export const BankVerificationSchema = z.object({
  accountNumber: z
    .string()
    .min(1, "Account number is required")
    .regex(/^\d+$/, "Account number must contain only digits")
    .length(10, "Account number must be 10 digits"),
  bankCode: z
    .string()
    .min(1, "Bank code is required"),
  providerId: z.enum(["paystack", "flutterwave"], {
    errorMap: () => ({ message: "Provider must be paystack or flutterwave" }),
  }),
});

export type BankVerificationInput = z.infer<typeof BankVerificationSchema>;
