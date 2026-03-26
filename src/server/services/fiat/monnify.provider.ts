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

export interface MonnifyConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  contractCode: string;
}

interface MonnifyAuthResponse {
  requestSuccessful: boolean;
  responseBody: {
    accessToken: string;
    expiresIn: number;
  };
}

interface MonnifyVirtualAccountResponse {
  requestSuccessful: boolean;
  responseMessage?: string;
  responseBody: {
    accounts: Array<{
      accountNumber: string;
      accountName: string;
      bankName: string;
      bankCode: string;
    }>;
    accountReference: string;
  };
}

interface MonnifyDisburseResponse {
  requestSuccessful: boolean;
  responseMessage?: string;
  responseBody: {
    amount: number;
    reference: string;
    transactionReference: string;
    status: string;
    totalFee: number;
  };
}

const MONNIFY_STATUS_MAP: Record<string, DisburseResult["status"]> = {
  SUCCESS: "completed",
  PENDING: "pending",
  FAILED: "failed",
  PENDING_AUTHORIZATION: "pending",
};

export class MonnifyProvider implements PaymentProvider {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  private readonly config: MonnifyConfig;

  constructor(config: MonnifyConfig) {
    this.config = config;
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${this.config.apiKey}:${this.config.secretKey}`
    ).toString("base64");

    const response = await fetch(
      `${this.config.baseUrl}/api/v1/auth/login`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data: MonnifyAuthResponse = await response.json();

    if (!response.ok || !data.requestSuccessful) {
      Logger.error("Monnify authentication failed", {
        status: response.status,
      });
      throw new UnauthorizedError("Monnify authentication failed");
    }

    this.accessToken = data.responseBody.accessToken;
    // Expire 60s early to avoid edge-case expiry during a request
    this.tokenExpiresAt =
      Date.now() + (data.responseBody.expiresIn - 60) * 1000;

    return this.accessToken;
  }

  async disburse(request: DisburseRequest): Promise<DisburseResult> {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.config.baseUrl}/api/v1/disbursements/single`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: request.amount,
          reference: request.reference,
          narration: request.narration,
          destinationBankCode: request.destinationBankCode,
          destinationAccountNumber: request.destinationAccountNumber,
          destinationAccountName: request.destinationAccountName,
          currency: request.currency,
          sourceAccountNumber: "",
        }),
      }
    );

    const data: MonnifyDisburseResponse = await response.json();

    if (!response.ok || !data.requestSuccessful) {
      Logger.error("Monnify disbursement failed", {
        reference: request.reference,
        responseMessage: data.responseMessage,
      });
      throw MonnifyProvider.mapError(response.status, data.responseMessage);
    }

    const body = data.responseBody;
    return {
      reference: body.reference,
      providerReference: body.transactionReference,
      status: MONNIFY_STATUS_MAP[body.status] ?? "pending",
      amount: body.amount,
      fee: body.totalFee,
    };
  }

  async generateVirtualAccount(
    request: VirtualAccountRequest
  ): Promise<VirtualAccountResult> {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.config.baseUrl}/api/v1/bank-transfer/reserved-accounts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountReference: request.reference,
          accountName: request.accountName,
          currencyCode: request.currency,
          contractCode: this.config.contractCode,
          customerEmail: request.customerEmail,
          customerName: request.customerName,
        }),
      }
    );

    const data: MonnifyVirtualAccountResponse = await response.json();

    if (!response.ok || !data.requestSuccessful) {
      Logger.error("Monnify virtual account creation failed", {
        reference: request.reference,
        responseMessage: data.responseMessage,
      });
      throw MonnifyProvider.mapError(response.status, data.responseMessage);
    }

    const account = data.responseBody.accounts[0];
    return {
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      bankName: account.bankName,
      bankCode: account.bankCode,
      reference: data.responseBody.accountReference,
    };
  }

  private static mapError(
    httpStatus: number,
    message?: string
  ): AppError {
    const msg = message ?? "Monnify request failed";
    if (httpStatus === 401 || httpStatus === 403) {
      return new UnauthorizedError(msg);
    }
    if (httpStatus >= 400 && httpStatus < 500) {
      return new BadRequestError(msg);
    }
    return new InternalServerError(msg);
  }
}
