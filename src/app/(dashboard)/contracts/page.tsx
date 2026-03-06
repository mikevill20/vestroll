import BasePage from "@/components/features/contracts/BasePage";
import ContractHistory from "@/components/features/contracts/ContractHistory";
import PageHeader from "@/components/features/contracts/header";
import FirstContractBanner from "@/components/features/contracts/ui/FirstContractBanner";

export default function ContractsPage() {
  return (
    <div className="space-y-4">
      <PageHeader />
      <BasePage />
    </div>
  );
}
