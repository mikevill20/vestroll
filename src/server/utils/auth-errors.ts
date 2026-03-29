import { AppError } from "./errors";

export class InvalidTokenFormatError extends AppError {
  constructor(message: string = "Invalid token format") {
    super(message, 400, null, "/problems/invalid-token-format", "Invalid Token Format");
  }
}

export class InvalidTokenSignatureError extends AppError {
  constructor(message: string = "Invalid token signature") {
    super(message, 401, null, "/problems/invalid-token-signature", "Invalid Token Signature");
  }
}

export class ExpiredTokenError extends AppError {
  constructor(message: string = "Token has expired") {
    super(message, 401, null, "/problems/token-expired", "Token Expired");
  }
}

export class SessionNotFoundError extends AppError {
  constructor(message: string = "Session not found") {
    super(message, 404, null, "/problems/session-not-found", "Session Not Found");
  }
}

export class TokenSessionMismatchError extends AppError {
  constructor(message: string = "Token session mismatch") {
    super(message, 401, null, "/problems/token-session-mismatch", "Token Session Mismatch");
  }
}

export class InternalAuthError extends AppError {
  constructor(message: string = "Internal authentication error") {
    super(message, 500, null, "/problems/internal-auth-error", "Internal Authentication Error");
  }
}
