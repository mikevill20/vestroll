import { Logger } from "@/server/services/logger.service";
import {
  AppError,
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/server/utils/errors";
import type {
  PaymentProvider,
  DisburseRequest,
  DisburseResult,
  VirtualAccountRequest,
  VirtualAccountResult,
} from "./payment-provider.interface";

export interface FlutterwaveConfig {
  secretKey: string;
  baseUrl: string;
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    throw new BadRequestError(
      `Flutterwave returned an invalid response (HTTP ${res.status})`,
    );
  }
}

export class FlutterwaveProvider implements PaymentProvider {
  private readonly config: FlutterwaveConfig;

  private readonly FLUTTERWAVE_STATUS_MAP: Record<string, DisburseResult["status"]> = {
    NEW: "pending",
    PENDING: "pending",
    SUCCESSFUL: "completed",
    FAILED: "failed",
  };

  constructor(config: FlutterwaveConfig) {
    this.config = config;
  }

  async disburse(request: DisburseRequest): Promise<DisburseResult> {
    const response = await fetch(
      `${this.config.baseUrl}/v3/transfers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_bank: request.destinationBankCode,
          account_number: request.destinationAccountNumber,
          amount: request.amount,
          narration: request.narration,
          currency: request.currency,
          reference: request.reference,
          debit_currency: request.currency,
        }),
      },
    );

    const data = await safeJson(response);

    if (!response.ok || data.status !== "success") {
      Logger.error("Flutterwave disbursement failed", {
        reference: request.reference,
        message: data.message,
      });
      throw FlutterwaveProvider.mapError(response.status, data.message);
    }

    const body = data.data;
    return {
      reference: body.reference,
      providerReference: String(body.id),
      status: this.FLUTTERWAVE_STATUS_MAP[body.status] ?? "pending",
      amount: body.amount,
      fee: body.fee,
    };
  }

  async generateVirtualAccount(
    request: VirtualAccountRequest,
  ): Promise<VirtualAccountResult> {
    throw new Error("Not implemented");
  }

  private static mapError(httpStatus: number, message?: string): AppError {
    const msg = message ?? "Flutterwave request failed";
    if (httpStatus === 401 || httpStatus === 403) {
      return new UnauthorizedError(msg);
    }
    if (httpStatus >= 400 && httpStatus < 500) {
      return new BadRequestError(msg);
    }
    return new InternalServerError(msg);
  }
}
