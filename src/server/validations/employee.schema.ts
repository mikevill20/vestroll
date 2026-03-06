import { z } from "zod";

export const GetEmployeesQuerySchema = z.object({
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
  search: z.string().optional().default(""),
  status: z.enum(["Active", "Inactive"]).optional(),
  type: z.enum(["Freelancer", "Contractor"]).optional(),
});

export type GetEmployeesQuery = z.infer<typeof GetEmployeesQuerySchema>;
