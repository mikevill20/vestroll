import { z } from "zod";

const TimeOffStatusSchema = z
  .enum(["Approved", "Rejected", "approved", "rejected"])
  .transform((value) => value.toLowerCase() as "approved" | "rejected");

export const UpdateTimeOffStatusBodySchema = z.object({
  status: TimeOffStatusSchema,
  reason: z
    .string()
    .trim()
    .max(500, "Reason must be 500 characters or fewer")
    .optional(),
});

export type UpdateTimeOffStatusBody = z.infer<
  typeof UpdateTimeOffStatusBodySchema
>;
export const TimeOffRequestSchema = z.object({
    employeeId: z.string().uuid("Invalid employee ID").optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD"),
    reason: z.string().min(1, "Reason is required").max(500, "Reason too long").optional(),
    leaveType: z.enum(["vacation", "sick", "personal", "other"]).default("vacation"),
});

export type TimeOffRequestInput = z.infer<typeof TimeOffRequestSchema>;
