"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Mail, Building, User, Lock } from "lucide-react";
import { acceptInvitationSchema } from "@/server/validations/invitation.schema";

const acceptInvitationFormSchema = z.object({
  token: z.string().min(1, "Token is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  organizationName: string;
  invitedByName: string;
  message: string | null;
  expiresAt: string;
}

const roleLabels = {
  admin: "Administrator",
  hr_manager: "HR Manager",
  payroll_manager: "Payroll Manager",
  employee: "Employee",
};

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<z.infer<typeof acceptInvitationFormSchema>>({
    resolver: zodResolver(acceptInvitationFormSchema),
    defaultValues: {
      token: token || "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (token) {
      setValue("token", token);
      fetchInvitationDetails(token);
    } else {
      setError("Invalid invitation link");
      setIsLoading(false);
    }
  }, [token, setValue]);

  const fetchInvitationDetails = async (invitationToken: string) => {
    try {
      const response = await fetch(`/api/invitations/validate?token=${invitationToken}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid invitation");
      }

      const data = await response.json();
      setInvitationDetails(data.invitation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitation details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: z.infer<typeof acceptInvitationFormSchema>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: data.token,
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to accept invitation");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?message=invitation-accepted");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/invitations/decline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to decline invitation");
      }

      router.push("/login?message=invitation-declined");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline invitation");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Loading invitation details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitationDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Welcome Aboard!</h2>
            <p className="text-muted-foreground mb-4">
              Your account has been created successfully. You'll be redirected to login shortly.
            </p>
            <Button onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            Join <strong>{invitationDetails?.organizationName}</strong> as a{" "}
            <strong>{invitationDetails?.role && roleLabels[invitationDetails.role as keyof typeof roleLabels]}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {invitationDetails && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">{invitationDetails.organizationName}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Invited by {invitationDetails.invitedByName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">{invitationDetails.email}</span>
              </div>
              {invitationDetails.message && (
                <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                  <p className="text-sm text-blue-800 italic">
                    "{invitationDetails.message}"
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a secure password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Invitation
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDecline}
                disabled={isLoading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Decline
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-blue-600 hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
