import { z } from "zod";

export const updateMilestoneStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "approved", "rejected"]),
  reason: z.string().optional(),
}).refine(
  (data) => {
    if (data.status === "rejected" && !data.reason) {
      return false;
    }
    return true;
  },
  {
    message: "Reason is required when status is Rejected",
    path: ["reason"],
  }
);

export type UpdateMilestoneStatusInput = z.infer<typeof updateMilestoneStatusSchema>;
