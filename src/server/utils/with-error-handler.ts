import { NextRequest, NextResponse } from "next/server";
import { AppError } from "./errors";
import { ApiResponse } from "./api-response";

/**
 * Wraps a Next.js route handler with standard RFC 7807 error handling.
 *
 * Any thrown {@link AppError} (and its subclasses) is converted to a Problem
 * Details response via `error.toProblemDetails(req.nextUrl.pathname)`.
 * Unknown errors fall back to a generic 500 Internal Server Error response.
 *
 * @example
 * ```ts
 * export const GET = withErrorHandler(async (req) => {
 *   const { user } = await AuthUtils.authenticateRequest(req);
 *   const result = await someService.getData();
 *   return ApiResponse.success(result, "Data retrieved");
 * });
 * ```
 */
export function withErrorHandler(
  handler: (req: NextRequest, ctx?: unknown) => Promise<NextResponse>,
): (req: NextRequest, ctx?: unknown) => Promise<NextResponse> {
  return async (req: NextRequest, ctx?: unknown): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      const instance = req?.nextUrl?.pathname ?? "unknown";

      if (error instanceof AppError) {
        return ApiResponse.problemDetails(
          error.toProblemDetails(instance),
        ) as NextResponse;
      }

      console.error(`[Unhandled Error] ${instance}`, error);
      return ApiResponse.error(
        "An unexpected error occurred. Please try again later.",
        500,
        null,
        req,
      ) as NextResponse;
    }
  };
}
