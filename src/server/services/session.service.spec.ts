import { describe, it, expect, beforeEach, vi } from "vitest";
import { SessionService } from "./session.service";
import { db, sessions } from "../db";
import bcrypt from "bcryptjs";

vi.mock("../db", () => ({
    db: {
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    sessions: {
        id: "id",
        userId: "userId",
        refreshTokenHash: "refreshTokenHash",
        expiresAt: "expiresAt",
    },
}));

vi.mock("bcryptjs");

describe("SessionService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("createSession", () => {
        it("should create a session with hashed refresh token", async () => {
            const mockSession = {
                id: "session-123",
                userId: "user-123",
                refreshTokenHash: "hashed_token",
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                lastUsedAt: new Date(),
            };

            (bcrypt.hash as any) = vi.fn().mockResolvedValue("hashed_token");

            const mockInsert = vi.fn().mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([mockSession]),
                }),
            });

            (db.insert as any) = mockInsert;

            const result = await SessionService.createSession(
                "user-123",
                "refresh_token_123"
            );

            expect(result).toEqual(mockSession);
            expect(bcrypt.hash).toHaveBeenCalledWith("refresh_token_123", 10);
            expect(mockInsert).toHaveBeenCalled();
        });
    });

    describe("validateSession", () => {
        it("should return session when refresh token is valid", async () => {
            const mockSession = {
                id: "session-123",
                userId: "user-123",
                refreshTokenHash: "hashed_token",
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                lastUsedAt: new Date(),
            };

            (bcrypt.compare as any) = vi.fn().mockResolvedValue(true);

            const mockSelect = vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([mockSession]),
                }),
            });

            const mockUpdate = vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined),
                }),
            });

            (db.select as any) = mockSelect;
            (db.update as any) = mockUpdate;

            const result = await SessionService.validateSession(
                "refresh_token_123",
                "user-123"
            );

            expect(result).toEqual(mockSession);
            expect(bcrypt.compare).toHaveBeenCalledWith(
                "refresh_token_123",
                "hashed_token"
            );
            expect(mockUpdate).toHaveBeenCalled();
        });

        it("should return null when refresh token does not match", async () => {
            const mockSession = {
                id: "session-123",
                userId: "user-123",
                refreshTokenHash: "hashed_token",
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            };

            (bcrypt.compare as any) = vi.fn().mockResolvedValue(false);

            const mockSelect = vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([mockSession]),
                }),
            });

            (db.select as any) = mockSelect;

            const result = await SessionService.validateSession(
                "wrong_token",
                "user-123"
            );

            expect(result).toBeNull();
        });

        it("should delete and return null when session is expired", async () => {
            const expiredSession = {
                id: "session-123",
                userId: "user-123",
                refreshTokenHash: "hashed_token",
                expiresAt: new Date(Date.now() - 1000),
            };

            (bcrypt.compare as any) = vi.fn().mockResolvedValue(true);

            const mockSelect = vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([expiredSession]),
                }),
            });

            const mockDelete = vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined),
            });

            (db.select as any) = mockSelect;
            (db.delete as any) = mockDelete;

            const result = await SessionService.validateSession(
                "refresh_token_123",
                "user-123"
            );

            expect(result).toBeNull();
            expect(mockDelete).toHaveBeenCalled();
        });

        it("should return null when no sessions found", async () => {
            const mockSelect = vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([]),
                }),
            });

            (db.select as any) = mockSelect;

            const result = await SessionService.validateSession(
                "refresh_token_123",
                "user-123"
            );

            expect(result).toBeNull();
        });
    });

    describe("deleteSession", () => {
        it("should delete session by id", async () => {
            const mockDelete = vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined),
            });

            (db.delete as any) = mockDelete;

            await SessionService.deleteSession("session-123");

            expect(mockDelete).toHaveBeenCalled();
        });
    });

    describe("cleanupExpiredSessions", () => {
        it("should delete all expired sessions", async () => {
            const mockDelete = vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined),
            });

            (db.delete as any) = mockDelete;

            await SessionService.cleanupExpiredSessions();

            expect(mockDelete).toHaveBeenCalled();
        });
    });
});
