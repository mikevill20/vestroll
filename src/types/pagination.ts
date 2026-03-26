/**
 * Standardized pagination metadata for list endpoints.
 * Provides clients with total counts and navigation metadata.
 */
export interface PaginationMeta {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of records matching the query */
  total: number;
  /** Total number of pages available */
  totalPages: number;
}

/**
 * Generic paginated response type that enforces a consistent shape
 * across all list endpoints in the application.
 *
 * @example
 * ```typescript
 * // GET /api/employees?page=2&limit=10
 * {
 *   data: [...],           // Array of Employee objects
 *   meta: {
 *     page: 2,
 *     limit: 10,
 *     total: 87,
 *     totalPages: 9
 *   }
 * }
 * ```
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
}

/**
 * Helper function to create a paginated response with consistent structure.
 * Use this when converting raw query results to API responses.
 *
 * @param data - Array of items for the current page
 * @param page - Current page number (1-based)
 * @param limit - Items per page
 * @param total - Total number of records matching the query
 * @returns Standardized PaginatedResponse object
 *
 * @example
 * ```typescript
 * const employees = await db.select().from(employeesTable).limit(limit).offset(offset);
 * const totalCount = await db.select({ count: count() }).from(employeesTable);
 *
 * return toPaginatedResponse(employees, page, limit, totalCount);
 * ```
 */
export function toPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
