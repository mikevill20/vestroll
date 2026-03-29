import crypto from "crypto";
import { Logger } from "./logger.service";

export class WebhookService {
  static verifyMonnifySignature(rawBody: string, signature: string) {
    const secret = process.env.MONNIFY_SECRET_KEY as string;

    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    return hash === signature;
  }

  static async logWebhookPayload(provider: string, payload: unknown) {
    // TODO: Replace with DB insert when webhook_audit_logs table is available
    Logger.info("Webhook Audit Log:", {
      provider,
      payload,
      receivedAt: new Date().toISOString() as any,
    });
  }

  static async processSuccessfulDeposit(reference: string, amount: number) {
    // TODO: Replace with real DB logic
    Logger.info("Processing successful deposit:", {
      reference,
      amount: amount as any,
    });

    // Example logic flow:
    // 1. Find fiat transaction by reference
    // 2. Mark transaction as successful
    // 3. Increment organization balance
  }
}
