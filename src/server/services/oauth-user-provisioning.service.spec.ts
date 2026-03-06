import { describe, it, expect, beforeEach, vi } from "vitest";
import { OAuthUserProvisioningService } from "./oauth-user-provisioning.service";
import { db, users } from "../db";

vi.mock("../db", () => ({
    db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
    },
    users: {
        id: "id",
        email: "email",
        oauthId: "oauthId",
    },
}));

describe("OAuthUserProvisioningService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("provisionUser", () => {
        it("should return existing user when found by oauthId", async () => {
            const mockUser = {
                id: "user-123",
                email: "existing@example.com",
                firstName: "John",
                lastName: "Doe",
                oauthId: "google-123",
                oauthProvider: "google",
                status: "active",
            };

            const mockSelect = vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([mockUser]),
                    }),
                }),
            });

            const mockUpdate = vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined),
                }),
            });

            (db.select as any) = mockSelect;
            (db.update as any) = mockUpdate;

            const googleUserInfo = {
                email: "existing@example.com",
                firstName: "John",
                lastName: "Doe",
                oauthId: "google-123",
            };

            const result = await OAuthUserProvisioningService.provisionUser(
                googleUserInfo
            );

            expect(result).toEqual(mockUser);
            expect(mockUpdate).toHaveBeenCalled();
        });

        it("should update existing user when found by email but no oauthId", async () => {
            const mockUserWithoutOAuth = {
                id: "user-456",
                email: "existing@example.com",
                firstName: "Jane",
                lastName: "Smith",
                oauthId: null,
                oauthProvider: null,
                status: "pending_verification",
            };

            const mockUpdatedUser = {
                ...mockUserWithoutOAuth,
                oauthId: "google-456",
                oauthProvider: "google",
                status: "active",
            };

            let callCount = 0;
            const mockSelect = vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockImplementation(() => {
                            callCount++;
                            if (callCount === 1) {
                                return Promise.resolve([]);
                            }
                            return Promise.resolve([mockUserWithoutOAuth]);
                        }),
                    }),
                }),
            });

            const mockUpdate = vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([mockUpdatedUser]),
                    }),
                }),
            });

            (db.select as any) = mockSelect;
            (db.update as any) = mockUpdate;

            const googleUserInfo = {
                email: "existing@example.com",
                firstName: "Jane",
                lastName: "Smith",
                oauthId: "google-456",
            };

            const result = await OAuthUserProvisioningService.provisionUser(
                googleUserInfo
            );

            expect(result.oauthId).toBe("google-456");
            expect(result.oauthProvider).toBe("google");
            expect(result.status).toBe("active");
        });

        it("should create new user when not found by oauthId or email", async () => {
            const mockNewUser = {
                id: "user-789",
                email: "newuser@example.com",
                firstName: "New",
                lastName: "User",
                oauthId: "google-789",
                oauthProvider: "google",
                status: "active",
                passwordHash: null,
            };

            const mockSelect = vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const mockInsert = vi.fn().mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([mockNewUser]),
                }),
            });

            const mockUpdate = vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined),
                }),
            });

            (db.select as any) = mockSelect;
            (db.insert as any) = mockInsert;
            (db.update as any) = mockUpdate;

            const googleUserInfo = {
                email: "newuser@example.com",
                firstName: "New",
                lastName: "User",
                oauthId: "google-789",
            };

            const result = await OAuthUserProvisioningService.provisionUser(
                googleUserInfo
            );

            expect(result.id).toBe("user-789");
            expect(result.email).toBe("newuser@example.com");
            expect(result.status).toBe("active");
            expect(result.passwordHash).toBeNull();
            expect(mockInsert).toHaveBeenCalled();
        });
    });

    describe("findByOAuthId", () => {
        it("should return user when found", async () => {
            const mockUser = {
                id: "user-123",
                oauthId: "google-123",
            };

            const mockSelect = vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([mockUser]),
                    }),
                }),
            });

            (db.select as any) = mockSelect;

            const result = await OAuthUserProvisioningService.findByOAuthId(
                "google-123"
            );

            expect(result).toEqual(mockUser);
        });

        it("should return null when not found", async () => {
            const mockSelect = vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            (db.select as any) = mockSelect;

            const result = await OAuthUserProvisioningService.findByOAuthId(
                "nonexistent"
            );

            expect(result).toBeNull();
        });
    });

    describe("updateOAuthInfo", () => {
        it("should update user OAuth info and set status to active", async () => {
            const mockUpdatedUser = {
                id: "user-123",
                oauthId: "google-123",
                oauthProvider: "google",
                status: "active",
            };

            const mockUpdate = vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([mockUpdatedUser]),
                    }),
                }),
            });

            (db.update as any) = mockUpdate;

            const result = await OAuthUserProvisioningService.updateOAuthInfo(
                "user-123",
                {
                    oauthProvider: "google",
                    oauthId: "google-123",
                }
            );

            expect(result.status).toBe("active");
            expect(result.oauthProvider).toBe("google");
        });
    });
});
