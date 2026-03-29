import { NextRequest, NextResponse } from "next/server";
import { buildProblemDetails, type ProblemDetails } from "./problem-details";

// ─── Success response shape ───────────────────────────────────────────────────

type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

// ─── ApiResponse class ────────────────────────────────────────────────────────

/**
 * Centralised HTTP response factory.
 *
 * - `success` returns a standard data envelope.
 * - `error`   returns an RFC 7807 Problem Details body
 *              (application/problem+json) for every 4xx / 5xx.
 */
export class ApiResponse {
  // ── Success ──────────────────────────────────────────────────────────────

  static success<T>(
    data: T,
    message: string = "Success",
    status: number = 200,
  ): NextResponse<SuccessResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        message,
        data,
      },
      { status },
    );
  }

  // ── Error (RFC 7807) ─────────────────────────────────────────────────────

  /**
   * Builds an RFC 7807 Problem Details response.
   *
   * @param detail   Human-readable explanation of this specific occurrence.
   * @param status   HTTP status code (default 500).
   * @param errors   Optional field-level error map (e.g. from Zod).
   * @param req      The originating request – used to populate `instance`.
   *                 Falls back to `"unknown"` when omitted.
   */
  static error(
    detail: string = "Internal Server Error",
    status: number = 500,
    errors: Record<string, unknown> | null = null,
    req?: NextRequest,
  ): NextResponse<ProblemDetails> {
    const instance = req?.nextUrl?.pathname ?? "unknown";

    const body = buildProblemDetails(status, detail, instance, errors);

    return NextResponse.json(body, {
      status,
      headers: {
        "Content-Type": "application/problem+json",
      },
    });
  }

  /**
   * Convenience overload accepting a pre-built {@link ProblemDetails} object
   * so callers that have already constructed the full problem can pass it
   * through directly without re-specifying every property.
   */
  static problemDetails(
    problem: ProblemDetails,
  ): NextResponse<ProblemDetails> {
    return NextResponse.json(problem, {
      status: problem.status,
      headers: {
        "Content-Type": "application/problem+json",
      },
    });
  }
}
