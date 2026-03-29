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
        it("should generate a valid access token", async () => {
            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            const token = await JWTService.generateAccessToken(payload);

            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
            expect(token.split(".").length).toBe(3);
        });

        it("should throw error if JWT_ACCESS_SECRET is not configured", async () => {
            delete process.env.JWT_ACCESS_SECRET;

            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            await expect(JWTService.generateAccessToken(payload)).rejects.toThrow(
                "JWT_ACCESS_SECRET is not configured"
            );
        });
    });

    describe("generateRefreshToken", () => {
        it("should generate a valid refresh token", async () => {
            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            const token = await JWTService.generateRefreshToken(payload);

            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
            expect(token.split(".").length).toBe(3);
        });

        it("should throw error if JWT_REFRESH_SECRET is not configured", async () => {
            delete process.env.JWT_REFRESH_SECRET;

            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            await expect(JWTService.generateRefreshToken(payload)).rejects.toThrow(
                "JWT_REFRESH_SECRET is not configured"
            );
        });
    });

    describe("verifyAccessToken", () => {
        it("should verify and decode a valid access token", async () => {
            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            const token = await JWTService.generateAccessToken(payload);
            const decoded = await JWTService.verifyAccessToken(token);

            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.email).toBe(payload.email);
        });

        it("should throw InvalidTokenError for invalid token", async () => {
            const invalidToken = "invalid.token.here";

            await expect(JWTService.verifyAccessToken(invalidToken)).rejects.toThrow(
                InvalidTokenError
            );
        });

        it("should throw TokenExpiredError for expired token", async () => {
            process.env.JWT_ACCESS_EXPIRATION = "1ms";

            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            const token = await JWTService.generateAccessToken(payload);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 50));

            await expect(JWTService.verifyAccessToken(token)).rejects.toThrow(
                TokenExpiredError
            );
        });
    });

    describe("verifyRefreshToken", () => {
        it("should verify and decode a valid refresh token", async () => {
            const payload = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
            };

            const token = await JWTService.generateRefreshToken(payload);
            const decoded = await JWTService.verifyRefreshToken(token);

            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.email).toBe(payload.email);
        });

        it("should throw InvalidTokenError for invalid token", async () => {
            const invalidToken = "invalid.token.here";

            await expect(JWTService.verifyRefreshToken(invalidToken)).rejects.toThrow(
                InvalidTokenError
            );
        });
    });
});
