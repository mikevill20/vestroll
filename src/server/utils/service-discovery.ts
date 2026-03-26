/**
 * ServiceDiscovery provides an abstraction for resolving service URLs (e.g., Stellar RPC, Horizon).
 * This allows for dynamic resolution in development and testing environments.
 */
export interface ServiceDiscovery {
  getRpcUrl(defaultUrl?: string): string;
  getHorizonUrl(defaultUrl?: string): string;
}

/**
 * EnvServiceDiscovery resolves URLs from environment variables.
 * This is the default implementation for production.
 */
export class EnvServiceDiscovery implements ServiceDiscovery {
  getRpcUrl(defaultUrl?: string): string {
    return process.env.STELLAR_RPC_URL || defaultUrl || "";
  }

  getHorizonUrl(defaultUrl?: string): string {
    return process.env.STELLAR_HORIZON_URL || defaultUrl || "";
  }
}

/**
 * MockServiceDiscovery returns configurable static URLs.
 * Useful for local development and unit tests.
 */
export class MockServiceDiscovery implements ServiceDiscovery {
  constructor(
    private readonly rpcUrl: string = "http://localhost:8000/rpc",
    private readonly horizonUrl: string = "http://localhost:8000"
  ) {}

  getRpcUrl(_defaultUrl?: string): string {
    return this.rpcUrl;
  }

  getHorizonUrl(_defaultUrl?: string): string {
    return this.horizonUrl;
  }
}

/**
 * Factory function to get the appropriate ServiceDiscovery instance based on the environment.
 */
export function getServiceDiscovery(): ServiceDiscovery {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return new MockServiceDiscovery();
  }
  return new EnvServiceDiscovery();
}
