import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JWTVerificationService } from "./jwt-verification.service";
import * as jose from "jose";
import { InvalidTokenSignatureError, ExpiredTokenError, InvalidTokenFormatError } from "../utils/auth-errors";

describe("JWTVerificationService", () => {
    let publicKey: string;
    let privateKey: Awaited<ReturnType<typeof jose.generateKeyPair>>["privateKey"];

    beforeEach(async () => {
        const { publicKey: pub, privateKey: priv } = await jose.generateKeyPair("RS256");
        privateKey = priv;
        const spkiPem = await jose.exportSPKI(pub);
        publicKey = spkiPem;

        vi.stubEnv("JWT_PUBLIC_KEY", publicKey);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("should verify a valid token", async () => {
        const token = await new jose.SignJWT({ foo: "bar" })
            .setProtectedHeader({ alg: "RS256" })
            .setExpirationTime("1h")
            .sign(privateKey);

        const payload = await JWTVerificationService.verify(token);
        expect(payload.foo).toBe("bar");
    });

    it("should throw ExpiredTokenError for expired token", async () => {
        const token = await new jose.SignJWT({ foo: "bar" })
            .setProtectedHeader({ alg: "RS256" })
            .setExpirationTime("-1s")
            .sign(privateKey);

        await expect(JWTVerificationService.verify(token)).rejects.toThrow(ExpiredTokenError);
    });

    it("should throw InvalidTokenSignatureError for wrong key", async () => {
        const { privateKey: otherPriv } = await jose.generateKeyPair("RS256");
        const token = await new jose.SignJWT({ foo: "bar" })
            .setProtectedHeader({ alg: "RS256" })
            .setExpirationTime("1h")
            .sign(otherPriv);

        await expect(JWTVerificationService.verify(token)).rejects.toThrow(InvalidTokenSignatureError);
    });

    it("should throw InvalidTokenFormatError for malformed token", async () => {
        await expect(JWTVerificationService.verify("invalid.token.here")).rejects.toThrow(InvalidTokenFormatError);
    });
});
