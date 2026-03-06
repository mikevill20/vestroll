import { z } from "zod";

export const ListTransactionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  asset: z.string().optional(),
  status: z.enum(["Pending", "Failed", "Successful"]).optional(),
  type: z.string().optional(),
});

export type ListTransactionsInput = z.infer<typeof ListTransactionsSchema>;
