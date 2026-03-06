import { AppError } from "./errors";

export class InvalidTokenFormatError extends AppError {
    constructor(message: string = "Invalid token format") {
        super(message, 400);
    }
}

export class InvalidTokenSignatureError extends AppError {
    constructor(message: string = "Invalid token signature") {
        super(message, 401);
    }
}

export class ExpiredTokenError extends AppError {
    constructor(message: string = "Token has expired") {
        super(message, 401);
    }
}

export class SessionNotFoundError extends AppError {
    constructor(message: string = "Session not found") {
        super(message, 404);
    }
}

export class TokenSessionMismatchError extends AppError {
    constructor(message: string = "Token session mismatch") {
        super(message, 401);
    }
}

export class InternalAuthError extends AppError {
    constructor(message: string = "Internal authentication error") {
        super(message, 500);
    }
}
