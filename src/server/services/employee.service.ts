import { db } from "../db";
import { employees, users } from "../db/schema";
import { eq, and, or, ilike, count, SQL } from "drizzle-orm";
import { ForbiddenError } from "../utils/errors";
import { GetEmployeesQuery } from "../validations/employee.schema";

function escapeSearchTerm(term: string): string {
  return term.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export class EmployeeService {
  static async getEmployees(userId: string, query: GetEmployeesQuery) {
    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.organizationId) {
      throw new ForbiddenError("User is not associated with any organization");
    }

    const conditions: SQL[] = [
      eq(employees.organizationId, user.organizationId),
    ];

    if (query.search) {
      const escaped = escapeSearchTerm(query.search);
      const searchTerm = `%${escaped}%`;
      conditions.push(
        or(
          ilike(employees.firstName, searchTerm),
          ilike(employees.lastName, searchTerm),
        )!,
      );
    }

    if (query.status) {
      conditions.push(eq(employees.status, query.status));
    }

    if (query.type) {
      conditions.push(eq(employees.type, query.type));
    }

    const whereClause = and(...conditions);

    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(employees)
      .where(whereClause);

    const offset = (query.page - 1) * query.limit;

    const results = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
        role: employees.role,
        status: employees.status,
        type: employees.type,
        avatarUrl: employees.avatarUrl,
      })
      .from(employees)
      .where(whereClause)
      .orderBy(employees.firstName)
      .limit(query.limit)
      .offset(offset);

    const employeeList = results.map((emp) => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      role: emp.role,
      status: emp.status,
      type: emp.type,
      avatarUrl: emp.avatarUrl,
    }));

    return {
      employees: employeeList,
      totalCount,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(totalCount / query.limit),
    };
  }
}
