import { describe, it, expect } from "vitest";
import {
  PasskeyRegistrationSchema,
  RegisterSchema,
  ResendOTPSchema,
  VerifyEmailSchema,
} from "./auth.schema";

describe("RegisterSchema", () => {
  it("should validate a correct payload", () => {
    const payload = {
      firstName: "John",
      lastName: "Doe",
      businessEmail: "john@example.com",
      password: "Password1",
      agreement: true,
    };
    const result = RegisterSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should fail validation for short names", () => {
    const payload = {
      firstName: "J",
      lastName: "D",
      businessEmail: "john@example.com",
    };
    const result = RegisterSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(
        issues.some(
          (i) => i.message === "First name must be at least 2 characters",
        ),
      ).toBe(true);
      expect(
        issues.some(
          (i) => i.message === "Last name must be at least 2 characters",
        ),
      ).toBe(true);
    }
  });

  it("should fail validation for invalid email", () => {
    const payload = {
      firstName: "John",
      lastName: "Doe",
      businessEmail: "invalid-email",
    };
    const result = RegisterSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});

describe("ResendOTPSchema", () => {
  it("should validate a correct email payload", () => {
    const payload = {
      email: "user@example.com",
    };
    const result = ResendOTPSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("should trim and lowercase email", () => {
    const payload = {
      email: "  USER@EXAMPLE.COM  ",
    };
    const result = ResendOTPSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("should fail validation for invalid email", () => {
    const payload = {
      email: "invalid-email",
    };
    const result = ResendOTPSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should fail validation for missing email", () => {
    const payload = {};
    const result = ResendOTPSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
describe("VerifyEmailSchema", () => {
  it("should validate a correct payload", () => {
    const payload = {
      email: "john@example.com",
      otp: "123456",
    };
    const result = VerifyEmailSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("john@example.com");
      expect(result.data.otp).toBe("123456");
    }
  });

  it("should sanitize email by lowercasing and trimming", () => {
    const payload = {
      email: "  JOHN@EXAMPLE.COM  ",
      otp: "123456",
    };
    const result = VerifyEmailSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("john@example.com");
    }
  });

  it("should fail validation for invalid email format", () => {
    const payload = {
      email: "invalid-email",
      otp: "123456",
    };
    const result = VerifyEmailSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.message === "Invalid email format")).toBe(
        true,
      );
    }
  });

  it("should fail validation for OTP with less than 6 digits", () => {
    const payload = {
      email: "john@example.com",
      otp: "12345",
    };
    const result = VerifyEmailSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(
        issues.some((i) => i.message === "OTP must be exactly 6 digits"),
      ).toBe(true);
    }
  });

  it("should fail validation for OTP with more than 6 digits", () => {
    const payload = {
      email: "john@example.com",
      otp: "1234567",
    };
    const result = VerifyEmailSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(
        issues.some((i) => i.message === "OTP must be exactly 6 digits"),
      ).toBe(true);
    }
  });

  it("should fail validation for OTP with non-digit characters", () => {
    const payload = {
      email: "john@example.com",
      otp: "12345a",
    };
    const result = VerifyEmailSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(
        issues.some((i) => i.message === "OTP must contain only digits"),
      ).toBe(true);
    }
  });

  it("should fail validation for OTP with spaces", () => {
    const payload = {
      email: "john@example.com",
      otp: "123 56",
    };
    const result = VerifyEmailSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should fail validation when email is missing", () => {
    const payload = {
      otp: "123456",
    };
    const result = VerifyEmailSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should fail validation when otp is missing", () => {
    const payload = {
      email: "john@example.com",
    };
    const result = VerifyEmailSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});

describe("PasskeyRegistrationSchema", () => {
  const validPayload = {
    challenge: "YWJjMTIzXy0",
    credentialId: "Y3JlZGVudGlhbC1pZF8t",
    attestationObject: "YXR0ZXN0YXRpb25PYmplY3RfLQ",
    clientDataJSON: "Y2xpZW50RGF0YUpTT05fLQ",
  };

  it("should validate a correct passkey registration payload", () => {
    const result = PasskeyRegistrationSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("should fail validation when required field is missing", () => {
    const { challenge: _challenge, ...payloadWithoutChallenge } = validPayload;
    const result = PasskeyRegistrationSchema.safeParse(payloadWithoutChallenge);
    expect(result.success).toBe(false);
  });

  it("should fail validation for invalid base64url field", () => {
    const payload = {
      ...validPayload,
      challenge: "invalid+/=",
    };
    const result = PasskeyRegistrationSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(
        issues.some(
          (i) => i.message === "Challenge must be a valid base64url string",
        ),
      ).toBe(true);
    }
  });

  it("should fail validation for unknown extra keys", () => {
    const payloadWithExtraKey = {
      ...validPayload,
      extraField: "should-fail",
    };
    const result = PasskeyRegistrationSchema.safeParse(payloadWithExtraKey);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.code === "unrecognized_keys")).toBe(true);
    }
  });
});
