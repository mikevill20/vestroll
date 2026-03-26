import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError, ValidationError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { EmployeeService } from "@/server/services/employee.service";
import { GetEmployeesQuerySchema } from "@/server/validations/employee.schema";
import { TeamService } from "@/server/services/team.service";

/**
 * @swagger
 * /team/employees:
 *   get:
 *     summary: List employees
 *     description: Get a paginated list of employees for the authenticated user's organization
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Items per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive name search across firstName and lastName
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *         description: Filter by employee status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Freelancer, Contractor]
 *         description: Filter by employee type
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                           status:
 *                             type: string
 *                           type:
 *                             type: string
 *                           avatarUrl:
 *                             type: string
 *                             nullable: true
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User not associated with an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await AuthUtils.authenticateRequest(req);

    const searchParams = req.nextUrl.searchParams;
    const rawQuery = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
    };

    const validatedQuery = GetEmployeesQuerySchema.safeParse(rawQuery);
    if (!validatedQuery.success) {
      throw new ValidationError(
        "Invalid query parameters",
        validatedQuery.error.flatten().fieldErrors as Record<string, unknown>,
      );
    }

    const result = await EmployeeService.getEmployees(
      userId,
      validatedQuery.data,
    );

    return ApiResponse.success(result, "Employees retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Team Employees Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, organizationId } = body;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { message: "Valid email is required" },
                { status: 400 }
            );
        }

        const newUser = await TeamService.addEmployee({ email, organizationId });

        return NextResponse.json(
            {
                id: newUser.id,
                status: newUser.status,
                invitedAt: newUser.invitedAt,
            },
            { status: 201 }
        );
    } catch (error: any) {
        if (error.status === 409) {
            return NextResponse.json(
                { message: error.message },
                { status: 409 }
            );
        }

        console.error("Error adding employee:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
