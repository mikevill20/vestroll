import { AppError } from "./errors";

export class LogoutError extends AppError {
    constructor(message: string = "Logout failed") {
        super(message, 500);
    }
}

export class InternalLogoutError extends AppError {
    constructor(message: string = "Internal logout error") {
        super(message, 500);
    }
}
