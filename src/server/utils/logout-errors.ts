import { AppError } from "./errors";

export class LogoutError extends AppError {
  constructor(message: string = "Logout failed") {
    super(message, 500, null, "/problems/logout-error", "Logout Error");
  }
}

export class InternalLogoutError extends AppError {
  constructor(message: string = "Internal logout error") {
    super(message, 500, null, "/problems/internal-logout-error", "Internal Logout Error");
  }
}
