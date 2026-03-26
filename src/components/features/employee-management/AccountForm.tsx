"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertCircle, Building, CreditCard, Globe } from "lucide-react";

const accountFormSchema = z.object({
  bankName: z.string().min(2, "Bank name is required").max(255),
  accountNumber: z.string()
    .min(8, "Account number must be at least 8 characters")
    .max(25, "Account number cannot exceed 25 characters")
    .regex(/^[0-9]+$/, "Account number must contain only numbers"),
  routingNumber: z.string()
    .min(9, "Routing number must be exactly 9 digits")
    .max(9, "Routing number must be exactly 9 digits")
    .regex(/^[0-9]+$/, "Routing number must contain only numbers")
    .optional()
    .or(z.literal("")),
  sortCode: z.string()
    .min(6, "Sort code must be exactly 6 digits")
    .max(6, "Sort code must be exactly 6 digits")
    .regex(/^[0-9]+$/, "Sort code must contain only numbers")
    .optional()
    .or(z.literal("")),
  iban: z.string()
    .min(15, "IBAN must be at least 15 characters")
    .max(34, "IBAN cannot exceed 34 characters")
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/i, "Invalid IBAN format")
    .optional()
    .or(z.literal("")),
  swiftCode: z.string()
    .min(8, "SWIFT code must be 8 or 11 characters")
    .max(11, "SWIFT code must be 8 or 11 characters")
    .regex(/^[A-Z]{6}[A-Z0-9]{2,5}$/i, "Invalid SWIFT code format")
    .optional()
    .or(z.literal("")),
  accountType: z.enum(["checking", "savings", "business", "other"]),
  accountHolderName: z.string().min(2, "Account holder name is required").max(255),
  bankAddress: z.string().max(500).optional().or(z.literal("")),
  bankCity: z.string().max(255).optional().or(z.literal("")),
  bankCountry: z.string().min(2, "Bank country is required").max(255),
}).refine((data) => {
  if (data.bankCountry === "US" && !data.routingNumber) return false;
  if (data.bankCountry === "GB" && !data.sortCode) return false;
  if (["DE", "FR", "IT", "ES", "NL", "BE", "AT", "PT", "IE", "FI", "GR"].includes(data.bankCountry) && !data.iban) return false;
  return true;
}, {
  message: "Required banking details are missing for the selected country",
  path: ["routingNumber"],
});

const countryOptions = [
  { value: "US", label: "United States", currency: "USD", requires: "routingNumber" },
  { value: "GB", label: "United Kingdom", currency: "GBP", requires: "sortCode" },
  { value: "DE", label: "Germany", currency: "EUR", requires: "iban" },
  { value: "FR", label: "France", currency: "EUR", requires: "iban" },
  { value: "IT", label: "Italy", currency: "EUR", requires: "iban" },
  { value: "ES", label: "Spain", currency: "EUR", requires: "iban" },
  { value: "NL", label: "Netherlands", currency: "EUR", requires: "iban" },
  { value: "CA", label: "Canada", currency: "CAD", requires: "routingNumber" },
  { value: "AU", label: "Australia", currency: "AUD", requires: "bsb" },
];

const accountTypeOptions = [
  { value: "checking", label: "Checking Account" },
  { value: "savings", label: "Savings Account" },
  { value: "business", label: "Business Account" },
  { value: "other", label: "Other" },
];

