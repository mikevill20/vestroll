"use client";
import React, { useState } from "react";

import { NavigationTabs } from "@/components/features/team-management/NavigationTabs";
import TeamMgtTimeSheet from "@/components/features/team-management/time-tracking";
import TeamMgtMilestone from "@/components/features/team-management/milestone";
import TeamMgtExpense from "@/components/features/team-management/expense";
import { Plus } from "lucide-react";
import TeamMgtTimeoff from "@/components/features/team-management/timeoff";
import Link from "next/link";
import TeamMgtEmployees from "@/components/features/team-management/employees";
import { generateMockEmployees } from "@/components/features/team-management/utils";
import { ExportDropdown } from "@/components/features/team-management/ExportDropDown";
import { CreateFirstContact } from "@/components/features/team-management/CreateFirstContact";

const TeamManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState("Employees");
  const [isExportOpen, setIsExportOpen] = useState(false);

  const allEmployees = generateMockEmployees();

  const renderTabContent = () => {
    switch (activeTab) {
      case "Employees":
        return <TeamMgtEmployees employees={allEmployees} />;
      case "Time off":
        return <TeamMgtTimeoff />;
      case "Milestone":
        return <TeamMgtMilestone />;
      case "Time tracking":
        return <TeamMgtTimeSheet />;
      case "Expense":
        return <TeamMgtExpense />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1 dark:text-gray-400">
                Overview
              </p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Team management
              </h1>
            </div>
            <div className="flex gap-2">
              <ExportDropdown
                isOpen={isExportOpen}
                onToggle={() => setIsExportOpen(!isExportOpen)}
              />
              {activeTab === "Time off" && (
                <Link
                  className="flex items-center gap-2 bg-primary-500 text-white md:h-10 px-4 rounded-lg"
                  href={"/app/team-management/create-timeoff"}
                >
                  <Plus />{" "}
                  <span className="hidden md:inline">Create request</span>
                </Link>
              )}
            </div>
          </div>
          <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {allEmployees.length === 0 ? (
          <CreateFirstContact />
        ) : (
          renderTabContent()
        )}
      </div>

      {isExportOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExportOpen(false)}
        />
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default TeamManagementDashboard;
