interface LoginCredentials {
  email: string;
  password: string;
}

interface ResetPasswordData {
  password: string;
  email: string;
  type: "password-reset" | "create";
}

interface ForgotPasswordData {
  email: string;
}
interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
}

interface CompleteRegistrationData {
  firstName: string;
  lastName: string;
  businessEmail: string;
  accountType: string;
  companyName: string;
  companySize: string;
  companyIndustry: string;
  headquarterCountry: string;
  businessDescription: string;
}

export class AuthService {
  static async login(credentials: LoginCredentials) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    return response.json();
  }
  static async register(credentials: RegisterData) {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    return response.json();
  }
  static async forgotPassword(data: ForgotPasswordData) {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send reset link");
    }

    return response.json();
  }

  static async resetPassword(data: ResetPasswordData) {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Password reset failed");
    }

    return response.json();
  }

  static async completeRegistration(data: CompleteRegistrationData) {
    const response = await fetch("/api/auth/complete-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration completion failed");
    }

    return response.json();
  }
}
