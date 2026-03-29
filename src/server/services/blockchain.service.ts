import { db } from "../db";
import {
  Address,
  Asset,
  BASE_FEE,
  Contract,
  FeeBumpTransaction,
  Keypair,
  nativeToScVal,
  Networks,
  Operation,
  scValToNative,
  Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { Api, Server as RpcServer } from "@stellar/stellar-sdk/rpc";
import { Logger } from "./logger.service";
import {
  EnvServiceDiscovery,
  ServiceDiscovery,
} from "@/server/utils/service-discovery";
import { signerAudits } from "@/server/db/schema";
import {
  SimulationFailedError,
  TransactionRejectedError,
  wrapBlockchainError,
} from "@/server/utils/errors/blockchain-error";

export interface GetContractEventsParams {
  contractId?: string;
  topics?: string[][];
  fromLedger?: number;
  limit?: number;
}

export interface ContractEvent {
  id: string;
  ledger: number;
  contractId: string;
  topics: any[];
  value: any;
}

type NetworkName = "testnet" | "mainnet" | "futurenet";

interface NetworkConfig {
  rpcUrl: string;
  horizonUrl: string;
  networkPassphrase: string;
  friendbotUrl?: string;
}

const NETWORK_CONFIGS: Record<NetworkName, NetworkConfig> = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    horizonUrl: "https://horizon-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    friendbotUrl: "https://friendbot.stellar.org",
  },
  mainnet: {
    rpcUrl: "",
    horizonUrl: "https://horizon.stellar.org",
    networkPassphrase: Networks.PUBLIC,
  },
  futurenet: {
    rpcUrl: "https://rpc-futurenet.stellar.org",
    horizonUrl: "https://horizon-futurenet.stellar.org",
    networkPassphrase: Networks.FUTURENET,
    friendbotUrl: "https://friendbot-futurenet.stellar.org",
  },
};

export interface AccountBalance {
  asset: string;
  balance: string;
  assetType: string;
}

export interface TransactionXdr {
  xdr: string;
  hash: string;
  networkPassphrase: string;
}

export interface SimulationResult {
  transactionXdr: string;
  minResourceFee: string;
  result?: Api.SimulateHostFunctionResult;
  events: string[];
  latestLedger: number;
}

export interface SubmissionResult {
  hash: string;
  status: string;
  ledger?: number;
  resultXdr?: string;
}

export interface LedgerHealth {
  ledger: number;
  ledgerAgeSeconds: number;
}

export class BlockchainService {
  private rpcServer: RpcServer;
  private networkConfig: NetworkConfig;

  constructor(
    network: NetworkName = "testnet",
    private readonly serviceDiscovery: ServiceDiscovery = new EnvServiceDiscovery(),
  ) {
    this.networkConfig = {
      ...NETWORK_CONFIGS[network],
      rpcUrl: this.serviceDiscovery.getRpcUrl(NETWORK_CONFIGS[network].rpcUrl),
      horizonUrl: this.serviceDiscovery.getHorizonUrl(
        NETWORK_CONFIGS[network].horizonUrl,
      ),
    };

    if (!this.networkConfig.rpcUrl) {
      throw new Error(
        `No RPC URL configured for network "${network}". Set STELLAR_RPC_URL in your environment.`,
      );
    }

    this.rpcServer = new RpcServer(this.networkConfig.rpcUrl, {
      allowHttp: this.networkConfig.rpcUrl.startsWith("http://"),
    });
  }

  async getAccount(publicKey: string) {
    try {
      return await this.rpcServer.getAccount(publicKey);
    } catch (error) {
      Logger.error("Failed to load account", {
        publicKey,
        error: String(error),
      });
      throw wrapBlockchainError(error);
    }
  }

