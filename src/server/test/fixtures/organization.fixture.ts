import { faker } from "@faker-js/faker";
import { db, organizations, organizationWallets } from "../../db";

type CreateOrgOpts = {
  withWallet?: boolean;
  teams?: number;
  rolesPerTeam?: number;
  overrides?: {
    organization?: Partial<typeof organizations.$inferInsert>;
    teams?: Partial<any>[];
    roles?: Partial<any>[];
    wallet?: Partial<typeof organizationWallets.$inferInsert>;
  };
  fakerSeed?: number;
};

type TeamWithRoles = any; // repository does not define `teams`/`roles` tables here

type CreateOrgResult = {
  organization: typeof organizations.$inferSelect;
  wallet?: typeof organizationWallets.$inferSelect;
  teams: TeamWithRoles[];
};

export const isDbAvailable = () => !!process.env.DATABASE_URL;

/**
 * createTestOrganization
 * - Creates an `organizations` row and optionally an `organization_wallets` row.
 * - Runs inside a single DB transaction.
 * - Fails fast if the DB is not available or on SQL errors (no retries).
 *
 * NOTE: This fixture intentionally does not create `teams` / `roles` —
 * this codebase does not currently define those tables in the schema. If
 * your project adds `teams`/`roles`, extend this file accordingly.
 */
export async function createTestOrganization(
  opts: CreateOrgOpts = {},
): Promise<CreateOrgResult> {
  if (!isDbAvailable()) {
    throw new Error(
      "Database unavailable: set DATABASE_URL (or use describe.skip when running in CI).",
    );
  }

  const {
    withWallet = false,
    teams: teamCount = 0,
    rolesPerTeam = 0,
    overrides = {},
    fakerSeed,
  } = opts;

  if (fakerSeed !== undefined) {
    faker.seed(fakerSeed);
  }

  try {
    return await db.transaction(async (tx) => {
      const orgName = faker.company.name();

      const [organization] = await tx
        .insert(organizations)
        .values({
          name: orgName,
          slug: faker.helpers.slugify(orgName).toLowerCase(),
          ...overrides.organization,
        })
        .returning();

      let wallet: typeof organizationWallets.$inferSelect | undefined;

      if (withWallet) {
        const [createdWallet] = await tx
          .insert(organizationWallets)
          .values({
            organizationId: organization.id,
            walletAddress: overrides.wallet?.walletAddress ?? `wallet-${faker.string.alphanumeric(10)}`,
            funded: overrides.wallet?.funded ?? false,
            ...overrides.wallet,
          })
          .returning();

        wallet = createdWallet;
      }

      if (teamCount > 0 || rolesPerTeam > 0) {
        throw new Error(
          "teams/roles creation requested but this repository schema does not define `teams`/`roles`. Extend the fixture when those tables exist.",
        );
      }

      return {
        organization,
        wallet,
        teams: [],
      };
    });
  } catch (err: any) {
    const message = [
      "Failed to create test organization fixture.",
      `Options: ${JSON.stringify(opts)}`,
      `Error: ${err?.message}`,
      "Hint: Ensure migrations are up-to-date and DATABASE_URL is correct.",
    ].join("\n");

    throw new Error(message);
  }
}

/**
 * Example usage (in a test file):
 *
 * const run = isDbAvailable() ? describe : describe.skip;
 * run('org fixture', () => {
 *   it('creates org + wallet', async () => {
 *     const { organization, wallet } = await createTestOrganization({ withWallet: true, fakerSeed: 42 });
 *     expect(organization).toBeDefined();
 *     expect(wallet).toBeDefined();
 *   });
 * });
 */
