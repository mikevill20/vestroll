import { db } from "@/server/db";
import { milestones } from "@/server/db/schema";
import { ApiResponse } from "@/server/utils/api-response";

/**
 * @swagger
 * /team/milestones:
 *   get:
 *     summary: List milestones
 *     description: Get a list of project milestones including their ID, name, amount, due date, and status
 *     tags: [Payroll]
 *     responses:
 *       200:
 *         description: Milestones retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       milestoneName:
 *                         type: string
 *                       amount:
 *                         type: integer
 *                       dueDate:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [pending, in_progress, completed, approved, rejected]
 *       500:
 *         description: Failed to fetch milestones
 */
export async function GET() {
  try {
    const allMilestones = await db.select({
      id: milestones.id,
      milestoneName: milestones.milestoneName,
      amount: milestones.amount,
      dueDate: milestones.dueDate,
      status: milestones.status,
    }).from(milestones);

    return ApiResponse.success(allMilestones, "Milestones retrieved successfully");
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return ApiResponse.error("Failed to fetch milestones", 500);
  }
}
