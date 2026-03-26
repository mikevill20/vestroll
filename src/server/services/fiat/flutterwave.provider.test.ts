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
  });
});
