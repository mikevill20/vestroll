import { z } from "zod";

const normalizeStatus = (status: string): "Approved" | "Rejected" => {
  return status.toLowerCase() === "approved" ? "Approved" : "Rejected";
};

export const UpdateExpenseStatusSchema = z.object({
  status: z
    .string()
    .refine(
      (value) => ["approved", "rejected"].includes(value.toLowerCase()),
      "status must be either Approved or Rejected",
    )
    .transform(normalizeStatus),
  comment: z
    .string()
    .trim()
    .max(1000, "comment cannot exceed 1000 characters")
    .optional(),
});

export type UpdateExpenseStatusInput = z.infer<typeof UpdateExpenseStatusSchema>;
