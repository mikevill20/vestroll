import {
  Keypair,
  Networks,
  TransactionBuilder,
  Transaction,
  FeeBumpTransaction,
  Operation,
  Asset,
  Contract,
  BASE_FEE,
  xdr,
  nativeToScVal,
  scValToNative,
  Address,
} from "@stellar/stellar-sdk";
import { Server as RpcServer, Api } from "@stellar/stellar-sdk/rpc";
import { Logger } from "./logger.service";
import { ServiceDiscovery, EnvServiceDiscovery } from "@/server/utils/service-discovery";

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
      rpcUrl: this.serviceDiscovery.getRpcUrl(
        NETWORK_CONFIGS[network].rpcUrl,
      ),
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
      throw error;
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
      throw error;
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
      builder.addMemo(
        new (await import("@stellar/stellar-sdk")).Memo(
          "text",
          params.memo,
        ),
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

    const tx = builder
      .setTimeout(params.timeboundSeconds ?? 180)
      .build();

    return {
      xdr: tx.toXDR(),
      hash: tx.hash().toString("hex"),
      networkPassphrase: this.networkConfig.networkPassphrase,
    };
  }

  signTransaction(
    xdrEnvelope: string,
    signerSecret: string,
  ): string {
    const tx = TransactionBuilder.fromXDR(
      xdrEnvelope,
      this.networkConfig.networkPassphrase,
    );
    const keypair = Keypair.fromSecret(signerSecret);
    tx.sign(keypair);
    return tx.toXDR();
  }

  async simulateTransaction(
    txXdr: string,
  ): Promise<SimulationResult> {
    const tx = TransactionBuilder.fromXDR(
      txXdr,
      this.networkConfig.networkPassphrase,
    ) as Transaction;

    const simResponse = await this.rpcServer.simulateTransaction(tx);

    if (Api.isSimulationError(simResponse)) {
      Logger.error("Transaction simulation failed", {
        error: simResponse.error,
      });
      throw new Error(`Simulation error: ${simResponse.error}`);
    }

    const successResponse =
      simResponse as Api.SimulateTransactionSuccessResponse;

    return {
      transactionXdr: txXdr,
      minResourceFee: successResponse.minResourceFee ?? "0",
      result: successResponse.result,
      events: successResponse.events.map((e: xdr.DiagnosticEvent) => e.toXDR("base64")),
      latestLedger: successResponse.latestLedger,
    };
  }

  async prepareTransaction(txXdr: string): Promise<string> {
    const tx = TransactionBuilder.fromXDR(
      txXdr,
      this.networkConfig.networkPassphrase,
    ) as Transaction;

    const prepared = await this.rpcServer.prepareTransaction(tx);
    return prepared.toXDR();
  }

  async submitTransaction(
    signedXdr: string,
  ): Promise<SubmissionResult> {
    const tx = TransactionBuilder.fromXDR(
      signedXdr,
      this.networkConfig.networkPassphrase,
    ) as Transaction | FeeBumpTransaction;

    const sendResponse = await this.rpcServer.sendTransaction(tx);

    if (sendResponse.status !== "PENDING") {
      Logger.error("Transaction rejected by RPC", {
        status: sendResponse.status,
        hash: sendResponse.hash,
      });
      throw new Error(
        `Transaction was not accepted: ${JSON.stringify(sendResponse)}`,
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
      throw new Error(
        `Transaction failed with status: ${finalResponse.status}`,
      );
    }

    const successResp =
      finalResponse as Api.GetSuccessfulTransactionResponse;

    return {
      hash: sendResponse.hash,
      status: finalResponse.status,
      ledger: successResp.ledger,
      resultXdr: successResp.resultXdr?.toXDR("base64"),
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

  async getLedgerHealth(): Promise<LedgerHealth> {
    const response = await fetch(
      `${this.networkConfig.horizonUrl}/ledgers?order=desc&limit=1`,
    );

    if (!response.ok) {
      throw new Error(
        `Horizon returned ${response.status}: ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      _embedded?: {
        records?: Array<{
          sequence: number | string;
          closed_at: string;
        }>;
      };
    };

    const latestLedger = data._embedded?.records?.[0];

    if (!latestLedger?.closed_at || latestLedger.sequence == null) {
      throw new Error("Horizon response missing latest ledger data");
    }

    const closedAtMs = Date.parse(latestLedger.closed_at);

    if (Number.isNaN(closedAtMs)) {
      throw new Error("Horizon returned an invalid ledger close time");
    }

    return {
      ledger: Number(latestLedger.sequence),
      ledgerAgeSeconds: Math.max(
        0,
        Math.floor((Date.now() - closedAtMs) / 1000),
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
}
