"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AccountCard } from "./AccountCard";
import { AccountForm } from "./AccountForm";
import { 
  CreditCard, 
  Search, 
  Plus, 
  RefreshCw, 
  Shield,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

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
  employeeId: string;
  employeeName: string;
}

interface AccountManagementProps {
  employeeId: string;
  employeeName: string;
}

export function AccountManagement({ employeeId, employeeName }: AccountManagementProps) {
  const [accounts, setAccounts] = useState<AccountDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/accounts?employeeId=${employeeId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch accounts");
      }
      
      const data = await response.json();
      
      if (data.data) {
        // Add employee info to each account
        const accountsWithEmployee = data.data.map((account: any) => ({
          ...account,
          employeeId,
          employeeName,
        }));
        setAccounts(accountsWithEmployee);
      } else {
        setAccounts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (data: any) => {
    setError(null);
    
    try {
      const response = await fetch("/api/accounts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create account");
      }
      
      await fetchAccounts();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
      throw err;
    }
  };

  const handleUpdateAccount = async (data: any) => {
    setError(null);
    
    try {
      const response = await fetch("/api/accounts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update account");
      }
      
      await fetchAccounts();
      setEditingAccount(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account");
      throw err;
    }
  };

  const handleVerifyAccount = async (accountId: string) => {
    setError(null);
    
    try {
      const account = accounts.find(a => a.id === accountId);
      if (!account) throw new Error("Account not found");

      const response = await fetch("/api/accounts/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          accountNumber: account.accountNumber,
          bankName: account.bankName,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to verify account");
      }
      
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify account");
      throw err;
    }
  };

  const handleEditAccount = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setEditingAccount(account);
      setShowForm(true);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this bank account? This action cannot be undone.")) {
      return;
    }

    setError(null);
    
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete account");
      }
      
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountHolderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountNumber.includes(searchTerm)
  );

  const verifiedCount = accounts.filter(a => a.isAccountVerified).length;
  const unverifiedCount = accounts.length - verifiedCount;

  useEffect(() => {
    fetchAccounts();
  }, [employeeId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bank Accounts</h1>
          <p className="text-muted-foreground">
            Manage bank accounts for {employeeName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchAccounts}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Bank Account
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Accounts</p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Need Verification</p>
                <p className="text-2xl font-bold text-yellow-600">{unverifiedCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for unverified accounts */}
      {unverifiedCount > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You have {unverifiedCount} bank account{unverifiedCount > 1 ? 's' : ''} that need verification. 
            Unverified accounts cannot be used for payroll processing.
          </AlertDescription>
        </Alert>
      )}

      {/* Account Form */}
      {showForm && (
        <AccountForm
          employeeId={employeeId}
          initialData={editingAccount}
          onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount}
          onCancel={() => {
            setShowForm(false);
            setEditingAccount(null);
          }}
        />
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by bank name, account holder, or account number..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Loading bank accounts...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {accounts.length === 0 ? "No Bank Accounts" : "No Accounts Found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {accounts.length === 0 
                  ? `${employeeName} doesn't have any bank accounts yet. Add the first bank account to enable payroll processing.`
                  : "Try adjusting your search terms."
                }
              </p>
              {accounts.length === 0 && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Bank Account
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onVerify={handleVerifyAccount}
              onEdit={handleEditAccount}
              onDelete={handleDeleteAccount}
              isLoading={isLoading}
            />
          ))
        )}
      </div>
    </div>
  );
}
