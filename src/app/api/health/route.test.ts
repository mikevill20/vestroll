import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mockBlockchainService = {
  isHealthy: vi.fn(),
  getLedgerHealth: vi.fn(),
};
const mockLogger = {
  error: vi.fn(),
};

vi.mock("@/server/services/blockchain.service", () => ({
  BlockchainService: vi.fn(function MockBlockchainService() {
    return mockBlockchainService;
  }),
}));

vi.mock("@/server/services/logger.service", () => ({
  Logger: mockLogger,
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return healthy status with ledger age", async () => {
    mockBlockchainService.isHealthy.mockResolvedValue(true);
    mockBlockchainService.getLedgerHealth.mockResolvedValue({
      ledger: 1234,
      ledgerAgeSeconds: 12,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("System is healthy");
    expect(data.data.ledger).toBe(1234);
    expect(data.data.ledgerAgeSeconds).toBe(12);
    expect(data.data.status).toBe("healthy");
  });

  it("should return degraded status when ledger age exceeds 60 seconds", async () => {
    mockBlockchainService.isHealthy.mockResolvedValue(true);
    mockBlockchainService.getLedgerHealth.mockResolvedValue({
      ledger: 1234,
      ledgerAgeSeconds: 61,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("System is degraded");
    expect(data.data.status).toBe("degraded");
    expect(data.data.ledgerAgeSeconds).toBe(61);
  });

  it("should return unhealthy when the RPC is unreachable even if ledger data is present", async () => {
    mockBlockchainService.isHealthy.mockResolvedValue(false);
    mockBlockchainService.getLedgerHealth.mockResolvedValue({
      ledger: 1234,
      ledgerAgeSeconds: 12,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("System is unhealthy");
    expect(data.data.status).toBe("unhealthy");
    expect(data.data.ledger).toBe(1234);
    expect(data.data.ledgerAgeSeconds).toBe(12);
  });

  it("should return a 500 response when ledger health lookup fails", async () => {
    mockBlockchainService.isHealthy.mockResolvedValue(true);
    mockBlockchainService.getLedgerHealth.mockRejectedValue(
      new Error("Horizon unavailable"),
    );

    const response = await GET();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Health check failed");
    expect(mockLogger.error).toHaveBeenCalledWith("Health check failed", {
      error: "Error: Horizon unavailable",
    });
  });
});
