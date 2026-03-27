export type FiatCurrency = "NGN";

export type DisbursementStatus = "pending" | "completed" | "failed";

export type TransactionVerificationStatus =
  | "pending"
  | "successful"
  | "failed";

/**
 * Shared payout payload accepted by all fiat gateway implementations.
 */
export interface DisburseParams {
  amount: number;
  reference: string;
  narration: string;
  destinationBankCode: string;
  destinationAccountNumber: string;
  destinationAccountName: string;
  currency: FiatCurrency;
}

/**
 * Canonical payout response returned from provider implementations.
 */
export interface DisburseResult {
  reference: string;
  providerReference: string;
  status: DisbursementStatus;
  amount: number;
  fee: number;
}

/**
 * Extra input a provider may use internally when provisioning a virtual account.
 * The cross-provider contract is keyed by orgId, but implementations may support
 * richer local overloads where needed.
 */
export interface VirtualAccountRequest {
  reference: string;
  accountName: string;
  customerEmail: string;
  customerName: string;
  currency: FiatCurrency;
}

export interface VirtualAccountResult {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  reference: string;
}

export interface VerifyTransactionResult {
  reference: string;
  providerReference: string;
  status: TransactionVerificationStatus;
  amount: number;
  currency: FiatCurrency;
  paidAt?: string;
  raw?: unknown;
}

/**
 * Unified provider contract used by the fiat service layer to avoid gateway lock-in.
 */
export interface PaymentProvider {
  /**
   * Send money to a bank account.
   */
  disburse(params: DisburseParams): Promise<DisburseResult>;

  /**
   * Create a virtual account for an organization.
   */
  generateVirtualAccount(orgId: string): Promise<VirtualAccountResult>;

  /**
   * Verify the latest state of a provider transaction by reference.
   */
  verifyTransaction(reference: string): Promise<VerifyTransactionResult>;
}

export type DisburseRequest = DisburseParams;
