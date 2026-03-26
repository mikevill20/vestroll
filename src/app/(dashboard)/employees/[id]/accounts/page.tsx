"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AccountManagement } from "@/components/features/employee-management/AccountManagement";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
}

export default function EmployeeAccountsPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployee = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch employee");
      }
      
      const data = await response.json();
      setEmployee(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employee");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Loading employee information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error || "Employee not found"}</AlertDescription>
            </Alert>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employee
        </Button>
        
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-muted-foreground">
              {employee.role} {employee.department && `• ${employee.department}`}
            </p>
            <p className="text-sm text-muted-foreground">{employee.email}</p>
          </div>
        </div>
      </div>

      <AccountManagement 
        employeeId={employee.id} 
        employeeName={`${employee.firstName} ${employee.lastName}`}
      />
    </div>
  );
}
