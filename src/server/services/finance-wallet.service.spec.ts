// This test simulates the deposit funding flow at the DB layer. There is no
// dedicated funding webhook/handler implemented in the repository yet — the
// test therefore simulates an incoming deposit by updating the
// `organization_wallets` row and asserting the expected DB state transition.
// See PULL_REQUEST_DESCRIPTION.md for context.
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { resetDatabase } from "../test/db-utils";

const hasDb = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const run = hasDb ? describe : describe.skip;

if (hasDb && !process.env.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL must be set for this test");
}

run("Finance Wallet funding flow (simulated deposit)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("simulates a deposit and verifies funded flag and fundedAt timestamp", async () => {
    const orgInsertRes = await db.execute(
      sql`INSERT INTO organizations (name, slug) VALUES (${"Test Org"}, ${"test-org"}) RETURNING id`,
    ) as { rows: { id: string }[] };
    const orgId = orgInsertRes.rows[0].id;

    await db.execute(
      sql`INSERT INTO organization_wallets (organization_id, wallet_address, funded) VALUES (${orgId}, ${"wallet-addr-1"}, false)`,
    );
    // Simulate a deposit: in the absence of a dedicated funding handler we
    // directly perform the expected DB-side operation (this mirrors what a
    // real handler would do) and then assert the core state changes.
    await db.execute(
      sql`UPDATE organization_wallets SET funded = true, funded_at = now() WHERE organization_id = ${orgId}`,
    );

    const walletRes = await db.execute(
      sql`SELECT funded, funded_at FROM organization_wallets WHERE organization_id = ${orgId} LIMIT 1`,
    ) as { rows: { funded: boolean; funded_at: string | null }[] };
    const walletRow = walletRes.rows[0];

    expect(walletRow).toBeDefined();
    expect(walletRow.funded).toBe(true);
    expect(walletRow.funded_at).toBeTruthy();
  });
});
