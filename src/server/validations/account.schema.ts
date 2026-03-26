import { z } from "zod";

export const accountTypeEnum = z.enum(["checking", "savings", "business", "other"]);

export const validateAccountNumberSchema = z.object({
  accountNumber: z.string()
    .min(8, "Account number must be at least 8 characters")
    .max(25, "Account number cannot exceed 25 characters")
    .regex(/^[0-9]+$/, "Account number must contain only numbers"),
  routingNumber: z.string()
    .min(9, "Routing number must be exactly 9 digits")
    .max(9, "Routing number must be exactly 9 digits")
    .regex(/^[0-9]+$/, "Routing number must contain only numbers")
    .optional(),
  sortCode: z.string()
    .min(6, "Sort code must be exactly 6 digits")
    .max(6, "Sort code must be exactly 6 digits")
    .regex(/^[0-9]+$/, "Sort code must contain only numbers")
    .optional(),
  iban: z.string()
    .min(15, "IBAN must be at least 15 characters")
    .max(34, "IBAN cannot exceed 34 characters")
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/i, "Invalid IBAN format")
    .optional(),
  swiftCode: z.string()
    .min(8, "SWIFT code must be 8 or 11 characters")
    .max(11, "SWIFT code must be 8 or 11 characters")
    .regex(/^[A-Z]{6}[A-Z0-9]{2,5}$/i, "Invalid SWIFT code format")
    .optional(),
  bankName: z.string()
    .min(2, "Bank name is required")
    .max(255, "Bank name cannot exceed 255 characters"),
  accountType: accountTypeEnum,
  accountHolderName: z.string()
    .min(2, "Account holder name is required")
    .max(255, "Account holder name cannot exceed 255 characters"),
  bankAddress: z.string().max(500, "Bank address cannot exceed 500 characters").optional(),
  bankCity: z.string().max(255, "Bank city cannot exceed 255 characters").optional(),
  bankCountry: z.string()
    .min(2, "Bank country is required")
    .max(255, "Bank country cannot exceed 255 characters"),
}).refine((data) => {
  // For US accounts, routing number is required
  if (data.bankCountry === "US" && !data.routingNumber) {
    return false;
  }
  // For UK accounts, sort code is required
  if (data.bankCountry === "GB" && !data.sortCode) {
    return false;
  }
  // For European accounts, IBAN is required
  if (["DE", "FR", "IT", "ES", "NL", "BE", "AT", "PT", "IE", "FI", "GR", "LU", "CY", "MT", "SI", "SK", "EE", "LV", "LT", "HR", "BG", "RO", "CZ", "HU", "PL", "DK", "SE", "NO"].includes(data.bankCountry) && !data.iban) {
    return false;
  }
  return true;
}, {
  message: "Required banking details are missing for the selected country",
  path: ["routingNumber"],
});

export const updateEmployeeAccountSchema = z.object({
  bankName: z.string().min(2, "Bank name is required").max(255).optional(),
  accountNumber: z.string()
    .min(8, "Account number must be at least 8 characters")
    .max(25, "Account number cannot exceed 25 characters")
    .regex(/^[0-9]+$/, "Account number must contain only numbers")
    .optional(),
  routingNumber: z.string()
    .min(9, "Routing number must be exactly 9 digits")
    .max(9, "Routing number must be exactly 9 digits")
    .regex(/^[0-9]+$/, "Routing number must contain only numbers")
    .optional(),
  sortCode: z.string()
    .min(6, "Sort code must be exactly 6 digits")
    .max(6, "Sort code must be exactly 6 digits")
    .regex(/^[0-9]+$/, "Sort code must contain only numbers")
    .optional(),
  iban: z.string()
    .min(15, "IBAN must be at least 15 characters")
    .max(34, "IBAN cannot exceed 34 characters")
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/i, "Invalid IBAN format")
    .optional(),
  swiftCode: z.string()
    .min(8, "SWIFT code must be 8 or 11 characters")
    .max(11, "SWIFT code must be 8 or 11 characters")
    .regex(/^[A-Z]{6}[A-Z0-9]{2,5}$/i, "Invalid SWIFT code format")
    .optional(),
  accountType: accountTypeEnum.optional(),
  accountHolderName: z.string().min(2, "Account holder name is required").max(255).optional(),
  bankAddress: z.string().max(500).optional(),
  bankCity: z.string().max(255).optional(),
  bankCountry: z.string().min(2, "Bank country is required").max(255).optional(),
});

export const verifyAccountSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  accountNumber: z.string().min(8, "Account number is required"),
  bankName: z.string().min(2, "Bank name is required"),
});

export type ValidateAccountNumberInput = z.infer<typeof validateAccountNumberSchema>;
export type UpdateEmployeeAccountInput = z.infer<typeof updateEmployeeAccountSchema>;
export type VerifyAccountInput = z.infer<typeof verifyAccountSchema>;
