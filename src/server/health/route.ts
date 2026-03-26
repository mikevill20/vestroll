import { ApiResponse } from "@/server/utils/api-response";
import { pingDb } from "@/server/utils/ping-db";
import { BlockchainService } from "@/server/services/blockchain.service";
import { Logger } from "@/server/services/logger.service";

export async function GET() {
  try {
    const blockchainService = new BlockchainService();
    const [rpcHealthy, ledgerHealth] = await Promise.all([
      blockchainService.isHealthy(),
      blockchainService.getLedgerHealth(),
    ]);
    const degraded = ledgerHealth.ledgerAgeSeconds > 60;

    return ApiResponse.success(
      {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        ledger: ledgerHealth.ledger,
        ledgerAgeSeconds: ledgerHealth.ledgerAgeSeconds,
        status: !rpcHealthy ? "unhealthy" : degraded ? "degraded" : "healthy",
      },
      !rpcHealthy
        ? "System is unhealthy"
        : degraded
          ? "System is degraded"
          : "System is healthy",
    );
  } catch (error) {
    Logger.error("Health check failed", { error: String(error) });
    return ApiResponse.error("Health check failed", 500);
  }
import { getServiceDiscovery } from "@/server/utils/service-discovery";

export async function GET() {
  const blockchainService = new BlockchainService("testnet", getServiceDiscovery());

  const [dbHealthy, rpcHealthy] = await Promise.all([
    pingDb(),
    blockchainService.isHealthy(),
  ]).catch(() => [false, false]);

  const data = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    db: dbHealthy ? "ok" : "error",
    rpc: rpcHealthy ? "ok" : "error",
  };

  if (!dbHealthy) {
    return ApiResponse.error("System is unhealthy", 503, {
      status: "unhealthy",
      ...data,
    });
  }

  return ApiResponse.success(data, "System is healthy");
}