interface AccountFormProps {
  employeeId: string;
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export function AccountForm({ employeeId, initialData, onSubmit, onCancel }: AccountFormProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      bankName: initialData?.bankName || "",
      accountNumber: initialData?.accountNumber || "",
      routingNumber: initialData?.routingNumber || "",
      sortCode: initialData?.sortCode || "",
      iban: initialData?.iban || "",
      swiftCode: initialData?.swiftCode || "",
      accountType: initialData?.accountType || "checking",
      accountHolderName: initialData?.accountHolderName || "",
      bankAddress: initialData?.bankAddress || "",
      bankCity: initialData?.bankCity || "",
      bankCountry: initialData?.bankCountry || "US",
    },
  });

  const selectedCountry = watch("bankCountry");
  const selectedCountryInfo = countryOptions.find(c => c.value === selectedCountry);

  // Auto-validate when required fields change
  useEffect(() => {
    const requiredField = selectedCountryInfo?.requires;
    const fieldValue = watch(requiredField as any);
    const accountNumber = watch("accountNumber");
    const bankName = watch("bankName");

    if (requiredField && fieldValue && accountNumber && bankName) {
      const timer = setTimeout(() => {
        validateAccount();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [watch("accountNumber"), watch("routingNumber"), watch("sortCode"), watch("iban"), watch("bankName"), selectedCountry]);

  const validateAccount = async () => {
    const isValid = await trigger();
    if (!isValid) return;

    setIsValidating(true);
    setError(null);

    try {
      const formData = watch();
      const response = await fetch("/api/accounts/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Validation failed");
      }

      setValidationResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Account validation failed");
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFormSubmit = async (data: z.infer<typeof accountFormSchema>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ employeeId, ...data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save account details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCountrySpecificFields = () => {
    switch (selectedCountryInfo?.requires) {
      case "routingNumber":
        return (
          <div className="space-y-2">
            <Label htmlFor="routingNumber">Routing Number *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="routingNumber"
                placeholder="123456789"
                className="pl-9"
                {...register("routingNumber")}
              />
            </div>
            {errors.routingNumber && (
              <p className="text-sm text-destructive">{errors.routingNumber.message}</p>
            )}
          </div>
        );
      case "sortCode":
        return (
          <div className="space-y-2">
            <Label htmlFor="sortCode">Sort Code *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="sortCode"
                placeholder="123456"
                className="pl-9"
                {...register("sortCode")}
              />
            </div>
            {errors.sortCode && (
              <p className="text-sm text-destructive">{errors.sortCode.message}</p>
            )}
          </div>
        );
      case "iban":
        return (
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN *</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="iban"
                placeholder="GB82WEST12345698765432"
                className="pl-9 uppercase"
                {...register("iban")}
              />
            </div>
            {errors.iban && (
              <p className="text-sm text-destructive">{errors.iban.message}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Bank Account Details
        </CardTitle>
        <CardDescription>
          Add bank account information for payroll processing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Validation Status */}
          {validationResult && (
            <Alert className={validationResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={validationResult.isValid ? "text-green-800" : "text-red-800"}>
                  {validationResult.isValid 
                    ? `Account validated successfully - ${validationResult.bankName}`
                    : validationResult.error
                  }
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                placeholder="Bank of America"
                {...register("bankName")}
              />
              {errors.bankName && (
                <p className="text-sm text-destructive">{errors.bankName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankCountry">Bank Country *</Label>
              <Select value={selectedCountry} onValueChange={(value) => setValue("bankCountry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {country.label} ({country.currency})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bankCountry && (
                <p className="text-sm text-destructive">{errors.bankCountry.message}</p>
              )}
            </div>
          </div>

          {/* Country-specific fields */}
          {renderCountrySpecificFields()}

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="accountNumber"
                placeholder="123456789"
                className="pl-9"
                {...register("accountNumber")}
              />
            </div>
            {errors.accountNumber && (
              <p className="text-sm text-destructive">{errors.accountNumber.message}</p>
            )}
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type *</Label>
              <Select value={watch("accountType")} onValueChange={(value) => setValue("accountType", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountType && (
                <p className="text-sm text-destructive">{errors.accountType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name *</Label>
              <Input
                id="accountHolderName"
                placeholder="John Doe"
                {...register("accountHolderName")}
              />
              {errors.accountHolderName && (
                <p className="text-sm text-destructive">{errors.accountHolderName.message}</p>
              )}
            </div>
          </div>

          {/* Optional International Fields */}
          {(selectedCountry !== "US" && selectedCountry !== "GB") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="swiftCode">SWIFT Code</Label>
                <Input
                  id="swiftCode"
                  placeholder="BOFAUS3N"
                  className="uppercase"
                  {...register("swiftCode")}
                />
                {errors.swiftCode && (
                  <p className="text-sm text-destructive">{errors.swiftCode.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Bank Address */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankAddress">Bank Address</Label>
              <Input
                id="bankAddress"
                placeholder="123 Banking Street"
                {...register("bankAddress")}
              />
              {errors.bankAddress && (
                <p className="text-sm text-destructive">{errors.bankAddress.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankCity">Bank City</Label>
                <Input
                  id="bankCity"
                  placeholder="New York"
                  {...register("bankCity")}
                />
                {errors.bankCity && (
                  <p className="text-sm text-destructive">{errors.bankCity.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={validateAccount}
              disabled={isValidating || !watch("accountNumber") || !watch("bankName")}
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Validate Account
                </>
              )}
            </Button>

            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !validationResult?.isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Account Details"
              )}
            </Button>

            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
