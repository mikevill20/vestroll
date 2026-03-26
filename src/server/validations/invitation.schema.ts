import { z } from "zod";

export const invitationRoleEnum = z.enum([
  "admin",
  "hr_manager", 
  "payroll_manager",
  "employee",
]);

export const invitationStatusEnum = z.enum([
  "pending",
  "accepted",
  "declined",
  "expired",
]);

export const createInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: invitationRoleEnum,
  message: z.string().optional(),
});

export const updateInvitationSchema = z.object({
  status: invitationStatusEnum.optional(),
  message: z.string().optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const declineInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
  reason: z.string().optional(),
});

export const resendInvitationSchema = z.object({
  invitationId: z.string().uuid("Invalid invitation ID"),
});

export const listInvitationsSchema = z.object({
  status: invitationStatusEnum.optional(),
  role: invitationRoleEnum.optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const deleteInvitationSchema = z.object({
  invitationId: z.string().uuid("Invalid invitation ID"),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type UpdateInvitationInput = z.infer<typeof updateInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type DeclineInvitationInput = z.infer<typeof declineInvitationSchema>;
export type ResendInvitationInput = z.infer<typeof resendInvitationSchema>;
export type ListInvitationsInput = z.infer<typeof listInvitationsSchema>;
export type DeleteInvitationInput = z.infer<typeof deleteInvitationSchema>;