  async getAccountBalances(publicKey: string): Promise<AccountBalance[]> {
    try {
      const response = await fetch(
        `${this.networkConfig.horizonUrl}/accounts/${publicKey}`,
      );

      if (!response.ok) {
        throw new Error(
          `Horizon returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = (await response.json()) as {
        balances: Array<{
          asset_type: string;
          asset_code?: string;
          asset_issuer?: string;
          balance: string;
        }>;
      };

      return data.balances.map((b) => ({
        asset:
          b.asset_type === "native"
            ? "native"
            : `${b.asset_code}:${b.asset_issuer}`,
        balance: b.balance,
        assetType: b.asset_type,
      }));
    } catch (error) {
      Logger.error("Failed to fetch account balances", {
        publicKey,
        error: String(error),
      });
      throw wrapBlockchainError(error);
    }
  }

  async fundTestnetAccount(publicKey: string): Promise<void> {
    const friendbotUrl = this.networkConfig.friendbotUrl;
    if (!friendbotUrl) {
      throw new Error("Friendbot is not available on this network");
    }

    const response = await fetch(`${friendbotUrl}?addr=${publicKey}`);
    if (!response.ok) {
      throw new Error(
        `Friendbot funding failed: ${response.status} ${response.statusText}`,
      );
    }

    Logger.info("Test account funded via Friendbot", { publicKey });
  }

  static generateKeypair() {
    const keypair = Keypair.random();
    return {
      publicKey: keypair.publicKey(),
      secret: keypair.secret(),
    };
  }

  static keypairFromSecret(secret: string): Keypair {
    return Keypair.fromSecret(secret);
  }

  async buildPaymentXdr(params: {
    sourceSecret: string;
    destination: string;
    amount: string;
    asset?: Asset;
    memo?: string;
  }): Promise<TransactionXdr> {
    const keypair = Keypair.fromSecret(params.sourceSecret);
    const account = await this.getAccount(keypair.publicKey());

    const builder = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkConfig.networkPassphrase,
    });

    builder.addOperation(
      Operation.payment({
        destination: params.destination,
        asset: params.asset ?? Asset.native(),
        amount: params.amount,
      }),
    );

    if (params.memo) {
      const memoByteLength = Buffer.byteLength(params.memo, "utf8");
      if (memoByteLength > 28) {
        throw new Error(
          `Memo text exceeds maximum length of 28 bytes (got ${memoByteLength} bytes). ` +
            `Stellar protocol limits text memos to 28 bytes.`,
        );
      }

      builder.addMemo(
        new (await import("@stellar/stellar-sdk")).Memo("text", params.memo),
      );
    }

    const tx = builder.setTimeout(180).build();

    return {
      xdr: tx.toXDR(),
      hash: tx.hash().toString("hex"),
      networkPassphrase: this.networkConfig.networkPassphrase,
    };
  }

  async buildTransactionXdr(params: {
    sourcePublicKey: string;
    operations: xdr.Operation[];
    timeboundSeconds?: number;
    fee?: string;
  }): Promise<TransactionXdr> {
    const account = await this.getAccount(params.sourcePublicKey);

    const builder = new TransactionBuilder(account, {
      fee: params.fee ?? BASE_FEE,
      networkPassphrase: this.networkConfig.networkPassphrase,
    });

    for (const op of params.operations) {
      builder.addOperation(op);
    }

    const tx = builder.setTimeout(params.timeboundSeconds ?? 180).build();

    return {
      xdr: tx.toXDR(),
      hash: tx.hash().toString("hex"),
      networkPassphrase: this.networkConfig.networkPassphrase,
    };
  }

  private validateNetwork(passphrase?: string): void {
    if (passphrase && passphrase !== this.networkConfig.networkPassphrase) {
      throw new Error(
        `Cross-network transaction detected: envelope is for "${passphrase}" but service is configured for "${this.networkConfig.networkPassphrase}"`,
      );
    }
  }

  signTransaction(input: string | TransactionXdr, signerSecret: string): string {
    const xdrEnvelope = typeof input === "string" ? input : input.xdr;
    this.validateNetwork(typeof input === "string" ? undefined : input.networkPassphrase);

    const tx = TransactionBuilder.fromXDR(
      xdrEnvelope,
      this.networkConfig.networkPassphrase,
    ) as Transaction;
    const keypair = Keypair.fromSecret(signerSecret);
    tx.sign(keypair);

    const hash = tx.hash().toString("hex");
    db.insert(signerAudits)
      .values({
        signerPublicKey: keypair.publicKey(),
        transactionHash: hash,
      })
      .catch((error) => {
        Logger.error("Failed to record signer audit trail", {
          error: String(error),
          transactionHash: hash,
          signerPublicKey: keypair.publicKey(),
        });
      });

    return tx.toXDR();
  }

  async simulateTransaction(input: string | TransactionXdr): Promise<SimulationResult> {
    const txXdr = typeof input === "string" ? input : input.xdr;
    this.validateNetwork(typeof input === "string" ? undefined : input.networkPassphrase);

    const tx = TransactionBuilder.fromXDR(
      txXdr,
      this.networkConfig.networkPassphrase,
    ) as Transaction;

    const simResponse = await this.rpcServer.simulateTransaction(tx);

    if (Api.isSimulationError(simResponse)) {
      Logger.error("Transaction simulation failed", {
        error: simResponse.error,
      });
      throw new SimulationFailedError(
        `Simulation error: ${simResponse.error}`,
        simResponse.error,
      );
    }

    const successResponse =
      simResponse as Api.SimulateTransactionSuccessResponse;

    return {
      transactionXdr: txXdr,
      minResourceFee: successResponse.minResourceFee ?? "0",
      result: successResponse.result,
      events: successResponse.events.map((e: xdr.DiagnosticEvent) =>
        e.toXDR("base64"),
      ),
      latestLedger: successResponse.latestLedger,
    };
  }

  async prepareTransaction(input: string | TransactionXdr): Promise<string> {
    const txXdr = typeof input === "string" ? input : input.xdr;
    this.validateNetwork(typeof input === "string" ? undefined : input.networkPassphrase);

    const tx = TransactionBuilder.fromXDR(
      txXdr,
      this.networkConfig.networkPassphrase,
    ) as Transaction;

    const prepared = await this.rpcServer.prepareTransaction(tx);
    return prepared.toXDR();
  }

  async submitTransaction(input: string | TransactionXdr): Promise<SubmissionResult> {
    const signedXdr = typeof input === "string" ? input : input.xdr;
    this.validateNetwork(typeof input === "string" ? undefined : input.networkPassphrase);

    const tx = TransactionBuilder.fromXDR(
      signedXdr,
      this.networkConfig.networkPassphrase,
    ) as Transaction | FeeBumpTransaction;

    // Extract hash from the XDR to use as the idempotency key
    const hash = tx.hash().toString("hex");

    // ── Idempotency check: return cached result if already submitted ──
    const { TransactionIdempotencyCache } = await import(
      "../utils/transaction-idempotency"
    );
    const cached = await TransactionIdempotencyCache.has(hash);
    if (cached) {
      Logger.info("Duplicate transaction detected — returning cached result", {
        hash,
      });
      return cached;
    }

    const sendResponse = await this.rpcServer.sendTransaction(tx);

    if (sendResponse.status !== "PENDING") {
      Logger.error("Transaction rejected by RPC", {
        status: sendResponse.status,
        hash: sendResponse.hash,
      });
      throw new TransactionRejectedError(
        `Transaction was not accepted: ${JSON.stringify(sendResponse)}`,
        sendResponse.hash,
        sendResponse.status,
      );
    }

    const finalResponse = await this.rpcServer.pollTransaction(
      sendResponse.hash,
      {
        sleepStrategy: () => 1000,
        attempts: 15,
      },
    );

    if (finalResponse.status !== Api.GetTransactionStatus.SUCCESS) {
      Logger.error("Transaction failed on-chain", {
        status: finalResponse.status,
        hash: sendResponse.hash,
      });
      throw new TransactionRejectedError(
        `Transaction failed with status: ${finalResponse.status}`,
        sendResponse.hash,
        finalResponse.status,
      );
    }

    const successResp = finalResponse as Api.GetSuccessfulTransactionResponse;

    const result: SubmissionResult = {
      hash: sendResponse.hash,
      status: finalResponse.status,
      ledger: successResp.ledger,
      resultXdr: successResp.resultXdr?.toXDR("base64"),
    };

    // ── Cache the result to prevent re-submission ──
    await TransactionIdempotencyCache.set(hash, result);

    return result;
  }

  async buildFeeBumpXdr(params: {
    innerTxXdr: string | TransactionXdr;
    feeSourceSecret: string;
    baseFee?: number | string;
  }): Promise<TransactionXdr> {
    const feeSourceKeypair = Keypair.fromSecret(params.feeSourceSecret);
    
    const innerXdr = typeof params.innerTxXdr === "string" ? params.innerTxXdr : params.innerTxXdr.xdr;
    this.validateNetwork(typeof params.innerTxXdr === "string" ? undefined : params.innerTxXdr.networkPassphrase);

    let innerTx: Transaction | FeeBumpTransaction;
    try {
      innerTx = TransactionBuilder.fromXDR(
        innerXdr,
        this.networkConfig.networkPassphrase,
      );
    } catch (error) {
      throw new Error(
        `Invalid inner transaction XDR: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!(innerTx instanceof Transaction)) {
      throw new Error("Inner transaction must be a Transaction instance");
    }

    const feeBump = TransactionBuilder.buildFeeBumpTransaction(
      feeSourceKeypair.publicKey(),
      params.baseFee?.toString() ?? BASE_FEE,
      innerTx,
      this.networkConfig.networkPassphrase,
    );

    return {
      xdr: feeBump.toXDR(),
      hash: feeBump.hash().toString("hex"),
      networkPassphrase: this.networkConfig.networkPassphrase,
    };
  }

  async buildContractCallXdr(params: {
    sourcePublicKey: string;
    contractId: string;
    method: string;
    args?: xdr.ScVal[];
  }): Promise<TransactionXdr> {
    const account = await this.getAccount(params.sourcePublicKey);
    const contract = new Contract(params.contractId);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkConfig.networkPassphrase,
    })
      .addOperation(contract.call(params.method, ...(params.args ?? [])))
      .setTimeout(180)
      .build();

    return {
      xdr: tx.toXDR(),
      hash: tx.hash().toString("hex"),
      networkPassphrase: this.networkConfig.networkPassphrase,
    };
  }

