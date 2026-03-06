import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TokenRefreshService } from "./token-refresh.service";
import { JWTVerificationService } from "./jwt-verification.service";
import { JWTTokenService } from "./jwt-token.service";
import { PasswordVerificationService } from "./password-verification.service";
import {
    ExpiredTokenError,
    SessionNotFoundError,
    TokenSessionMismatchError,
    InternalAuthError
} from "../utils/auth-errors";
const { mockChain, mockDb } = vi.hoisted(() => {
    const chain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn(),
        set: vi.fn().mockReturnThis(),
    };

    const db = {
        select: vi.fn(() => chain),
        update: vi.fn(() => chain),
        delete: vi.fn(() => chain),
    };

    return { mockChain: chain, mockDb: db };
});

vi.mock("../db", () => ({
    db: mockDb,
    sessions: { id: "sessions_table" },
    users: { id: "users_table" },
}));

vi.mock("./jwt-verification.service");
vi.mock("./jwt-token.service");
vi.mock("./password-verification.service");

describe("TokenRefreshService", () => {
    const mockSessionId = "session-123";
    const mockUserId = "user-123";
    const mockRefreshToken = "valid.refresh.token";
    const mockEmail = "test@example.com";

    beforeEach(() => {
        vi.clearAllMocks();
        mockChain.limit.mockReset();
        (JWTVerificationService.verify as any).mockResolvedValue({
            sessionId: mockSessionId,
            exp: Math.floor(Date.now() / 1000) + 3600
        });

        (PasswordVerificationService.verify as any).mockResolvedValue(true);
        (PasswordVerificationService.hash as any).mockResolvedValue("new_hashed_token");
        (JWTTokenService.generateAccessToken as any).mockResolvedValue("new_access_token");
        (JWTTokenService.generateRotatedRefreshToken as any).mockResolvedValue("new_refresh_token");
    });

    it("should successfully refresh tokens", async () => {
        mockChain.limit
            .mockResolvedValueOnce([
                {
                    id: mockSessionId,
                    userId: mockUserId,
                    refreshTokenHash: "hashed_token",
                    expiresAt: new Date(Date.now() + 100000)
                }
            ])
            .mockResolvedValueOnce([
                { id: mockUserId, email: mockEmail }
            ]);

        const result = await TokenRefreshService.refresh(mockRefreshToken);

        expect(result).toEqual({
            accessToken: "new_access_token",
            refreshToken: "new_refresh_token"
        });
        expect(mockDb.update).toHaveBeenCalled();
        expect(mockChain.set).toHaveBeenCalledWith(expect.objectContaining({
            refreshTokenHash: "new_hashed_token"
        }));
    });

    it("should throw SessionNotFoundError if session missing", async () => {
        mockChain.limit.mockResolvedValueOnce([]);

        await expect(TokenRefreshService.refresh(mockRefreshToken)).rejects.toThrow(SessionNotFoundError);
    });

    it("should throw TokenSessionMismatchError if hash invalid (replay attack)", async () => {
        mockChain.limit.mockResolvedValueOnce([
            {
                id: mockSessionId,
                userId: mockUserId,
                refreshTokenHash: "current_hash",
                expiresAt: new Date(Date.now() + 100000)
            }
        ]);
        (PasswordVerificationService.verify as any).mockResolvedValue(false);

        await expect(TokenRefreshService.refresh(mockRefreshToken)).rejects.toThrow(TokenSessionMismatchError);
        expect(mockDb.delete).toHaveBeenCalled();
    });

    it("should throw ExpiredTokenError if session expired", async () => {
        mockChain.limit.mockResolvedValueOnce([
            {
                id: mockSessionId,
                userId: mockUserId,
                refreshTokenHash: "hashed_token",
                expiresAt: new Date(Date.now() - 1000)
            }
        ]);
        (PasswordVerificationService.verify as any).mockResolvedValue(true);

        await expect(TokenRefreshService.refresh(mockRefreshToken)).rejects.toThrow(ExpiredTokenError);
        expect(mockDb.delete).toHaveBeenCalled();
    });
});
