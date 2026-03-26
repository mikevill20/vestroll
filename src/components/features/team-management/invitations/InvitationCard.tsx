import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Mail, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface InvitationCardProps {
  invitation: Invitation;
  onResend?: (invitationId: string) => void;
  onDelete?: (invitationId: string) => void;
  isLoading?: boolean;
}

const roleLabels = {
  admin: "Administrator",
  hr_manager: "HR Manager",
  payroll_manager: "Payroll Manager",
  employee: "Employee",
};

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-yellow-600",
  },
  accepted: {
    label: "Accepted",
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-green-600",
  },
  declined: {
    label: "Declined",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600",
  },
  expired: {
    label: "Expired",
    variant: "outline" as const,
    icon: AlertCircle,
    color: "text-gray-600",
  },
};

export function InvitationCard({ invitation, onResend, onDelete, isLoading }: InvitationCardProps) {
  const statusInfo = statusConfig[invitation.status];
  const StatusIcon = statusInfo.icon;

  const canResend = invitation.status === "pending" || invitation.status === "expired";
  const canDelete = invitation.status !== "accepted";

  const handleResend = () => {
    if (onResend) {
      onResend(invitation.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(invitation.id);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar 
              src="" 
              fallback="M"
              size="md"
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-medium truncate">
                {invitation.email}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span>{roleLabels[invitation.role as keyof typeof roleLabels]}</span>
                <span>•</span>
                <span>Invited by {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}</span>
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
            
            {(canResend || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isLoading}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canResend && (
                    <DropdownMenuItem onClick={handleResend} disabled={isLoading}>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Invitation
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <>
                      {canResend && <DropdownMenuSeparator />}
                      <DropdownMenuItem onClick={handleDelete} disabled={isLoading} className="text-destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Delete Invitation
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {invitation.message && (
          <div className="mb-3 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground italic">
              "{invitation.message}"
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Sent {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}</span>
            </div>
            
            {invitation.status === "pending" && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Expires {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}</span>
              </div>
            )}
            
            {invitation.acceptedAt && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Accepted {formatDistanceToNow(new Date(invitation.acceptedAt), { addSuffix: true })}</span>
              </div>
            )}
            
            {invitation.declinedAt && (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="h-3 w-3" />
                <span>Declined {formatDistanceToNow(new Date(invitation.declinedAt), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
