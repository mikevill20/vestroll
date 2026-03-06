import { z } from "zod";

export const GetTimesheetsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform(Number)
    .pipe(z.number().int().positive("Page must be a positive integer")),
  limit: z
    .string()
    .optional()
    .default("12")
    .transform(Number)
    .pipe(z.number().int().min(1).max(100, "Limit must be between 1 and 100")),
  status: z.enum(["Pending", "Approved", "Rejected"]).optional(),
});

export type GetTimesheetsQuery = z.infer<typeof GetTimesheetsQuerySchema>;

export const UpdateTimesheetStatusSchema = z.object({
  status: z.enum(["approved", "rejected"], {
    required_error: "Status is required",
    invalid_type_error: "Status must be 'approved' or 'rejected'",
  }),
});

export type UpdateTimesheetStatusInput = z.infer<
  typeof UpdateTimesheetStatusSchema
>;
