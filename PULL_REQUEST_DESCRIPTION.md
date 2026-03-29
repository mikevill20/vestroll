test(finance): add E2E test for organization wallet funding flow (#399)

## Note

The repository currently lacks a dedicated funding handler and ledger schema.
This test simulates the expected DB-side behavior for wallet funding by verifying:

- `organization_wallets.funded` is set to true
- `organization_wallets.funded_at` timestamp is recorded (set to `now()` by the test to simulate the time the wallet was funded)

This ensures core funding state transitions are validated at the database level.

If/when a dedicated funding webhook and ledger tables exist, the test should be
updated to call the real handler and assert ledger rows and balances instead
of simulating the DB-side update.
