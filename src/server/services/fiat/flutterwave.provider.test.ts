import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FlutterwaveProvider } from "./flutterwave.provider";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("FlutterwaveProvider", () => {
  let provider: FlutterwaveProvider;

  beforeEach(() => {
    provider = new FlutterwaveProvider({
      secretKey: "test-secret-key",
      baseUrl: "https://api.flutterwave.com",
    });
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("can be instantiated with config", () => {
    expect(provider).toBeInstanceOf(FlutterwaveProvider);
  });

  describe("disburse", () => {
    it("returns a mapped result on successful transfer", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "success",
          message: "Transfer Queued Successfully",
          data: {
            id: 12345,
            reference: "ref-001",
            status: "NEW",
            amount: 50000,
            fee: 26.88,
          },
        }),
      });

      const result = await provider.disburse({
        amount: 50000,
        reference: "ref-001",
        narration: "Salary payment",
        destinationBankCode: "058",
        destinationAccountNumber: "0123456789",
        destinationAccountName: "John Doe",
        currency: "NGN",
      });

      expect(result).toEqual({
        reference: "ref-001",
        providerReference: "12345",
        status: "pending",
        amount: 50000,
        fee: 26.88,
      });

      // Verify the request sent to Flutterwave
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.flutterwave.com/v3/transfers");
      expect(options.method).toBe("POST");
      expect(options.headers["Authorization"]).toBe("Bearer test-secret-key");
      expect(options.headers["Content-Type"]).toBe("application/json");
      const body = JSON.parse(options.body);
      expect(body).toEqual({
        account_bank: "058",
        account_number: "0123456789",
        amount: 50000,
        narration: "Salary payment",
        currency: "NGN",
        reference: "ref-001",
        debit_currency: "NGN",
      });
    });

    it("throws BadRequestError on 400 from Flutterwave", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          status: "error",
          message: "Invalid account number",
          data: null,
        }),
      });

      await expect(
        provider.disburse({
          amount: 1000,
          reference: "ref-bad",
          narration: "Bad transfer",
          destinationBankCode: "058",
          destinationAccountNumber: "bad",
          destinationAccountName: "Nobody",
          currency: "NGN",
        }),
      ).rejects.toThrow("Invalid account number");
    });

    it("maps SUCCESSFUL status to completed", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "success",
          data: {
            id: 99,
            reference: "ref-done",
            status: "SUCCESSFUL",
            amount: 3000,
            fee: 10,
          },
        }),
      });

      const result = await provider.disburse({
        amount: 3000,
        reference: "ref-done",
        narration: "Completed",
        destinationBankCode: "058",
        destinationAccountNumber: "0123456789",
        destinationAccountName: "Jane",
        currency: "NGN",
      });

      expect(result.status).toBe("completed");
    });

    it("maps PENDING status to pending", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "success",
          data: {
            id: 100,
            reference: "ref-pend",
            status: "PENDING",
            amount: 5000,
            fee: 15,
          },
        }),
      });

      const result = await provider.disburse({
        amount: 5000,
        reference: "ref-pend",
        narration: "Pending",
        destinationBankCode: "058",
        destinationAccountNumber: "0123456789",
        destinationAccountName: "Y",
        currency: "NGN",
      });

      expect(result.status).toBe("pending");
    });

    it("maps FAILED status to failed", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "success",
          data: {
            id: 101,
            reference: "ref-fail",
            status: "FAILED",
            amount: 2000,
            fee: 10,
          },
        }),
      });

      const result = await provider.disburse({
        amount: 2000,
        reference: "ref-fail",
        narration: "Failed",
        destinationBankCode: "058",
        destinationAccountNumber: "0123456789",
        destinationAccountName: "Z",
        currency: "NGN",
      });

      expect(result.status).toBe("failed");
    });
  });

  describe("generateVirtualAccount", () => {
    it("supports generating a virtual account from an org id", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "success",
          message: "Virtual account created",
          data: {
            account_number: "8000012345",
            bank_name: "Wema Bank",
            order_ref: "org-org-123",
          },
        }),
      });

      const result = await provider.generateVirtualAccount("org-123");

      expect(result).toEqual({
        accountNumber: "8000012345",
        accountName: "Org org-123",
        bankName: "Wema Bank",
        bankCode: "",
        reference: "org-org-123",
      });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://api.flutterwave.com/v3/virtual-account-numbers",
      );
      const body = JSON.parse(options.body);
      expect(body).toEqual({
        email: "org-org-123@vestroll.local",
        is_permanent: true,
        tx_ref: "org-org-123",
        amount: 0,
        currency: "NGN",
      });
    });

    it("creates a virtual account and returns mapped result", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "success",
          message: "Virtual account created",
          data: {
            account_number: "8000012345",
            bank_name: "Wema Bank",
            order_ref: "va-ref-001",
          },
        }),
      });

      const result = await provider.generateVirtualAccount({
        reference: "va-ref-001",
        accountName: "Jane Doe",
        customerEmail: "jane@example.com",
        customerName: "Jane Doe",
        currency: "NGN",
      });

      expect(result).toEqual({
        accountNumber: "8000012345",
        accountName: "Jane Doe",
        bankName: "Wema Bank",
        bankCode: "",
        reference: "va-ref-001",
      });

      // Verify the request sent to Flutterwave
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://api.flutterwave.com/v3/virtual-account-numbers",
      );
      expect(options.method).toBe("POST");
      expect(options.headers["Authorization"]).toBe("Bearer test-secret-key");
      const body = JSON.parse(options.body);
      expect(body).toEqual({
        email: "jane@example.com",
        is_permanent: true,
        tx_ref: "va-ref-001",
        amount: 0,
        currency: "NGN",
      });
    });

    it("throws BadRequestError when Flutterwave rejects the request", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          status: "error",
          message: "Duplicate tx_ref",
          data: null,
        }),
      });

      await expect(
        provider.generateVirtualAccount({
          reference: "dup-ref",
          accountName: "Dup",
          customerEmail: "dup@example.com",
          customerName: "Dup User",
          currency: "NGN",
        }),
      ).rejects.toThrow("Duplicate tx_ref");
    });
  });

  describe("verifyTransaction", () => {
    it("verifies a transaction and returns the shared result shape", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "success",
          message: "Verification successful",
          data: {
            id: 7788,
            tx_ref: "tx-ref-001",
            status: "successful",
            amount: 25000,
            currency: "NGN",
            created_at: "2026-03-27T09:30:00.000Z",
          },
        }),
      });

      const result = await provider.verifyTransaction("tx-ref-001");

      expect(result).toEqual({
        reference: "tx-ref-001",
        providerReference: "7788",
        status: "successful",
        amount: 25000,
        currency: "NGN",
        paidAt: "2026-03-27T09:30:00.000Z",
        raw: {
          id: 7788,
          tx_ref: "tx-ref-001",
          status: "successful",
          amount: 25000,
          currency: "NGN",
          created_at: "2026-03-27T09:30:00.000Z",
        },
      });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=tx-ref-001",
      );
      expect(options.method).toBe("GET");
    });
  });

  describe("error handling", () => {
    it("throws UnauthorizedError on 401", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          status: "error",
          message: "Invalid API key",
          data: null,
        }),
      });

      await expect(
        provider.disburse({
          amount: 1000,
          reference: "ref-unauth",
          narration: "Fail",
          destinationBankCode: "058",
          destinationAccountNumber: "0123456789",
          destinationAccountName: "X",
          currency: "NGN",
        }),
      ).rejects.toThrow("Invalid API key");
    });

    it("throws InternalServerError on 500", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          status: "error",
          message: "Internal server error",
          data: null,
        }),
      });

      await expect(
        provider.disburse({
          amount: 1000,
          reference: "ref-500",
          narration: "Server error",
          destinationBankCode: "058",
          destinationAccountNumber: "0123456789",
          destinationAccountName: "X",
          currency: "NGN",
        }),
      ).rejects.toThrow("Internal server error");
    });

    it("handles non-JSON responses gracefully via safeJson", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
      });

      await expect(
        provider.disburse({
          amount: 1000,
          reference: "ref-badjson",
          narration: "Bad gateway",
          destinationBankCode: "058",
          destinationAccountNumber: "0123456789",
          destinationAccountName: "X",
          currency: "NGN",
        }),
      ).rejects.toThrow("Flutterwave returned an invalid response (HTTP 502)");
    });
  });
});
