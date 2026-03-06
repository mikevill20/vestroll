export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors: Record<string, unknown> | null = null,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    errors: Record<string, unknown> | null = null,
  ) {
    super(message, 400, errors);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, 500);
  }
}

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
    super(message, 401, errors);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = "Token has expired") {
    super(message, 401);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = "Invalid token") {
    super(message, 401);
  }
}

export class AudienceMismatchError extends OAuthError {
  constructor(message: string = "Token audience mismatch") {
    super(message);
  }
}

export class IssuerMismatchError extends OAuthError {
  constructor(message: string = "Token issuer mismatch") {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
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

export class TooManyRequestsError extends AppError {
  constructor(
    message: string = "Too many requests",
    public retryAfter?: number,
  ) {
    super(message, 429);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403);
  }
}
