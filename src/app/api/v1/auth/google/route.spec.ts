import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { GoogleOAuthService } from "@/server/services/google-oauth.service";
import { OAuthUserProvisioningService } from "@/server/services/oauth-user-provisioning.service";
import { JWTService } from "@/server/services/jwt.service";
import { SessionService } from "@/server/services/session.service";
import {
    InvalidTokenError,
    TokenExpiredError,
    AudienceMismatchError,
} from "@/server/utils/errors";

vi.mock("@/server/services/google-oauth.service");
vi.mock("@/server/services/oauth-user-provisioning.service");
vi.mock("@/server/services/jwt.service");
vi.mock("@/server/services/session.service");

describe("POST /api/v1/auth/google", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should successfully authenticate new user with valid Google token", async () => {
        const mockGoogleUserInfo = {
            email: "newuser@example.com",
            firstName: "New",
            lastName: "User",
            oauthId: "google-123",
        };

        const mockUser = {
            id: "user-123",
            email: "newuser@example.com",
            firstName: "New",
            lastName: "User",
            oauthId: "google-123",
            oauthProvider: "google",
            status: "active",
        };

        (GoogleOAuthService.verifyIdToken as any) = vi
            .fn()
            .mockResolvedValue(mockGoogleUserInfo);
        (OAuthUserProvisioningService.provisionUser as any) = vi
            .fn()
            .mockResolvedValue(mockUser);
        (JWTService.generateAccessToken as any) = vi
            .fn()
            .mockReturnValue("access_token_123");
        (JWTService.generateRefreshToken as any) = vi
            .fn()
            .mockReturnValue("refresh_token_123");
        (SessionService.createSession as any) = vi.fn().mockResolvedValue({
            id: "session-123",
        });

        const request = new NextRequest("http://localhost:3000/api/v1/auth/google", {
            method: "POST",
            body: JSON.stringify({ idToken: "valid_google_token" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.accessToken).toBe("access_token_123");
        expect(data.data.refreshToken).toBe("refresh_token_123");
        expect(data.data.user.email).toBe("newuser@example.com");
        expect(GoogleOAuthService.verifyIdToken).toHaveBeenCalledWith(
            "valid_google_token"
        );
        expect(SessionService.createSession).toHaveBeenCalledWith(
            "user-123",
            "refresh_token_123"
        );
    });

    it("should successfully authenticate existing user", async () => {
        const mockGoogleUserInfo = {
            email: "existing@example.com",
            firstName: "Existing",
            lastName: "User",
            oauthId: "google-456",
        };

        const mockUser = {
            id: "user-456",
            email: "existing@example.com",
            firstName: "Existing",
            lastName: "User",
            oauthId: "google-456",
            oauthProvider: "google",
            status: "active",
        };

        (GoogleOAuthService.verifyIdToken as any) = vi
            .fn()
            .mockResolvedValue(mockGoogleUserInfo);
        (OAuthUserProvisioningService.provisionUser as any) = vi
            .fn()
            .mockResolvedValue(mockUser);
        (JWTService.generateAccessToken as any) = vi
            .fn()
            .mockReturnValue("access_token_456");
        (JWTService.generateRefreshToken as any) = vi
            .fn()
            .mockReturnValue("refresh_token_456");
        (SessionService.createSession as any) = vi.fn().mockResolvedValue({
            id: "session-456",
        });

        const request = new NextRequest("http://localhost:3000/api/v1/auth/google", {
            method: "POST",
            body: JSON.stringify({ idToken: "valid_google_token" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.user.id).toBe("user-456");
    });

    it("should return 400 for missing idToken", async () => {
        const request = new NextRequest("http://localhost:3000/api/v1/auth/google", {
            method: "POST",
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.message).toBe("Validation failed");
    });

    it("should return 400 for invalid idToken format", async () => {
        const request = new NextRequest("http://localhost:3000/api/v1/auth/google", {
            method: "POST",
            body: JSON.stringify({ idToken: "" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
    });

    it("should return 401 for invalid Google token", async () => {
        (GoogleOAuthService.verifyIdToken as any) = vi
            .fn()
            .mockRejectedValue(new InvalidTokenError("Invalid Google token"));

        const request = new NextRequest("http://localhost:3000/api/v1/auth/google", {
            method: "POST",
            body: JSON.stringify({ idToken: "invalid_token" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.message).toBe("Invalid Google token");
    });

    it("should return 401 for expired Google token", async () => {
        (GoogleOAuthService.verifyIdToken as any) = vi
            .fn()
            .mockRejectedValue(new TokenExpiredError("Google token has expired"));

        const request = new NextRequest("http://localhost:3000/api/v1/auth/google", {
            method: "POST",
            body: JSON.stringify({ idToken: "expired_token" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.message).toBe("Google token has expired");
    });

    it("should return 401 for audience mismatch", async () => {
        (GoogleOAuthService.verifyIdToken as any) = vi
            .fn()
            .mockRejectedValue(
                new AudienceMismatchError("Token audience mismatch")
            );

        const request = new NextRequest("http://localhost:3000/api/v1/auth/google", {
            method: "POST",
            body: JSON.stringify({ idToken: "wrong_audience_token" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
    });

    it("should return 500 for internal server errors", async () => {
        (GoogleOAuthService.verifyIdToken as any) = vi
            .fn()
            .mockRejectedValue(new Error("Database connection failed"));

        const request = new NextRequest("http://localhost:3000/api/v1/auth/google", {
            method: "POST",
            body: JSON.stringify({ idToken: "valid_token" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toBe("Internal server error");
    });

    it("should set HTTP-only cookie with refresh token", async () => {
        const mockGoogleUserInfo = {
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            oauthId: "google-789",
        };

        const mockUser = {
            id: "user-789",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            oauthId: "google-789",
            oauthProvider: "google",
            status: "active",
        };

        (GoogleOAuthService.verifyIdToken as any) = vi
            .fn()
            .mockResolvedValue(mockGoogleUserInfo);
        (OAuthUserProvisioningService.provisionUser as any) = vi
            .fn()
            .mockResolvedValue(mockUser);
        (JWTService.generateAccessToken as any) = vi
            .fn()
            .mockReturnValue("access_token_789");
        (JWTService.generateRefreshToken as any) = vi
            .fn()
            .mockReturnValue("refresh_token_789");
        (SessionService.createSession as any) = vi.fn().mockResolvedValue({
            id: "session-789",
        });

        const request = new NextRequest("http://localhost:3000/api/v1/auth/google", {
            method: "POST",
            body: JSON.stringify({ idToken: "valid_google_token" }),
        });

        const response = await POST(request);

        const setCookieHeader = response.headers.get("set-cookie");
        expect(setCookieHeader).toContain("refreshToken=refresh_token_789");
        expect(setCookieHeader).toContain("HttpOnly");
        expect(setCookieHeader).toContain("Path=/");
    });
});


