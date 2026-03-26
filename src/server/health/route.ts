import { ApiResponse } from "@/server/utils/api-response";
import { pingDb } from "@/server/utils/ping-db";
import { BlockchainService } from "@/server/services/blockchain.service";
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
