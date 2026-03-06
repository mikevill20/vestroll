"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  UsersIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { ArrowLeft } from "lucide-react";

interface StatProps {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}

function Stat({ Icon, label, value }: StatProps) {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f3ff] dark:bg-gray-800">
        <Icon className="h-5 w-5 text-(--violet-base)" />
      </div>
      <div className="leading-tight flex flex-col-reverse items-center gap-1.5 text-center sm:items-start sm:text-left">
        <div className="text-xs sm:text-sm text-[#6b7280] dark:text-gray-400">
          {label}
        </div>
        <div className="text-base sm:text-lg font-semibold text-[#111827] dark:text-gray-100  text-left">
          {value}
        </div>
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="group flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#eef2f7] dark:border-gray-800">
        <h2 className="text-lg font-semibold text-[#1f2937] dark:text-gray-200">
          {title}
        </h2>
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
    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-6 px-3 sm:px-4 py-3 rounded-lg bg-[#f8fafc] dark:bg-gray-800/50">
      <div className="text-sm text-[#6b7280] dark:text-gray-400">{label}</div>
      <div className="flex items-center justify-end gap-3 sm:col-span-2">
        <div className="text-sm sm:text-base text-[#111827] text-right dark:text-gray-200">
          {value ?? <span className="text-[#9ca3af]">--</span>}
        </div>
        {right}
      </div>
    </div>
  );
}
function HeaderTab({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };
  return (
    <div className="px-4 pt-6 mb-3 bg-white lg:mb-6">
      <div>
        <Link
          href="/app/settings"
          className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Settings </h1>
      </div>
      <div className="flex items-center gap-2.5 md:gap-6">
        {tabs.map((tab) => (
          <button
            onClick={() => handleTabClick(tab)}
            key={tab}
            className={`inline-block cursor-pointer mt-2 border-b-3 pb-1.5 text-xs sm:text-sm font-medium rounded-t-lg ${
              tab === activeTab
                ? "border-b-(--violet-base) "
                : "text-gray-600 border-b-transparent hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const [activeTab, setActiveTab] = React.useState("Company");
  const tabs = ["Company", "Permissions", "Hiring templates", "Address book"];
  return (
    <>
      <HeaderTab
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 max-w-213 mx-4 mt-4 ">
        <div className="flex flex-col items-center gap-4 text-center md:block sm:items-center sm:justify-start sm:text-left">
          <div className="items-center gap-8 md:flex">
            <Image
              src="/touchpoint360.png"
              alt="Touchpoint 360"
              width={96}
              height={96}
              className="mx-auto md:mx-0 sm:h-[112px] sm:w-[112px] h-[96px] w-[96px]"
            />

            <div>
              <h2 className="text-3xl sm:text-3xl font-semibold text-[#111827] dark:text-white">
                Touchpoint 360
              </h2>

              <div className="flex flex-wrap items-center justify-center gap-5 py-4 sm:gap-4 sm:pt-4 sm:justify-start md:gap-10">
                <Stat Icon={UsersIcon} label="Active members" value="20" />
                <div
                  className="hidden sm:block h-10 w-px bg-[#e5e7eb] dark:bg-gray-700"
                  aria-hidden="true"
                />
                <Stat Icon={GlobeAltIcon} label="Countries" value="04" />
                <div
                  className="hidden sm:block h-10 w-px bg-[#e5e7eb] dark:bg-gray-700"
                  aria-hidden="true"
                />
                <Stat
                  Icon={ShieldCheckIcon}
                  label="Administrators"
                  value="02"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-6 max-w-213">
        <SectionCard
          title="Company information"
          action={
            <button
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-(--violet-base) border-(--violet-base) hover:bg-(--violet-hover) hover:text-white active:bg-(--violet-active) transition-colors"
              type="button"
              aria-label="Edit company information"
            >
              <Image
                src="/edit.svg"
                width={16}
                height={16}
                alt=""
                aria-hidden
                className="transition group-hover:invert group-hover:brightness-0 dark:invert"
              />
              Edit
            </button>
          }
        >
          <div className="space-y-3">
            <FieldRow label="Company/Brand name" value="Touchpoint 360" />
            <FieldRow label="Registered name" value="Touchpoint 360" />
            <FieldRow
              label="Registration Number/EIN ID"
              value={<span className="text-[#9ca3af]">--</span>}
            />
            <FieldRow
              label="Country of incorporation"
              value={
                <div className="flex items-center gap-2">
                  <Image
                    src="/nigeria.svg"
                    width={20}
                    height={14}
                    alt="Nigeria flag"
                  />
                  <span>Nigeria</span>
                </div>
              }
            />
            <FieldRow
              label="Size"
              value={<span className="text-[#9ca3af]">--</span>}
            />
            <FieldRow
              label="VAT number"
              value={<span className="text-[#9ca3af]">--</span>}
            />
            <FieldRow
              label="Company public website URL"
              value={
                <Link
                  href="https://www.touchpoint360.com/"
                  className="text-(--violet-base) hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.touchpoint360.com/
                </Link>
              }
            />
          </div>
        </SectionCard>
      </div>

      <div className="mx-4 mt-6 max-w-213">
        <SectionCard title="Addresses">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-[#6b7280] mb-2 dark:text-gray-400">
                Billing address
              </div>
              <div className="flex items-center gap-3 px-4 py-4 border border-gray-300 rounded-xl dark:border-gray-700 dark:bg-gray-800/50">
                <Image
                  src="/warning.svg"
                  width={20}
                  height={20}
                  alt="Warning"
                />
                <div className="text-sm dark:text-gray-300">
                  Please{" "}
                  <Link
                    className="underline decoration-(--violet-base) text-(--violet-base) hover:no-underline"
                    href="#"
                  >
                    add
                  </Link>{" "}
                  your company billing address
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#6b7280] mb-2 dark:text-gray-400">
                Registered address
              </div>
              <div className="flex items-center gap-3 px-4 py-4 border border-gray-300 rounded-xl dark:border-gray-700 dark:bg-gray-800/50">
                <Image
                  src="/warning.svg"
                  width={20}
                  height={20}
                  alt="Warning"
                />
                <div className="text-sm dark:text-gray-300">
                  Please{" "}
                  <Link
                    className="underline decoration-(--violet-base) text-(--violet-base) hover:no-underline"
                    href="settings/registered-address"
                  >
                    add
                  </Link>{" "}
                  your registered address
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
