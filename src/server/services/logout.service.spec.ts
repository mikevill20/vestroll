import { describe, it, expect, vi, beforeEach } from "vitest";
import { LogoutService } from "./logout.service";
import { JWTTokenService } from "./jwt-token.service";
import { db } from "../db";
import { sessions } from "../db/schema";
import { Logger } from "./logger.service";
vi.mock("../db", () => ({
    db: {
        delete: vi.fn(() => ({
            where: vi.fn(),
        })),
    },
}));

vi.mock("./jwt-token.service", () => ({
    JWTTokenService: {
        verifyToken: vi.fn(),
    },
}));

vi.mock("./logger.service", () => ({
    Logger: {
        info: vi.fn(),
        error: vi.fn(),
    }
}));

describe("LogoutService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should successfully logout with valid token and sessionId", async () => {
        const mockToken = "valid.token.here";
        const mockPayload = { sessionId: "session-123" };
        (JWTTokenService.verifyToken as any).mockResolvedValue(mockPayload);

        const mockWhere = vi.fn();
        (db.delete as any).mockReturnValue({ where: mockWhere });

        await LogoutService.logout(mockToken);

        expect(JWTTokenService.verifyToken).toHaveBeenCalledWith(mockToken);
        expect(db.delete).toHaveBeenCalledWith(sessions);
        expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining("Session invalidated"), expect.any(Object));
    });

    it("should return success (idempotent) if token is missing", async () => {
        await LogoutService.logout(undefined);
        expect(JWTTokenService.verifyToken).not.toHaveBeenCalled();
        expect(db.delete).not.toHaveBeenCalled();
        expect(Logger.info).toHaveBeenCalledWith("No token provided for logout", expect.any(Object));
    });

    it("should return success (idempotent) if token is invalid/expired", async () => {
        const mockToken = "invalid.token";
        (JWTTokenService.verifyToken as any).mockResolvedValue(null);

        await LogoutService.logout(mockToken);

        expect(JWTTokenService.verifyToken).toHaveBeenCalledWith(mockToken);
        expect(db.delete).not.toHaveBeenCalled();
        expect(Logger.info).toHaveBeenCalledWith("Invalid or expired token provided for logout", expect.any(Object));
    });

    it("should do nothing if payload lacks sessionId", async () => {
        const mockToken = "valid.token.no.session";
        (JWTTokenService.verifyToken as any).mockResolvedValue({ userId: "user-1" });

        await LogoutService.logout(mockToken);

        expect(JWTTokenService.verifyToken).toHaveBeenCalled();
        expect(db.delete).not.toHaveBeenCalled();
        expect(Logger.info).toHaveBeenCalledWith("Token missing sessionId, no session invalidated", expect.any(Object));
    });
});
