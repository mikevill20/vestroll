import { describe, it, expect } from "vitest";
import { refreshSchema } from "./auth-refresh.schema";

describe("Refresh Schema Validation", () => {
    it("should validate a correct refresh token", () => {
        const input = { refreshToken: "valid-token-string" };
        const result = refreshSchema.safeParse(input);
        expect(result.success).toBe(true);
    });

    it("should fail if refreshToken is missing", () => {
        const input = {};
        const result = refreshSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBeTruthy();
        }
    });

    it("should fail if refreshToken is empty", () => {
        const input = { refreshToken: "" };
        const result = refreshSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe("Refresh token cannot be empty");
        }
    });

    it("should fail if refreshToken is not a string", () => {
        const input = { refreshToken: 123 };
        const result = refreshSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBeTruthy();
        }
    });
});
