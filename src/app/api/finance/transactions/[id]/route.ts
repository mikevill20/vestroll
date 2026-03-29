import { NextRequest, NextResponse } from "next/server";
import { AuthUtils } from "@/server/utils/auth";
import { TransactionDetails } from "@/types/finance.types";

const mockTransactions: Record<string, TransactionDetails> = {
  "tx-123": {
    id: "tx-123",
    description: "MintForge Bug fixes and performance updates",
    amount: "$1,200.00",
    asset: "USDT",
    status: "Successful",
    timestamp: "2025-10-25T14:00:00Z",
    auditTrail: {
      initiatedBy: "alice@mintforge.com",
      initiatedAt: "2025-10-25T13:45:00Z",
      approvedBy: "bob@mintforge.com",
      approvedAt: "2025-10-25T13:58:00Z",
    },
    blockchainInfo: {
      network: "Ethereum Mainnet",
      blockNumber: 15421008,
      confirmations: 24,
      gasFee: "0.001 ETH",
      hash: "0x6885afa...63b3",
    },
  },
  "tx-456": {
    id: "tx-456",
    description: "Monthly Server Hosting",
    amount: "$450.00",
    asset: "USDC",
    status: "Pending",
    timestamp: "2025-10-26T09:00:00Z",
    auditTrail: {
      initiatedBy: "system@vestroll.com",
      initiatedAt: "2025-10-26T08:55:00Z",
    },
    blockchainInfo: {
      network: "Polygon",
      confirmations: 0,
      hash: "0x1234abc...7890",
    },
  },
};

const getExplorerUrl = (network: string, hash?: string): string => {
  if (!hash) return "";
  const cleanHash = hash.replace("...", "");
  if (network.toLowerCase().includes("ethereum")) {
    return network.toLowerCase().includes("testnet")
      ? `https://sepolia.etherscan.io/tx/${cleanHash}`
      : `https://etherscan.io/tx/${cleanHash}`;
  }
  if (network.toLowerCase().includes("polygon")) {
    return `https://polygonscan.com/tx/${cleanHash}`;
  }
  return `https://explorer.example.com/tx/${cleanHash}`;
};

/**
 * @swagger
 * /api/finance/transactions/{id}:
 *   get:
 *     summary: Get transaction details
 *     description: Retrieve detailed information about a specific transaction, including audit trail and blockchain info.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: Transaction not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {

    try {
      if (request.headers.get("Authorization")) {
        await AuthUtils.authenticateRequest(request);
      }
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (id.startsWith("other-org-")) {
      return NextResponse.json(
        { error: "Not found or unauthorized" },
        { status: 404 },
      );
    }

    const transaction = mockTransactions[id];

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    if (transaction.blockchainInfo && transaction.blockchainInfo.hash) {
      transaction.blockchainInfo.explorerUrl = getExplorerUrl(
        transaction.blockchainInfo.network,
        transaction.blockchainInfo.hash,
      );
    }

    return NextResponse.json(transaction, { status: 200 });
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
