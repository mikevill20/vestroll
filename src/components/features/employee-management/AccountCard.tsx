"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  CreditCard, 
  Building, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MoreHorizontal,
  Globe,
  Shield,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface AccountDetails {
  id: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  sortCode?: string;
  iban?: string;
  swiftCode?: string;
  accountType: string;
  accountHolderName: string;
  isAccountVerified: boolean;
  accountVerifiedAt?: string;
  bankAddress?: string;
  bankCity?: string;
  bankCountry?: string;
}

interface AccountCardProps {
  account: AccountDetails;
  onVerify?: (accountId: string) => Promise<void>;
  onEdit?: (accountId: string) => void;
  onDelete?: (accountId: string) => void;
  isLoading?: boolean;
}

const accountTypeLabels = {
  checking: "Checking Account",
  savings: "Savings Account",
  business: "Business Account",
  other: "Other Account",
};

const countryFlags: Record<string, string> = {
  "US": "🇺🇸",
  "GB": "🇬🇧",
  "DE": "🇩🇪",
  "FR": "🇫🇷",
  "IT": "🇮🇹",
  "ES": "🇪🇸",
  "NL": "🇳🇱",
  "CA": "🇨🇦",
  "AU": "🇦🇺",
};

export function AccountCard({ account, onVerify, onEdit, onDelete, isLoading }: AccountCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return "****" + accountNumber.slice(-4);
  };

  const handleVerify = async () => {
    if (!onVerify) return;
    
    setIsVerifying(true);
    setError(null);
    
    try {
      await onVerify(account.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const getVerificationStatus = () => {
    if (account.isAccountVerified) {
      return {
        label: "Verified",
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-green-600",
        description: account.accountVerifiedAt 
          ? `Verified on ${format(new Date(account.accountVerifiedAt), "MMM dd, yyyy")}`
          : "Account verified",
      };
    } else {
      return {
        label: "Not Verified",
        variant: "secondary" as const,
        icon: AlertCircle,
        color: "text-yellow-600",
        description: "Account verification required for payroll",
      };
    }
  };

  const statusInfo = getVerificationStatus();
  const StatusIcon = statusInfo.icon;

  const getCountrySpecificInfo = () => {
    if (account.routingNumber) {
      return {
        label: "Routing Number",
        value: account.routingNumber,
        icon: Building,
      };
    }
    if (account.sortCode) {
      return {
        label: "Sort Code",
        value: account.sortCode,
        icon: Building,
      };
    }
    if (account.iban) {
      return {
        label: "IBAN",
        value: account.iban,
        icon: CreditCard,
      };
    }
    return null;
  };

  const countryInfo = getCountrySpecificInfo();
  const CountryIcon = countryInfo?.icon || Building;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-medium truncate">
                {account.bankName}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span>{accountTypeLabels[account.accountType as keyof typeof accountTypeLabels]}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {account.bankCountry && countryFlags[account.bankCountry]}
                  {account.bankCountry || "Unknown"}
                </span>
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isLoading || isVerifying}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!account.isAccountVerified && onVerify && (
                  <DropdownMenuItem onClick={handleVerify} disabled={isVerifying}>
                    <Shield className="mr-2 h-4 w-4" />
                    {isVerifying ? "Verifying..." : "Verify Account"}
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(account.id)}>
                    <Building className="mr-2 h-4 w-4" />
                    Edit Details
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(account.id)} className="text-destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Delete Account
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {/* Account Number */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Account Number</span>
            </div>
            <span className="text-sm font-mono">{maskAccountNumber(account.accountNumber)}</span>
          </div>

          {/* Country-specific field */}
          {countryInfo && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CountryIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{countryInfo.label}</span>
              </div>
              <span className="text-sm font-mono">{countryInfo.value}</span>
            </div>
          )}

          {/* Account Holder */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Account Holder</span>
            </div>
            <span className="text-sm">{account.accountHolderName}</span>
          </div>

          {/* Bank Address */}
          {account.bankAddress && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Bank Address</span>
              </div>
              <span className="text-sm text-right">
                {account.bankAddress}
                {account.bankCity && `, ${account.bankCity}`}
                {account.bankCountry && `, ${account.bankCountry}`}
              </span>
            </div>
          )}

          {/* Verification Status */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                <span className="text-sm font-medium">Verification Status</span>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {statusInfo.description}
                </div>
              </div>
            </div>
          </div>

          {/* Action for unverified accounts */}
          {!account.isAccountVerified && onVerify && (
            <div className="pt-3 border-t">
              <Alert className="border-yellow-200 bg-yellow-50">
                <Clock className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Account verification is required before this account can be used for payroll processing.
                  Click the "Verify Account" button to start the verification process.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
