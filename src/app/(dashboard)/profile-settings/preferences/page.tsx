"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ChevronRight, Search, Trash2 } from "lucide-react";

interface Device {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "tablet";
  location: string;
  ipAddress: string;
  lastActive: string;
  lastLoginDateTime: string;
  currentDevice: boolean;
}

type AppLanguage =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "ja"
  | "zh"
  | "ar"
  | "pt"
  | "ru"
  | "it"
  | "ko"
  | "hi";
type AppearanceMode = "light" | "dark" | "system";

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#eef2f7]">
        <div>
          <h2 className="text-lg font-semibold text-[#1f2937]">{title}</h2>
          {description && (
            <p className="text-sm text-[#6b7280] mt-1">{description}</p>
          )}
        </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-6 px-3 sm:px-4 py-3 rounded-lg bg-[#f8fafc] hover:bg-gray-50 transition-colors">
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

export default function PreferencesPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>("en");
  const [selectedAppearance, setSelectedAppearance] =
    useState<AppearanceMode>("system");
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState<string | null>(null);

  const languages: {
    code: AppLanguage;
    name: string;
    nativeName: string;
    flag: string;
  }[] = [
    { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
    { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
    { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
    { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
    { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
    { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
    { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
    { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
    { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
    { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  ];

  // Function to generate random IP addresses
  const generateIP = (seed: number) => {
    const baseIPs = [
      `192.168.${seed}.${Math.floor(Math.random() * 255)}`,
      `10.0.${seed}.${Math.floor(Math.random() * 255)}`,
      `172.16.${seed}.${Math.floor(Math.random() * 255)}`,
    ];
    return baseIPs[seed % 3];
  };

  // Function to generate exact date/times
  const generateDateTime = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));

    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  const devices: Device[] = [
    {
      id: "1",
      name: "MacBook Pro",
      type: "desktop",
      location: "San Francisco, US",
      ipAddress: generateIP(1),
      lastActive: "Active now",
      lastLoginDateTime: generateDateTime(0),
      currentDevice: true,
    },
    {
      id: "2",
      name: "iPhone 15 Pro",
      type: "mobile",
      location: "San Francisco, US",
      ipAddress: generateIP(2),
      lastActive: "2 hours ago",
      lastLoginDateTime: generateDateTime(2),
      currentDevice: false,
    },
    {
      id: "3",
      name: "Windows PC",
      type: "desktop",
      location: "New York, US",
      ipAddress: generateIP(3),
      lastActive: "3 days ago",
      lastLoginDateTime: generateDateTime(3),
      currentDevice: false,
    },
    {
      id: "4",
      name: "iPad Pro",
      type: "tablet",
      location: "London, UK",
      ipAddress: generateIP(4),
      lastActive: "1 week ago",
      lastLoginDateTime: generateDateTime(7),
      currentDevice: false,
    },
  ];

  const handleLanguageSelect = (language: AppLanguage) => {
    setSelectedLanguage(language);
    setShowLanguageModal(false);
    console.log("Language changed to:", language);
  };

  const handleAppearanceSelect = (mode: AppearanceMode) => {
    setSelectedAppearance(mode);
    console.log("Appearance changed to:", mode);
  };

  const handleRemoveDevice = (deviceId: string) => {
    console.log("Removing device:", deviceId);
    setShowRemoveModal(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* App Language Section */}
      <SectionCard title="App Language">
        <FieldRow
          label="Select default App Language"
          value={
            <div className="flex items-end gap-1">
              <div className="text-left">
                <p className="font-medium text-[#111827]">
                  {
                    languages.find((lang) => lang.code === selectedLanguage)
                      ?.name
                  }
                </p>
              </div>
            </div>
          }
          right={
            <Button
              onClick={() => setShowLanguageModal(true)}
              className=" text-[#5E2A8C] px-4 py-2 text-sm"
            >
              (Change)
              <ChevronRight />
            </Button>
          }
        />
      </SectionCard>

      <SectionCard title="Appearance">
        <div className="flex flex-row  space-x-10">
          {(["light", "dark", "system"] as AppearanceMode[]).map((mode) => (
            <div
              key={mode}
              onClick={() => handleAppearanceSelect(mode)}
              className={`cursor-pointer rounded-md border p-3 transition-all text-center ${
                selectedAppearance === mode
                  ? "border-2 border-purple-500 "
                  : "border-[#e5e7eb] hover:border-gray-300 bg-[#f8fafc]"
              }`}
            >
              {/* Image Container */}
              <div className="flex justify-center mb-2">
                <div className={`p-2 rounded-md `}>
                  <div className="relative md:w-45 md:h-25 w-20 h-10 space-x-7">
                    <Image
                      src={
                        mode === "light"
                          ? "/images/Lighttheme.png"
                          : mode === "dark"
                            ? "/images/Darktheme.png"
                            : "/images/systemtheme.png"
                      }
                      alt={`${mode} mode`}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Mode Name */}
              <div className="font-medium text-sm text-[#111827] capitalize">
                {mode}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Device Management Section */}
      <SectionCard
        title="Device Management"
        description="Manage all devices that have logged into your account"
      >
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="grid grid-cols-2 gap-2">
              {/* Device Rows */}
              {devices.map((device) => (
                <React.Fragment key={device.id}>
                  {/* Device Column */}
                  <div className="px-4 py-3 ">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-3 rounded-lg ${
                          device.currentDevice ? "bg-purple-100" : "bg-gray-100"
                        }`}
                      >
                        <div className="w-6 h-6 text-gray-600 font-medium">
                          {device.type === "desktop" && "💻"}
                          {device.type === "mobile" && "📱"}
                          {device.type === "tablet" && "📱"}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-[#111827] mb-1">
                          {device.name}
                        </div>
                        <div className="text-sm text-[#6b7280] mb-1">
                          Location: {device.location}. {device.ipAddress}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions Column */}
                  <div className="px-4 py-3">
                    <div className="flex flex-col items-end">
                      {device.currentDevice ? (
                        <>
                          <div className="mb-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                              Current Device
                            </span>
                          </div>
                          <div className="text-sm text-[#6b7280]">
                            Last active: {device.lastActive}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => setShowRemoveModal(device.id)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                          <div className="text-sm text-[#6b7280]">
                            Last login: {device.lastActive}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#e5e7eb]">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setShowLanguageModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-[#1f2937] flex-1 text-center">
                  Select Language
                </h3>
                <div className="w-10"></div> {/* Spacer for balance */}
              </div>

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-3 pl-10 border text-black bg-gray-100 border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Language List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {languages.map((language) => (
                  <div
                    key={language.code}
                    onClick={() =>
                      setSelectedLanguage(language.code as AppLanguage)
                    }
                    className={`cursor-pointer p-4 rounded-lg border transition-all flex items-center justify-between ${
                      selectedLanguage === language.code
                        ? "border-purple-500 bg-purple-50"
                        : "border-[#e5e7eb] hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{language.flag}</span>
                      <div>
                        <p className="font-medium text-[#111827]">
                          {language.name}
                        </p>
                        <p className="text-sm text-[#6b7280]">
                          {language.nativeName}
                        </p>
                      </div>
                    </div>

                    {selectedLanguage === language.code && (
                      <div className="w-6 h-6 rounded-full bg-[#5E2A8C] flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="p-6 border-t border-[#e5e7eb]">
              <Button
                onClick={() => {
                  handleLanguageSelect(selectedLanguage);
                  setShowLanguageModal(false);
                }}
                className="w-full bg-[#5E2A8C] hover:bg-purple-700 text-white"
              >
                Save Language
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Device Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-[#1f2937] mb-4">
                Remove Device
              </h3>
              <p className="text-[#6b7280] mb-6">
                Are you sure you want to remove this device? This will sign it
                out from your account.
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowRemoveModal(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#111827]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleRemoveDevice(showRemoveModal)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Remove Device
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