  static toScVal(
    value: unknown,
    opts?: Parameters<typeof nativeToScVal>[1],
  ): xdr.ScVal {
    return nativeToScVal(value, opts);
  }

  static fromScVal(scVal: xdr.ScVal): unknown {
    return scValToNative(scVal);
  }

  static addressToScVal(address: string): xdr.ScVal {
    return new Address(address).toScVal();
  }

  async getNetwork() {
    return this.rpcServer.getNetwork();
  }

  async getLatestLedger() {
    return this.rpcServer.getLatestLedger();
  }

  private async fetchHorizonLedger(params: {
    path: string;
    missingDataMessage: string;
  }): Promise<{
    sequence: number;
    closedAtMs: number;
  }> {
    const response = await fetch(
      `${this.networkConfig.horizonUrl}${params.path}`,
    );

    if (!response.ok) {
      throw new Error(
        `Horizon returned ${response.status}: ${response.statusText}`,
      );
    }

    const data = (await response.json()) as
      | {
          sequence: number | string;
          closed_at: string;
        }
      | {
          _embedded?: {
            records?: Array<{
              sequence: number | string;
              closed_at: string;
            }>;
          };
        };

    const ledgerRecord =
      "_embedded" in data ? data._embedded?.records?.[0] : data;

    if (!ledgerRecord?.closed_at || ledgerRecord.sequence == null) {
      throw new Error(params.missingDataMessage);
    }

    const closedAtMs = Date.parse(ledgerRecord.closed_at);

    if (Number.isNaN(closedAtMs)) {
      throw new Error("Horizon returned an invalid ledger close time");
    }

    return {
      sequence: Number(ledgerRecord.sequence),
      closedAtMs,
    };
  }

