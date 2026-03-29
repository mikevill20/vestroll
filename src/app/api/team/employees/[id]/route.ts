import { NextRequest } from "next/server";
import { db, employees, contracts, timesheets } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { ApiResponse } from "@/server/utils/api-response";
import { z } from "zod";
import { AuthUtils } from "@/server/utils/auth";

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * @swagger
 * /api/team/employees/{id}:
 *   get:
 *     summary: Get single employee profile
 *     description: Retrieve a comprehensive profile for a specific team member, including contract details and payment history (derived from timesheets). Verifies the employee belongs to the requester's organization.
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee profile
 *       404:
 *         description: Not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const idSchema = z.string().regex(UUID_REGEX, { message: "Invalid UUID" });
    const { id } = await params;
    if (!idSchema.safeParse(id).success) {
      return ApiResponse.error("Invalid employee ID", 400);
    }

    let requesterOrgId: string | undefined;
    try {
      const { user } = await AuthUtils.authenticateRequest(request);
      requesterOrgId = user.organizationId ?? undefined;
    } catch {
      return ApiResponse.error("Unauthorized", 401);
    }
    if (!requesterOrgId) {
      return ApiResponse.error("Unauthorized", 401);
    }

    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);
    if (!employee) {
      return ApiResponse.error("Employee not found", 404);
    }
    if (
      !employee.organizationId ||
      employee.organizationId !== requesterOrgId
    ) {
      return ApiResponse.error("Employee not found", 404);
    }

    const [activeContracts, paymentHistory] = await Promise.all([
      db
        .select()
        .from(contracts)
        .where(
          and(eq(contracts.employeeId, id), eq(contracts.status, "active")),
        )
        .limit(1),
      db.select().from(timesheets).where(eq(timesheets.employeeId, id)),
    ]);

    const contract = activeContracts[0];
    const paymentDetails = {
      contract: contract
        ? {
            contractId: contract.id,
            startDate: contract.startDate,
            endDate: contract.endDate,
            amount: contract.amount,
            paymentType: contract.paymentType,
            contractType: contract.contractType,
            status: contract.status,
          }
        : null,
      history: paymentHistory.map((p: any) => ({
        date: p.submittedAt,
        amount: p.totalAmount,
        rate: p.rate,
      })),
    };

    const profile = {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      type: employee.type,

      dateJoined: employee.createdAt,
      paymentDetails,
    };

    return ApiResponse.success(profile, "Employee profile fetched");
  } catch (error) {
    console.error("[Employee Profile Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
