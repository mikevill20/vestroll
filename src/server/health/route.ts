import { ApiResponse } from "@/server/utils/api-response";
import { BlockchainService } from "@/server/services/blockchain.service";
import { Logger } from "@/server/services/logger.service";
import { pingDb } from "@/server/utils/ping-db";
import { getServiceDiscovery } from "@/server/utils/service-discovery";

export async function GET() {
  try {
    const blockchainService = new BlockchainService(
      "testnet",
      getServiceDiscovery(),
    );

    const [dbHealthy, rpcHealthy, ledgerHealth] = (await Promise.all([
      pingDb(),
      blockchainService.isHealthy(),
      blockchainService.getLedgerHealth(),
    ]).catch(
      () => [false, false, { ledger: 0, ledgerAgeSeconds: 9999 }] as const,
    )) as [boolean, boolean, { ledger: number; ledgerAgeSeconds: number }];

    const degraded = ledgerHealth.ledgerAgeSeconds > 60;
    const status =
      !dbHealthy || !rpcHealthy
        ? "unhealthy"
        : degraded
          ? "degraded"
          : "healthy";

    const data = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      db: dbHealthy ? "ok" : "error",
      rpc: rpcHealthy ? "ok" : "error",
      ledger: ledgerHealth.ledger,
      ledgerAgeSeconds: ledgerHealth.ledgerAgeSeconds,
      status,
    };

    if (!dbHealthy || !rpcHealthy) {
      return ApiResponse.error("System is unhealthy", 503, data);
    }

    return ApiResponse.success(
      data,
      degraded ? "System is degraded" : "System is healthy",
    );
  } catch (error) {
    Logger.error("Health check failed", { error: String(error) });
    return ApiResponse.error("Health check failed", 500);
  }
}
