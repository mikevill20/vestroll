import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

describe("GET /api/finance/transactions/[id]", () => {
  it("returns 200 OK for valid transaction IDs and includes auditTrail and blockchainInfo", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/finance/transactions/tx-123",
    );
    const response = await GET(req, {
      params: Promise.resolve({ id: "tx-123" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("tx-123");
    expect(data.auditTrail).toBeDefined();
    expect(data.auditTrail.initiatedBy).toBe("alice@mintforge.com");
    expect(data.blockchainInfo).toBeDefined();
    expect(data.blockchainInfo.explorerUrl).toBe(
      "https://etherscan.io/tx/0x6885afa63b3",
    );
  });

  it("returns 404 Not Found for non-existent IDs", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/finance/transactions/invalid-id",
    );
    const response = await GET(req, {
      params: Promise.resolve({ id: "invalid-id" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Transaction not found");
  });

  it("returns 404 Not Found for transactions belonging to a different organization", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/finance/transactions/other-org-123",
    );
    const response = await GET(req, {
      params: Promise.resolve({ id: "other-org-123" }),
    });

    expect(response.status).toBe(404);
  });

  it("dynamically generates the correct external blockchain explorer link based on the network (Mainnet)", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/finance/transactions/tx-123",
    );
    const response = await GET(req, {
      params: Promise.resolve({ id: "tx-123" }),
    });

    const data = await response.json();
    expect(data.blockchainInfo.explorerUrl).toBe(
      "https://etherscan.io/tx/0x6885afa63b3",
    );
  });

  it("dynamically generates the correct external blockchain explorer link based on the network (Testnet/Polygon)", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/finance/transactions/tx-456",
    );
    const response = await GET(req, {
      params: Promise.resolve({ id: "tx-456" }),
    });

    const data = await response.json();
    expect(data.blockchainInfo.explorerUrl).toBe(
      "https://polygonscan.com/tx/0x1234abc7890",
    );
  });
});
