import { describe, it, expect, beforeEach, vi } from "vitest";
import { JWTService } from "./jwt.service";
import { InvalidTokenError, TokenExpiredError } from "../utils/errors";

describe("JWTService", () => {
    beforeEach(() => {
        process.env.JWT_ACCESS_SECRET = "test_access_secret_key_for_testing_only";
        process.env.JWT_REFRESH_SECRET = "test_refresh_secret_key_for_testing_only";
        process.env.JWT_ACCESS_EXPIRATION = "15m";
        process.env.JWT_REFRESH_EXPIRATION = "7d";
    });

    describe("generateAccessToken", () => {
        it("should generate a valid access token", () => {
            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            const token = JWTService.generateAccessToken(payload);

            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
            expect(token.split(".").length).toBe(3);
        });

        it("should throw error if JWT_ACCESS_SECRET is not configured", () => {
            delete process.env.JWT_ACCESS_SECRET;

            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            expect(() => JWTService.generateAccessToken(payload)).toThrow(
                "JWT_ACCESS_SECRET is not configured"
            );
        });
    });

    describe("generateRefreshToken", () => {
        it("should generate a valid refresh token", () => {
            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            const token = JWTService.generateRefreshToken(payload);

            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
            expect(token.split(".").length).toBe(3);
        });

        it("should throw error if JWT_REFRESH_SECRET is not configured", () => {
            delete process.env.JWT_REFRESH_SECRET;

            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            expect(() => JWTService.generateRefreshToken(payload)).toThrow(
                "JWT_REFRESH_SECRET is not configured"
            );
        });
    });

    describe("verifyAccessToken", () => {
        it("should verify and decode a valid access token", () => {
            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            const token = JWTService.generateAccessToken(payload);
            const decoded = JWTService.verifyAccessToken(token);

            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.email).toBe(payload.email);
        });

        it("should throw InvalidTokenError for invalid token", () => {
            const invalidToken = "invalid.token.here";

            expect(() => JWTService.verifyAccessToken(invalidToken)).toThrow(
                InvalidTokenError
            );
        });

        it("should throw TokenExpiredError for expired token", () => {
            process.env.JWT_ACCESS_EXPIRATION = "1ms";

            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            const token = JWTService.generateAccessToken(payload);

            setTimeout(() => {
                expect(() => JWTService.verifyAccessToken(token)).toThrow(
                    TokenExpiredError
                );
            }, 10);
        });
    });

    describe("verifyRefreshToken", () => {
        it("should verify and decode a valid refresh token", () => {
            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            const token = JWTService.generateRefreshToken(payload);
            const decoded = JWTService.verifyRefreshToken(token);

            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.email).toBe(payload.email);
        });

        it("should throw InvalidTokenError for invalid token", () => {
            const invalidToken = "invalid.token.here";

            expect(() => JWTService.verifyRefreshToken(invalidToken)).toThrow(
                InvalidTokenError
            );
        });
    });
});
