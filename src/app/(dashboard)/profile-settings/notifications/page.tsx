"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface NotificationSetting {
  id: string;
  label: string;
  enabled: boolean;
  type?: "toggle" | "required";
}

type SectionType = "employment" | "teamManagement";

export default function NotificationsPage() {
  const router = useRouter();

  // Employment section notifications
  const [employmentNotifications, setEmploymentNotifications] = useState<
    NotificationSetting[]
  >([
    {
      id: "contract-request",
      label: "Contract Request",
      enabled: true,
      type: "toggle",
    },
    {
      id: "contracts-updates",
      label: "Contracts Updates",
      enabled: true,
      type: "toggle",
    },
    {
      id: "contracts-termination",
      label: "Contracts Termination",
      enabled: true,
      type: "toggle",
    },
  ]);

  // Team Management section notifications
  const [teamManagementNotifications, setTeamManagementNotifications] =
    useState<NotificationSetting[]>([
      {
        id: "time-off-requests",
        label: "Time Off Requests",
        enabled: true,
        type: "toggle",
      },
      {
        id: "timesheets",
        label: "Timesheets",
        enabled: true,
        type: "toggle",
      },
      {
        id: "milestones",
        label: "Milestones",
        enabled: true,
        type: "toggle",
      },
      {
        id: "invoice-updates-approvals-reminders",
        label: "Invoice Updates,Approvals and Reminders",
        enabled: false,
        type: "required",
      },

      {
        id: "expense-submissions",
        label: "Expense Submissions",
        enabled: false,
        type: "required",
      },
    ]);

  const toggleNotification = (section: SectionType, id: string) => {
    if (section === "employment") {
      setEmploymentNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, enabled: !item.enabled } : item
        )
      );
    } else {
      setTeamManagementNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, enabled: !item.enabled } : item
        )
      );
    }
  };

  const renderToggle = (enabled: boolean) => (
    <div
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-[#5E2A8C]" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </div>
  );

  const renderNotificationSection = (
    title: string,
    notifications: NotificationSetting[],
    sectionType: SectionType
  ) => (
    <section className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#eef2f7]">
        <div>
          <h2 className="text-lg font-semibold text-[#1f2937]">{title}</h2>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-6 px-3 sm:px-4 py-3 rounded-lg bg-[#f8fafc] hover:bg-gray-50 transition-colors"
            >
              <div className="sm:col-span-2">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium text-[#111827]">
                    {notification.label}
                  </h3>
                </div>
              </div>

              <div className="flex justify-end">
                {notification.type === "toggle" ? (
                  <button
                    onClick={() =>
                      toggleNotification(sectionType, notification.id)
                    }
                    className="ml-4"
                    aria-label={`Toggle ${notification.label} notifications`}
                  >
                    {renderToggle(notification.enabled)}
                  </button>
                ) : (
                  <div className="text-sm text-gray-500 font-medium">
                    Required
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Employment Section */}
      {renderNotificationSection(
        "Employment",

        employmentNotifications,
        "employment"
      )}

      {/* Team Management Section */}
      {renderNotificationSection(
        "Team Management",
        teamManagementNotifications,
        "teamManagement"
      )}
    </div>
  );
}