  async getLedgerHealth(): Promise<LedgerHealth> {
    const rpcLatestLedger = await this.rpcServer.getLatestLedger();
    const localLedgerSequence = Number(rpcLatestLedger?.sequence);

    if (Number.isNaN(localLedgerSequence)) {
      throw new Error("RPC response missing latest ledger sequence");
    }

    const networkTipLedger = await this.fetchHorizonLedger({
      path: "/ledgers?order=desc&limit=1",
      missingDataMessage: "Horizon response missing latest network ledger data",
    });

    const localLedger =
      networkTipLedger.sequence === localLedgerSequence
        ? networkTipLedger
        : await this.fetchHorizonLedger({
            path: `/ledgers/${localLedgerSequence}`,
            missingDataMessage:
              "Horizon response missing local ledger data",
          });

    return {
      ledger: localLedgerSequence,
      ledgerAgeSeconds: Math.max(
        0,
        Math.floor(
          (networkTipLedger.closedAtMs - localLedger.closedAtMs) / 1000,
        ),
      ),
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.rpcServer.getHealth();
      return health.status === "healthy";
    } catch {
      return false;
    }
  }

  /**
   * Fetches specific diagnostic events from the Stellar RPC.
   *
   * @param params - Filtering parameters for events
   * @returns A promise that resolves to a typed array of ContractEvent
   *
   * @example
   * ```ts
   * const events = await blockchainService.getContractEvents({
   *   contractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
   *   fromLedger: 1000
   * });
   * ```
   */
  async getContractEvents(
    params: GetContractEventsParams,
  ): Promise<ContractEvent[]> {
    try {
      const response = await this.rpcServer.getEvents({
        filters: params.contractId
          ? [
              {
                contractIds: [params.contractId],
                topics: params.topics,
              },
            ]
          : [],
        startLedger: params.fromLedger,
        limit: params.limit,
      });

      return response.events.map((event) => ({
        id: event.id,
        ledger: event.ledger,
        contractId: event.contractId,
        topics: event.topic.map((t) => scValToNative(t)),
        value: scValToNative(event.value),
      }));
    } catch (error) {
      Logger.error("Failed to fetch contract events", {
        params,
        error: String(error),
      });
      throw new Error(
        `Failed to fetch contract events: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
