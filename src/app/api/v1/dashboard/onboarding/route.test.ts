import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { OnboardingService } from "@/server/services/onboarding.service";
import { AuthUtils } from "@/server/utils/auth";
import { UnauthorizedError } from "@/server/utils/errors";

vi.mock("@/server/services/onboarding.service");
vi.mock("@/server/utils/auth");

const buildMockStatus = (overrides: {
  emailVerified?: boolean;
  companyInfoProvided?: boolean;
  kybVerified?: boolean;
  walletFunded?: boolean;
} = {}) => {
  const emailVerified = overrides.emailVerified ?? false;
  const companyInfoProvided = overrides.companyInfoProvided ?? false;
  const kybVerified = overrides.kybVerified ?? false;
  const walletFunded = overrides.walletFunded ?? false;

  const steps = [
    { key: "emailVerified", label: "Email Verification", completed: emailVerified },
    { key: "companyInfoProvided", label: "Company Profile", completed: companyInfoProvided },
    { key: "kybVerified", label: "KYB Verification", completed: kybVerified },
    { key: "walletFunded", label: "Wallet Funding", completed: walletFunded },
  ];
  const completedSteps = steps.filter((s) => s.completed).length;

  return {
    emailVerified,
    companyInfoProvided,
    kybVerified,
    walletFunded,
    completedSteps,
    totalSteps: 4,
    progressPercentage: (completedSteps / 4) * 100,
    steps,
  };
};

describe("GET /api/v1/dashboard/onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (): NextRequest => {
    return {} as unknown as NextRequest;
  };

  it("should return 25% progress when only email is verified", async () => {
    const mockUser = { userId: "user-123" };
    const mockStatus = buildMockStatus({ emailVerified: true });

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(OnboardingService.getOnboardingStatus).mockResolvedValue(mockStatus);

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("Onboarding status retrieved successfully");
    expect(data.data.emailVerified).toBe(true);
    expect(data.data.companyInfoProvided).toBe(false);
    expect(data.data.kybVerified).toBe(false);
    expect(data.data.walletFunded).toBe(false);
    expect(data.data.completedSteps).toBe(1);
    expect(data.data.totalSteps).toBe(4);
    expect(data.data.progressPercentage).toBe(25);
    expect(data.data.steps).toHaveLength(4);
    expect(data.data.steps[0]).toEqual({
      key: "emailVerified",
      label: "Email Verification",
      completed: true,
    });
    expect(OnboardingService.getOnboardingStatus).toBeCalledWith("user-123");
  });

  it("should return 100% progress when all steps are complete", async () => {
    const mockUser = { userId: "user-123" };
    const mockStatus = buildMockStatus({
      emailVerified: true,
      companyInfoProvided: true,
      kybVerified: true,
      walletFunded: true,
    });

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(OnboardingService.getOnboardingStatus).mockResolvedValue(mockStatus);

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.completedSteps).toBe(4);
    expect(data.data.progressPercentage).toBe(100);
    expect(data.data.steps.every((s: any) => s.completed)).toBe(true);
  });

  it("should return 0% progress when no steps are complete", async () => {
    const mockUser = { userId: "user-123" };
    const mockStatus = buildMockStatus();

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(OnboardingService.getOnboardingStatus).mockResolvedValue(mockStatus);

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.completedSteps).toBe(0);
    expect(data.data.progressPercentage).toBe(0);
    expect(data.data.steps.every((s: any) => !s.completed)).toBe(true);
  });

  it("should return 50% progress when two steps are complete", async () => {
    const mockUser = { userId: "user-123" };
    const mockStatus = buildMockStatus({
      emailVerified: true,
      companyInfoProvided: true,
    });

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(OnboardingService.getOnboardingStatus).mockResolvedValue(mockStatus);

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.completedSteps).toBe(2);
    expect(data.data.progressPercentage).toBe(50);
  });

  it("should return 401 for unauthorized access", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError(),
    );

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("should return 404 when user not found", async () => {
    const mockUser = { userId: "user-123" };

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(OnboardingService.getOnboardingStatus).mockResolvedValue(null);

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("User not found");
  });

  it("should return 500 on unexpected server error", async () => {
    const mockUser = { userId: "user-123" };

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue(mockUser as any);
    vi.mocked(OnboardingService.getOnboardingStatus).mockRejectedValue(
      new Error("Database connection failed"),
    );

    const req = createMockRequest();
    const response = await GET(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Internal server error");
  });
});


