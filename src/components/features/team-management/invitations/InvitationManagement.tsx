import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, UserPlus, RefreshCw } from "lucide-react";
import { InvitationCard } from "./InvitationCard";
import { CreateInvitationForm } from "./CreateInvitationForm";

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

interface InvitationManagementProps {
  invitations: Invitation[];
  isLoading?: boolean;
  onCreateInvitation: (data: any) => Promise<void>;
  onResendInvitation: (invitationId: string) => Promise<void>;
  onDeleteInvitation: (invitationId: string) => Promise<void>;
  onRefresh: () => void;
  error?: string | null;
}

const roleOptions = [
  { value: "", label: "All Roles" },
  { value: "admin", label: "Administrator" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "payroll_manager", label: "Payroll Manager" },
  { value: "employee", label: "Employee" },
];

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
];

export function InvitationManagement({
  invitations,
  isLoading = false,
  onCreateInvitation,
  onResendInvitation,
  onDeleteInvitation,
  onRefresh,
  error,
}: InvitationManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredInvitations = invitations.filter((invitation) => {
    const matchesSearch = invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || invitation.role === roleFilter;
    const matchesStatus = !statusFilter || invitation.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingCount = invitations.filter(i => i.status === "pending").length;
  const acceptedCount = invitations.filter(i => i.status === "accepted").length;
  const expiredCount = invitations.filter(i => i.status === "expired").length;

  const handleCreateInvitation = async (data: any) => {
    await onCreateInvitation(data);
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Invitations</h1>
          <p className="text-muted-foreground">
            Manage invitations to join your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Team Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{acceptedCount}</p>
              </div>
              <Badge variant="default">Accepted</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-gray-600">{expiredCount}</p>
              </div>
              <Badge variant="outline">Expired</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Invitation Form */}
      {showCreateForm && (
        <CreateInvitationForm
          onSubmit={handleCreateInvitation}
          isLoading={isLoading}
          error={error}
        />
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or inviter name..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <div className="space-y-4">
        {filteredInvitations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No invitations found</h3>
              <p className="text-muted-foreground mb-4">
                {invitations.length === 0 
                  ? "Start by inviting team members to join your organization."
                  : "Try adjusting your search or filters."
                }
              </p>
              {invitations.length === 0 && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite First Team Member
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInvitations.map((invitation) => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              onResend={onResendInvitation}
              onDelete={onDeleteInvitation}
              isLoading={isLoading}
            />
          ))
        )}
      </div>
    </div>
  );
}
