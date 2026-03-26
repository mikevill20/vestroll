import { BadRequestError } from "@/server/utils/errors";

interface ProviderConfig {
  resolveAccount: (
    accountNumber: string,
    bankCode: string,
    secretKey: string,
  ) => Promise<{ accountName: string }>;
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    throw new BadRequestError(
      `Provider returned an invalid response (HTTP ${res.status})`,
    );
  }
}

const providers: Record<string, ProviderConfig> = {
  paystack: {
    async resolveAccount(accountNumber, bankCode, secretKey) {
      const url = new URL("https://api.paystack.co/bank/resolve");
      url.searchParams.set("account_number", accountNumber);
      url.searchParams.set("bank_code", bankCode);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${secretKey}` },
      });

      const json = await safeJson(res);

      if (!res.ok || json.status === false) {
        throw new BadRequestError(
          json.message || "Could not verify account",
        );
      }

      return { accountName: json.data.account_name };
    },
  },

  flutterwave: {
    async resolveAccount(accountNumber, bankCode, secretKey) {
      const res = await fetch("https://api.flutterwave.com/v3/accounts/resolve", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: accountNumber,
          account_bank: bankCode,
        }),
      });

      const json = await safeJson(res);

      if (!res.ok || json.status !== "success") {
        throw new BadRequestError(
          json.message || "Could not verify account",
        );
      }

      return { accountName: json.data.account_name };
    },
  },
};

function getSecretKey(providerId: string): string {
  const envMap: Record<string, string | undefined> = {
    paystack: process.env.PAYSTACK_SECRET_KEY,
    flutterwave: process.env.FLUTTERWAVE_SECRET_KEY,
  };

  const key = envMap[providerId];
  if (!key) {
    throw new BadRequestError(`Missing secret key for provider: ${providerId}`);
  }
  return key;
}

export class BankVerificationService {
  static async verifyAccount(
    accountNumber: string,
    bankCode: string,
    providerId: string,
  ): Promise<{ accountName: string }> {
    const provider = providers[providerId];
    if (!provider) {
      throw new BadRequestError(
        `Unsupported provider: ${providerId}. Supported: ${Object.keys(providers).join(", ")}`,
      );
    }

    const secretKey = getSecretKey(providerId);
    return provider.resolveAccount(accountNumber, bankCode, secretKey);
  }
}
