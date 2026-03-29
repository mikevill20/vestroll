import {
  buildProblemDetails,
  PROBLEM_TYPE_MAP,
  type ProblemDetails,
} from "./problem-details";

// ─── Base error ───────────────────────────────────────────────────────────────

/**
 * Root application error class.
 *
 * Extends the native `Error` with an HTTP status code, optional field-level
 * errors, and – new in this version – an RFC 7807 `type` URI and `title`
 * so every subclass can self-describe its problem category.
 */
export class AppError extends Error {
  /** RFC 7807 `type` URI identifying the problem category. */
  public type: string;
  /** RFC 7807 `title` – short, stable summary of the problem type. */
  public title: string;

  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors: Record<string, unknown> | null = null,
    /** Optional override for the RFC 7807 `type` URI. */
    typeOverride?: string,
    /** Optional override for the RFC 7807 `title`. */
    titleOverride?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    const defaults = PROBLEM_TYPE_MAP[statusCode] ?? {
      type: "about:blank",
      title: "Unknown Error",
    };
    this.type = typeOverride ?? defaults.type;
    this.title = titleOverride ?? defaults.title;
  }

  /**
   * Serialises this error into a fully-populated RFC 7807 {@link ProblemDetails}
   * object ready to be passed to {@link ApiResponse.problemDetails}.
   *
   * @param instance The request path / URI that caused this error.
   */
  toProblemDetails(instance: string = "unknown"): ProblemDetails {
    return buildProblemDetails(
      this.statusCode,
      this.message,
      instance,
      this.errors,
      { type: this.type, title: this.title },
    );
  }
}

// ─── 400 Bad Request ─────────────────────────────────────────────────────────

export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    errors: Record<string, unknown> | null = null,
  ) {
    super(
      message,
      400,
      errors,
      "/problems/validation-error",
      "Validation Error",
    );
  }
}

export class BadRequestError extends AppError {
  constructor(
    message: string = "Bad request",
    errors: Record<string, unknown> | null = null,
  ) {
    super(message, 400, errors);
  }
}

// ─── 401 Unauthorized ────────────────────────────────────────────────────────

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401);
  }
}

export class OAuthError extends AppError {
  constructor(
    message: string = "OAuth authentication failed",
    errors: Record<string, unknown> | null = null,
  ) {
    super(message, 401, errors, "/problems/oauth-error", "OAuth Error");
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = "Token has expired") {
    super(message, 401, null, "/problems/token-expired", "Token Expired");
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = "Invalid token") {
    super(message, 401, null, "/problems/invalid-token", "Invalid Token");
  }
}

export class AudienceMismatchError extends OAuthError {
  constructor(message: string = "Token audience mismatch") {
    super(message);
    this.type = "/problems/audience-mismatch";
    this.title = "Audience Mismatch";
  }
}

export class IssuerMismatchError extends OAuthError {
  constructor(message: string = "Token issuer mismatch") {
    super(message);
    this.type = "/problems/issuer-mismatch";
    this.title = "Issuer Mismatch";
  }
}

// ─── 403 Forbidden ───────────────────────────────────────────────────────────

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403);
  }
}

// ─── 404 Not Found ───────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

// ─── 409 Conflict ────────────────────────────────────────────────────────────

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409);
  }
}

// ─── 429 Too Many Requests ───────────────────────────────────────────────────

export class TooManyRequestsError extends AppError {
  constructor(
    message: string = "Too many requests",
    public retryAfter?: number,
  ) {
    super(message, 429);
  }
}

// ─── 500 Internal Server Error ───────────────────────────────────────────────

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, 500);
  }
}
