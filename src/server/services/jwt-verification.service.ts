import * as jose from "jose";
import {
    InvalidTokenSignatureError,
    ExpiredTokenError,
    InvalidTokenFormatError,
    InternalAuthError
} from "../utils/auth-errors";

export class JWTVerificationService {
    private static async getPublicKey() {
        const key = process.env.JWT_PUBLIC_KEY;
        if (!key) {
            throw new InternalAuthError("JWT Public Key not configured for RS256 verification");
        }
        try {
            return await jose.importSPKI(key, "RS256");
        } catch (error) {
            throw new InternalAuthError("Failed to import public key");
        }
    }

    static async verify(token: string): Promise<jose.JWTPayload> {
        if (!token) {
            throw new InvalidTokenFormatError("Token is missing");
        }

        const key = await this.getPublicKey();

        try {
            const { payload } = await jose.jwtVerify(token, key, {
                algorithms: ["RS256"],
            });

            if (!payload) {
                throw new InvalidTokenFormatError("Token payload is empty");
            }

            return payload;
        } catch (error: unknown) {
            const err = error as { code?: string };
            if (err?.code === "ERR_JWT_EXPIRED") {
                throw new ExpiredTokenError();
            }
            if (err?.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
                throw new InvalidTokenSignatureError();
            }
            if (err?.code === "ERR_JWS_INVALID") {
                throw new InvalidTokenFormatError();
            }
            throw new InvalidTokenFormatError((error as Error).message || "Invalid token");
        }
    }
}

