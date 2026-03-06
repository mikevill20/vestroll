import { beforeAll, afterAll, beforeEach } from "vitest";
import { loadEnvConfig } from "@next/env";
import path from "path";

// Load test environment variables
loadEnvConfig(path.resolve(process.cwd()));

// Ensure we are in test mode
(process.env as any).NODE_ENV = "test";

beforeAll(async () => {
  // Global setup if needed (e.g., check DB connection)
});

afterAll(async () => {
  // Global teardown if needed
});

beforeEach(async () => {
  // Optional: Reset DB before each test if desired
  // import { resetDatabase } from "./db-utils";
  // await resetDatabase();
});
