import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/api/v1/auth";

interface UseAuthReturn {
  login: (email: string, password: string) => Promise<void>;
  register: (
    businessEmail: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    password: string,
    email: string,
    type: "password-reset" | "create",
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = () => setError(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await AuthService.login({ email, password });
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  const register = async (
    businessEmail: string,
    firstName: string,
    lastName: string,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await AuthService.register({ businessEmail, firstName, lastName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await AuthService.forgotPassword({ email });
      router.push(`/reset-password-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset link",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    password: string,
    email: string,
    type: "password-reset" | "create",
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await AuthService.resetPassword({
        password,
        email,
        type,
      });
      return res;
      // Success handled by component
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    forgotPassword,
    resetPassword,
    isLoading,
    error,
    clearError,
  };
};


