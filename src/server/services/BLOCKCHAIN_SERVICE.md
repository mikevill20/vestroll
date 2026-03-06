# BlockchainService

A backend service that wraps the **Stellar Horizon API** and **Soroban RPC**, providing reusable helpers for account management, XDR generation, transaction simulation, and submission.

**Location:** `src/api/services/blockchain.service.ts`  
**Tests:** `src/api/services/blockchain.service.spec.ts`  
**Dependency:** `@stellar/stellar-sdk ^14.5.0`

---

## Table of Contents

- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Reference](#api-reference)
  - [Constructor](#constructor)
  - [Account Helpers](#account-helpers)
  - [Keypair Helpers](#keypair-helpers)
  - [XDR Generation Helpers](#xdr-generation-helpers)
  - [Signing](#signing)
  - [Transaction Simulation](#transaction-simulation)
  - [Transaction Submission](#transaction-submission)
  - [Smart-Contract Helpers (Soroban)](#smart-contract-helpers-soroban)
  - [ScVal Conversion Helpers](#scval-conversion-helpers)
  - [Network Info](#network-info)
- [Exported Types](#exported-types)
- [Testing](#testing)

---

## Getting Started

```ts
import { BlockchainService } from "@/server/services/blockchain.service";

const service = new BlockchainService("testnet");

// Check the RPC node is reachable
const healthy = await service.isHealthy(); // true

// Fetch account balances
const balances = await service.getAccountBalances("GABC...");
// [{ asset: "native", balance: "100.0000000", assetType: "native" }, ...]
```

---

## Configuration

### Network Selection

Pass a network name to the constructor: `"testnet"` (default), `"mainnet"`, or `"futurenet"`.

| Network     | RPC URL (default)                        | Horizon URL (default)                        | Friendbot |
| ----------- | ---------------------------------------- | -------------------------------------------- | --------- |
| `testnet`   | `https://soroban-testnet.stellar.org`    | `https://horizon-testnet.stellar.org`        | Yes       |
| `mainnet`   | _none – must set env var_                | `https://horizon.stellar.org`                | No        |
| `futurenet` | `https://rpc-futurenet.stellar.org`      | `https://horizon-futurenet.stellar.org`      | Yes       |

### Environment Variables

| Variable              | Description                                      |
| --------------------- | ------------------------------------------------ |
| `STELLAR_RPC_URL`     | Overrides the default RPC URL for any network    |
| `STELLAR_HORIZON_URL` | Overrides the default Horizon URL for any network |

For **mainnet**, `STELLAR_RPC_URL` is **required** since no free public default is provided.

---

## API Reference

### Constructor

```ts
new BlockchainService(network?: "testnet" | "mainnet" | "futurenet")
```

Creates a service instance connected to the given network. Throws if no RPC URL is available.

---

### Account Helpers

#### `getAccount(publicKey: string)`

Loads a Stellar account from the RPC server. Required internally for building transactions.

```ts
const account = await service.getAccount("GABC...");
```

#### `getAccountBalances(publicKey: string): Promise<AccountBalance[]>`

Fetches all balances (native XLM + trustlines) for an account via the Horizon REST API.

```ts
const balances = await service.getAccountBalances("GABC...");
// [
//   { asset: "native", balance: "95.0000000", assetType: "native" },
//   { asset: "USDC:GBBD47IF...", balance: "50.0000000", assetType: "credit_alphanum4" }
// ]
```

#### `fundTestnetAccount(publicKey: string): Promise<void>`

Funds an account with 10 000 test XLM via Friendbot. Only available on Testnet and Futurenet.

```ts
const { publicKey } = BlockchainService.generateKeypair();
await service.fundTestnetAccount(publicKey);
```

---

### Keypair Helpers

Both are **static** methods — no service instance required.

#### `BlockchainService.generateKeypair()`

Returns a brand-new random keypair.

```ts
const { publicKey, secret } = BlockchainService.generateKeypair();
// publicKey: "GABC..."  (G-address, safe to share)
// secret:   "SABC..."  (S-key, keep private)
```

#### `BlockchainService.keypairFromSecret(secret: string): Keypair`

Restores a full `Keypair` object from a secret key.

```ts
const keypair = BlockchainService.keypairFromSecret("SABC...");
console.log(keypair.publicKey()); // "GABC..."
```

---

### XDR Generation Helpers

These methods build unsigned transaction envelopes and return them as XDR strings. The XDR can be passed to a frontend wallet for signing, stored for deferred execution, or signed server-side with `signTransaction()`.

#### `buildPaymentXdr(params): Promise<TransactionXdr>`

Builds a payment transaction (native XLM or custom asset).

| Parameter        | Type    | Required | Default          |
| ---------------- | ------- | -------- | ---------------- |
| `sourceSecret`   | string  | Yes      | —                |
| `destination`    | string  | Yes      | —                |
| `amount`         | string  | Yes      | —                |
| `asset`          | Asset   | No       | `Asset.native()` |
| `memo`           | string  | No       | —                |

```ts
const { xdr, hash, networkPassphrase } = await service.buildPaymentXdr({
  sourceSecret: "SABC...",
  destination: "GDEF...",
  amount: "10",
});
```

#### `buildTransactionXdr(params): Promise<TransactionXdr>`

Builds an arbitrary transaction from raw `xdr.Operation[]` objects.

| Parameter          | Type             | Required | Default    |
| ------------------ | ---------------- | -------- | ---------- |
| `sourcePublicKey`  | string           | Yes      | —          |
| `operations`       | `xdr.Operation[]`| Yes      | —          |
| `timeboundSeconds` | number           | No       | `180`      |
| `fee`              | string           | No       | `BASE_FEE` |

```ts
import { Operation, Asset } from "@stellar/stellar-sdk";

const op = Operation.payment({
  destination: "GDEF...",
  asset: Asset.native(),
  amount: "5",
});

const { xdr } = await service.buildTransactionXdr({
  sourcePublicKey: "GABC...",
  operations: [op],
  fee: "200",
  timeboundSeconds: 60,
});
```

---

### Signing

#### `signTransaction(xdrEnvelope: string, signerSecret: string): string`

Signs a base-64 XDR envelope with the given secret key and returns the signed XDR.

```ts
const signedXdr = service.signTransaction(unsignedXdr, "SABC...");
```

---

### Transaction Simulation

#### `simulateTransaction(txXdr: string): Promise<SimulationResult>`

Dry-runs a transaction against Soroban RPC **without** submitting it. Returns estimated resource fees and invocation results.

```ts
const sim = await service.simulateTransaction(txXdr);
console.log(sim.minResourceFee); // "100"
console.log(sim.latestLedger);   // 42
```

#### `prepareTransaction(txXdr: string): Promise<string>`

Simulates **and** assembles a Soroban transaction — attaches the correct resource footprint and fees. Returns a ready-to-sign XDR envelope.

```ts
const preparedXdr = await service.prepareTransaction(rawContractCallXdr);
const signedXdr = service.signTransaction(preparedXdr, "SABC...");
const result = await service.submitTransaction(signedXdr);
```

---

### Transaction Submission

#### `submitTransaction(signedXdr: string): Promise<SubmissionResult>`

Sends a **signed** transaction to the RPC and polls until it reaches a final status (success or failure).

```ts
const result = await service.submitTransaction(signedXdr);
// {
//   hash: "abc123...",
//   status: "SUCCESS",
//   ledger: 100,
//   resultXdr: "AAAA..."
// }
```

The method polls up to **15 times** at **1-second intervals** before giving up.

---

### Smart-Contract Helpers (Soroban)

#### `buildContractCallXdr(params): Promise<TransactionXdr>`

Builds an unsigned Soroban contract invocation transaction. Follow up with `prepareTransaction()` → `signTransaction()` → `submitTransaction()`.

| Parameter         | Type          | Required | Default |
| ----------------- | ------------- | -------- | ------- |
| `sourcePublicKey` | string        | Yes      | —       |
| `contractId`      | string        | Yes      | —       |
| `method`          | string        | Yes      | —       |
| `args`            | `xdr.ScVal[]` | No       | `[]`    |

```ts
const { xdr } = await service.buildContractCallXdr({
  sourcePublicKey: "GABC...",
  contractId: "CDLZ...",
  method: "increment",
  args: [BlockchainService.toScVal(1, { type: "u64" })],
});

const prepared = await service.prepareTransaction(xdr);
const signed = service.signTransaction(prepared, "SABC...");
const result = await service.submitTransaction(signed);
```

---

### ScVal Conversion Helpers

All three are **static** methods.

#### `BlockchainService.toScVal(value, opts?): xdr.ScVal`

Converts a JS-native value to a Soroban `ScVal`.

```ts
BlockchainService.toScVal(42, { type: "u64" });
BlockchainService.toScVal("hello", { type: "string" });
BlockchainService.toScVal(true, { type: "bool" });
BlockchainService.toScVal(BigInt(1_000_000), { type: "i128" });
```

#### `BlockchainService.fromScVal(scVal): unknown`

Converts a Soroban `ScVal` back to a JS-native value.

```ts
const value = BlockchainService.fromScVal(scVal); // 42n, "hello", true, etc.
```

#### `BlockchainService.addressToScVal(address): xdr.ScVal`

Converts a Stellar public key (`G...`) or contract ID (`C...`) to an `Address` `ScVal`.

```ts
const addrScVal = BlockchainService.addressToScVal("GABC...");
```

---

### Network Info

#### `getNetwork()`

Returns metadata about the connected network (passphrase, protocol version, friendbot URL).

#### `getLatestLedger()`

Returns the latest ledger sequence number seen by the RPC node.

#### `isHealthy(): Promise<boolean>`

Returns `true` if the RPC node responds with a `"healthy"` status; `false` otherwise (including network errors).

```ts
if (await service.isHealthy()) {
  // safe to proceed
}
```

---

## Exported Types

| Type               | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `AccountBalance`   | `{ asset: string; balance: string; assetType: string }`        |
| `TransactionXdr`   | `{ xdr: string; hash: string; networkPassphrase: string }`     |
| `SimulationResult` | Simulation output including fees, result, events, ledger       |
| `SubmissionResult`  | Final transaction outcome including hash, status, ledger, XDR  |

---

## Testing

Tests are located in `blockchain.service.spec.ts` and use **Vitest** with mocked RPC and Horizon responses (no network calls).

```bash
# Run only blockchain service tests
pnpm test -- src/api/services/blockchain.service.spec.ts

# Run all tests
pnpm test
```

**42 tests** cover all public methods across 17 test suites:

| Suite                    | Tests | Coverage |
| ------------------------ | ----- | -------- |
| constructor              | 4     | Network defaults, env overrides, missing-URL errors |
| generateKeypair          | 2     | Format validation, uniqueness |
| keypairFromSecret        | 2     | Round-trip, invalid input |
| toScVal / fromScVal      | 4     | u64, string, boolean, i128 round-trips |
| addressToScVal           | 2     | Public key, contract ID |
| getAccount               | 2     | Success, error logging |
| getAccountBalances       | 3     | Native + trustline parsing, HTTP errors, network errors |
| fundTestnetAccount       | 3     | Friendbot call, error response, mainnet rejection |
| buildPaymentXdr          | 3     | Native asset, custom asset, memo |
| buildTransactionXdr      | 3     | Single op, multiple ops, custom fee/timeout |
| signTransaction          | 1     | Adds signature, output differs from unsigned |
| simulateTransaction      | 2     | Success result, simulation error |
| prepareTransaction       | 1     | Assembled XDR |
| submitTransaction        | 3     | Success flow, rejected submission, on-chain failure |
| buildContractCallXdr     | 2     | With args, without args |
| getNetwork / getLatestLedger | 2 | Delegation to RPC |
| isHealthy                | 3     | Healthy, unhealthy, unreachable |
