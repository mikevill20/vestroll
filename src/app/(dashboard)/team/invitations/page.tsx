"use client";

import React, { useState, useEffect } from "react";
import { InvitationManagement } from "@/components/features/team-management/invitations/InvitationManagement";
import { createInvitationSchema } from "@/server/validations/invitation.schema";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "declined" | "expired";
  message: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
  organization: {
    id: string;
    name: string;
  };
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface InvitationsResponse {
  invitations: Invitation[];
  total: number;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/invitations");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch invitations");
      }

      const data: InvitationsResponse = await response.json();
      setInvitations(data.invitations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvitation = async (data: any) => {
    setError(null);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create invitation");
      }

      // Refresh invitations list
      await fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invitation");
      throw err;
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setError(null);

    try {
      const response = await fetch("/api/invitations/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invitationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to resend invitation");
      }

      // Refresh invitations list
      await fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invitation");
      throw err;
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    setError(null);

    try {
      const response = await fetch("/api/invitations/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invitationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete invitation");
      }

      // Refresh invitations list
      await fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete invitation");
      throw err;
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  return (
    <div className="container mx-auto py-6">
      <InvitationManagement
        invitations={invitations}
        isLoading={isLoading}
        onCreateInvitation={handleCreateInvitation}
        onResendInvitation={handleResendInvitation}
        onDeleteInvitation={handleDeleteInvitation}
        onRefresh={fetchInvitations}
        error={error}
      />
    </div>
  );
}
