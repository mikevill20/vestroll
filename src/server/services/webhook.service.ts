import { Logger } from "./logger.service";

export class WebhookService {
  static async handleWebhook(
    payload: Record<string, unknown>,
    signature: string,
  ) {
    // Mock webhook verification
    if (!signature) {
      throw new Error("Missing signature");
    }

    Logger.info("Webhook received", {
      type: payload.type,
      id: payload.id,
    });

    // Handle different webhook types
    switch (payload.type) {
      case "payout.success":
        Logger.info("Payout successful", { id: payload.id });
        break;
      case "payout.failed":
        Logger.info("Payout failed", { id: payload.id });
        break;
      default:
        Logger.info("Unhandled webhook type", { type: payload.type });
    }

    return { success: true };
  }
}
