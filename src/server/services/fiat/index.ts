export type {
  PaymentProvider,
  DisburseParams,
  DisburseRequest,
  DisburseResult,
  VirtualAccountRequest,
  VirtualAccountResult,
  VerifyTransactionResult,
} from "./payment-provider.interface";

export { MonnifyProvider } from "./monnify.provider";
export type { MonnifyConfig } from "./monnify.provider";

export { FlutterwaveProvider } from "./flutterwave.provider";
export type { FlutterwaveConfig } from "./flutterwave.provider";

import { MonnifyProvider } from "./monnify.provider";
import { FlutterwaveProvider } from "./flutterwave.provider";

/**
 * Create a MonnifyProvider from environment variables.
 * Throws if any required env var is missing.
 */
export function createMonnifyProvider(): MonnifyProvider {
  const apiKey = process.env.MONNIFY_API_KEY;
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  const baseUrl = process.env.MONNIFY_BASE_URL;
  const contractCode = process.env.MONNIFY_CONTRACT_CODE;

  if (!apiKey || !secretKey || !baseUrl || !contractCode) {
    throw new Error(
      "Missing required Monnify environment variables: MONNIFY_API_KEY, MONNIFY_SECRET_KEY, MONNIFY_BASE_URL, MONNIFY_CONTRACT_CODE"
    );
  }

  return new MonnifyProvider({ apiKey, secretKey, baseUrl, contractCode });
}

/**
 * Create a FlutterwaveProvider from environment variables.
 * Throws if any required env var is missing.
 */
export function createFlutterwaveProvider(): FlutterwaveProvider {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  const baseUrl = process.env.FLUTTERWAVE_BASE_URL;

  if (!secretKey || !baseUrl) {
    throw new Error(
      "Missing required Flutterwave environment variables: FLUTTERWAVE_SECRET_KEY, FLUTTERWAVE_BASE_URL"
    );
  }

  return new FlutterwaveProvider({ secretKey, baseUrl });
}
