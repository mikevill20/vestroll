import { z } from "zod";

export const BankVerificationSchema = z
  .object({
    accountNumber: z
      .string()
      .min(1, "Account number is required")
      .regex(/^\d+$/, "Account number must contain only digits")
      .length(10, "Account number must be 10 digits")
      .describe(
        "10-digit bank account number to verify. Digits only, no spaces or dashes. Validated against the selected payment provider's account lookup API.",
      ),
    bankCode: z
      .string()
      .min(1, "Bank code is required")
      .describe(
        "Numeric or alphanumeric bank/institution code as defined by the payment provider (e.g. Paystack bank code '044' for Access Bank Nigeria). Used by the provider to route the account lookup.",
      ),
    providerId: z
      .enum(["paystack", "flutterwave"])
      .describe(
        "Payment provider to use for the account name-enquiry lookup. 'paystack' = Paystack Resolve Account API; 'flutterwave' = Flutterwave Verify Bank Account API.",
      ),
  })
  .describe(
    "Request body for verifying a bank account's details (name enquiry) via a third-party payment provider before adding it as a payout destination.",
  );

export type BankVerificationInput = z.infer<typeof BankVerificationSchema>;
