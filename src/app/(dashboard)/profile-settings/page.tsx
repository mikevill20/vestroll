// app/settings/page.tsx (or wherever your main file is)
"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, Settings2 } from "lucide-react";
import UploadImageModal from "@/components/features/profile-settings/ImageUploadModal";
import PreferencesPage from "./preferences/page";
import NotificationsPage from "./notifications/page";

interface SectionCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
      <div className="group flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#eef2f7]">
        <h2 className="text-lg font-semibold text-[#1f2937]">{title}</h2>
        {action}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

interface FieldRowProps {
  label: string;
  value?: React.ReactNode;
  right?: React.ReactNode;
}

function FieldRow({ label, value, right }: FieldRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-6 px-3 sm:px-4 py-3 rounded-lg bg-[#f8fafc]">
      <div className="text-sm text-[#6b7280]">{label}</div>
      <div className="sm:col-span-2 flex items-center justify-end gap-3">
        <div className="text-sm sm:text-base text-[#111827] text-right">
          {value ?? <span className="text-[#9ca3af]">--</span>}
        </div>
        {right}
      </div>
    </div>
  );
}

type ProfileSettingsTab = "settings" | "preferences" | "notifications";

export default function Page() {
  const [activeTab, setActiveTab] = useState<ProfileSettingsTab>("settings");
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const tabs = [
    { id: "settings" as ProfileSettingsTab, label: "Settings" },
    { id: "preferences" as ProfileSettingsTab, label: "Preferences" },
    { id: "notifications" as ProfileSettingsTab, label: "Notifications" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "preferences":
        return <PreferencesPage />;
      case "notifications":
        return <NotificationsPage />;

      case "settings":
      default:
        return <Settings />;
    }
  };

  return (
    <>
      <header className="bg-white border-b border-[#DCE0E5]">
        <div className="px-4 sm:px-6 py-2">
          <button
            onClick={() => router.push("/app/dashboard")}
            className="text-gray-900 text-sm hover:text-gray-600 transition-colors"
          >
            ← Back to dashboard
          </button>
          <div className="mt-4 mb-2">
            <h1 className="text-[24px] text-gray-950 font-bold">
              Profile Settings
            </h1>
          </div>
          <div className="flex flex-1 space-x-3 text-gray-500">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "text-[#5E2A8C] font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#5E2A8C]"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="m-4 max-w-6xl">{renderTabContent()}</div>
    </>
  );
}

// Settings Content Component
function Settings() {
  const router = useRouter();
  const [profImage, setProfImage] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const name = "Peter";
  const email = "peter@gmail.com";

  const handleImageUpload = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setProfImage(imageUrl);

    // Simulate API call
    console.log("Uploading image:", file.name);
  };

  return (
    <>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            {profImage ? (
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden">
                  <Image
                    src={profImage}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-semibold text-4xl">
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="text-black">
              <h2 className="text-[20px] sm:text-3xl font-semibold text-[#111827]">
                {name}
              </h2>
              <h3 className="text-sm sm:text-base text-gray-600 mt-1">
                {email}
              </h3>
            </div>
          </div>

          <button
            className="flex items-center gap-2 rounded-full border border-purple-600 text-purple-600 px-4 py-3 hover:bg-purple-600 hover:text-white transition-colors whitespace-nowrap"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <CloudUpload size={20} />
            Upload image
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadImageModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSave={handleImageUpload}
        currentImage={profImage || undefined}
      />

      <div className="mt-6">
        <SectionCard
          title="General"
          action={
            <button
              onClick={() => router.push("/app/profile-settings/edit-profile")}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-[#5E2A8C] border-[#5E2A8C] hover:bg-purple-300 hover:text-purple-950 active:bg-[#5E2A8C] transition-colors"
              type="button"
              aria-label="Edit company information"
            >
              <Image
                src="/edit.svg"
                width={16}
                height={16}
                alt=""
                aria-hidden
                className="transition group-hover:invert group-hover:brightness-0"
              />
              Edit
            </button>
          }
        >
          <div className="space-y-3 text-black">
            <FieldRow label="Name" value="peter" />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">
                Account Email
              </span>
              <span className="text-sm text-gray-900">peter@example.com</span>
            </div>
            <FieldRow label="Password" value="password" />
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Security</h2>
              <p className="text-sm text-gray-600 mt-1">
                Two-factor authentication(2FA)
              </p>
            </div>
            <button
              onClick={() => router.push("/app/profile-settings/2fa-setup")}
              className="flex items-center gap-2 px-4 py-2 text-purple-900 rounded-full border border-purple-900 hover:bg-purple-600 hover:text-white transition-colors"
            >
              <Settings2 />
              Setup
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-center gap-3 bg-yellow-50 rounded-xl border border-gray-300 px-4 py-4">
                <Image
                  src="/warning.svg"
                  width={24}
                  height={24}
                  alt="Warning"
                  className="pl-2"
                />
                <div className="text-sm text-black px-2">
                  Two-factor authentication is an additional security measure to
                  protect your account. Once set up, depending on your
                  authentication method, each time you access your account you
                  will have to provide a verification code using an
                  authentication application or through your email.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SectionCard title="Legal">
          <div className="space-x-4 space-y-4">
            <button className="rounded-full bg-gray-200 text-black p-3">
              Help & Support
            </button>
            <button className="rounded-full bg-gray-200 text-black p-3">
              Terms and Support
            </button>
            <button className="rounded-full bg-gray-200 text-black p-3">
              Privacy notice
            </button>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
