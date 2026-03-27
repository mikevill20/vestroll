import { Logger } from "@/server/services/logger.service";
import {
  AppError,
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/server/utils/errors";
import type {
  PaymentProvider,
  DisburseParams,
  DisburseResult,
  VerifyTransactionResult,
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
    throw new InternalServerError(
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

  async disburse(request: DisburseParams): Promise<DisburseResult> {
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

  async generateVirtualAccount(orgId: string): Promise<VirtualAccountResult>;
  async generateVirtualAccount(
    request: VirtualAccountRequest,
  ): Promise<VirtualAccountResult>;
  async generateVirtualAccount(
    orgIdOrRequest: string | VirtualAccountRequest,
  ): Promise<VirtualAccountResult> {
    const request =
      typeof orgIdOrRequest === "string"
        ? FlutterwaveProvider.buildVirtualAccountRequest(orgIdOrRequest)
        : orgIdOrRequest;
    const response = await fetch(
      `${this.config.baseUrl}/v3/virtual-account-numbers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: request.customerEmail,
          is_permanent: true,
          tx_ref: request.reference,
          amount: 0,
          currency: request.currency,
        }),
      },
    );

    const data = await safeJson(response);

    if (!response.ok || data.status !== "success") {
      Logger.error("Flutterwave virtual account creation failed", {
        reference: request.reference,
        message: data.message,
      });
      throw FlutterwaveProvider.mapError(response.status, data.message);
    }

    return {
      accountNumber: data.data.account_number,
      accountName: request.accountName,
      bankName: data.data.bank_name,
      bankCode: "",
      reference: data.data.order_ref,
    };
  }

  async verifyTransaction(
    reference: string,
  ): Promise<VerifyTransactionResult> {
    const response = await fetch(
      `${this.config.baseUrl}/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await safeJson(response);

    if (!response.ok || data.status !== "success") {
      Logger.error("Flutterwave transaction verification failed", {
        reference,
        message: data.message,
      });
      throw FlutterwaveProvider.mapError(response.status, data.message);
    }

    return {
      reference: data.data.tx_ref ?? reference,
      providerReference: String(data.data.id ?? reference),
      status: FlutterwaveProvider.mapVerificationStatus(data.data.status),
      amount: Number(data.data.amount ?? 0),
      currency: data.data.currency ?? "NGN",
      paidAt: data.data.created_at,
      raw: data.data,
    };
  }

  private static buildVirtualAccountRequest(
    orgId: string,
  ): VirtualAccountRequest {
    return {
      reference: `org-${orgId}`,
      accountName: `Org ${orgId}`,
      customerEmail: `org-${orgId}@vestroll.local`,
      customerName: `Organization ${orgId}`,
      currency: "NGN",
    };
  }

  private static mapVerificationStatus(
    status?: string,
  ): VerifyTransactionResult["status"] {
    if (status === "successful" || status === "SUCCESSFUL") {
      return "successful";
    }
    if (status === "failed" || status === "FAILED") {
      return "failed";
    }
    return "pending";
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
