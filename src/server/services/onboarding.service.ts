import { db, users, companyProfiles, kybVerifications, organizationWallets } from "../db";
import { eq } from "drizzle-orm";

export interface OnboardingStep {
  key: string;
  label: string;
  completed: boolean;
}

export interface OnboardingStatus {
  emailVerified: boolean;
  companyInfoProvided: boolean;
  kybVerified: boolean;
  walletFunded: boolean;
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
  steps: OnboardingStep[];
}

export class OnboardingService {
  static async getOnboardingStatus(userId: string): Promise<OnboardingStatus | null> {
    const [user] = await db
      .select({
        status: users.status,
        organizationId: users.organizationId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    const emailVerified = user.status === "active";

    const [companyProfileResult, kybResult, walletResult] = await Promise.all([
      user.organizationId
        ? db
            .select({ id: companyProfiles.id })
            .from(companyProfiles)
            .where(eq(companyProfiles.organizationId, user.organizationId))
            .limit(1)
        : Promise.resolve([]),
      db
        .select({ status: kybVerifications.status })
        .from(kybVerifications)
        .where(eq(kybVerifications.userId, userId))
        .limit(1),
      user.organizationId
        ? db
            .select({ funded: organizationWallets.funded })
            .from(organizationWallets)
            .where(eq(organizationWallets.organizationId, user.organizationId))
            .limit(1)
        : Promise.resolve([]),
    ]);

    const companyInfoProvided = companyProfileResult.length > 0;
    const kybVerified = kybResult[0]?.status === "verified";
    const walletFunded = !!(walletResult[0] as { funded?: boolean })?.funded;

    const steps: OnboardingStep[] = [
      { key: "emailVerified", label: "Email Verification", completed: emailVerified },
      { key: "companyInfoProvided", label: "Company Profile", completed: companyInfoProvided },
      { key: "kybVerified", label: "KYB Verification", completed: kybVerified },
      { key: "walletFunded", label: "Wallet Funding", completed: walletFunded },
    ];

    const completedSteps = steps.filter((s) => s.completed).length;
    const totalSteps = steps.length;
    const progressPercentage = (completedSteps / totalSteps) * 100;

    return {
      emailVerified,
      companyInfoProvided,
      kybVerified,
      walletFunded,
      completedSteps,
      totalSteps,
      progressPercentage,
      steps,
    };
  }
}
