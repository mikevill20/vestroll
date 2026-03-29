import { sql } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { vi } from "vitest";

export async function resetDatabase() {
  const tableNames = Object.values(schema)
    .filter((entity) => (entity as any).tableName)
    .map((entity) => (entity as any).tableName);

  for (const tableName of tableNames) {
    await db.execute(
      sql.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`),
    );
  }
}

/**
 * Builds a stateful in-memory DB mock whose `transaction` executes its
 * callback against the same mock context – no live database required.
 *
 * The returned `mockDb` object is a drop-in replacement for the `db` import
 * inside the modules under test. Wire it up with `vi.mock("../db", ...)` and
 * re-assign the individual method spies via `mockDb.<method>.mockImplementation`
 * before each assertion.
 *
 * Stored rows are accessible on `mockDb._store` for post-call assertions.
 */
export function createTransactionalMockDb() {
  /** Simple keyed row store: tableName -> rows[] */
  const store: Record<string, Record<string, unknown>[]> = {
    users: [],
    organizations: [],
    emailVerifications: [],
  };

  /**
   * Returns a fluent Drizzle-style insert builder that pushes rows into the
   * in-memory store and resolves with those rows on `.returning()`.
   */
  function buildInsert(targetStore: Record<string, unknown>[]) {
    return {
      values: vi.fn((row: Record<string, unknown>) => ({
        returning: vi.fn().mockResolvedValue([{ id: `mock-id-${Date.now()}`, ...row }]),
      })),
    };
  }

  /**
   * Returns a fluent Drizzle-style select builder whose `.limit(1)` resolves
   * with the first matching row from the given `sourceRows` array (or `[]`).
   */
  function buildSelect(sourceRows: Record<string, unknown>[]) {
    const row = sourceRows.length > 0 ? [sourceRows[sourceRows.length - 1]] : [];
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(row),
          }),
          limit: vi.fn().mockResolvedValue(row),
        }),
        limit: vi.fn().mockResolvedValue(row),
      }),
    };
  }

  /**
   * Returns a fluent Drizzle-style update builder whose `.where()` resolves
   * with `undefined` (Drizzle update does not return rows by default).
   */
  function buildUpdate() {
    return {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    };
  }

  const mockDb = {
    _store: store,

    insert: vi.fn((table: { tableName?: string }) => {
      const key =
        table?.tableName === "email_verifications"
          ? "emailVerifications"
          : table?.tableName === "organizations"
          ? "organizations"
          : "users";

      const builder = {
        values: vi.fn((row: Record<string, unknown>) => {
          const persisted = { id: `mock-id-${Date.now()}`, ...row };
          store[key].push(persisted);
          return {
            returning: vi.fn().mockResolvedValue([persisted]),
          };
        }),
      };
      return builder;
    }),

    select: vi.fn(() => buildSelect([])),

    update: vi.fn(() => buildUpdate()),

    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),

    /**
     * Executes the transactional callback immediately with the same mock
     * context, mirroring how Drizzle's `db.transaction` works while keeping
     * all side-effects in the in-memory store.
     */
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      const txContext = {
        insert: vi.fn((table: { tableName?: string }) => {
          const key =
            table?.tableName === "email_verifications"
              ? "emailVerifications"
              : table?.tableName === "organizations"
              ? "organizations"
              : "users";

          return {
            values: vi.fn((row: Record<string, unknown>) => {
              const persisted = { id: `mock-id-${Date.now()}`, ...row };
              store[key].push(persisted);
              return {
                returning: vi.fn().mockResolvedValue([persisted]),
              };
            }),
          };
        }),

        update: vi.fn(() => ({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        })),

        select: vi.fn(() => buildSelect(store.emailVerifications)),
      };

      return callback(txContext);
    }),
  };

  return mockDb;
}
