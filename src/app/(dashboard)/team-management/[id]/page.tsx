"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MoveLeft } from "lucide-react";
import EmployeeProfileHeader from "@/components/features/team-management/profile";
import ContractGrid from "@/components/features/team-management/contractCard";

export default function Page() {
  const router = useRouter();

  const defaultEmployee = {
    id: "1",
    name: "James Akinbiola",
    email: "mailjames@gmail.com",
    phone: "+234 904 364 2019",
    address:
      "No 5 James Robertson Stedu/Oguntana Drive, Surulere, Nigeria | 145241",
    image: "/profileImage.png",
  };

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-background-b0 w-full py-4">
        <div className="px-7 space-y-3 pt-2 w-fit">
          <button
            className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-black transition-colors"
            onClick={() => router.back()}
          >
            <MoveLeft className="w-4 h-4" /> Back
          </button>
          <p className="text-lg font-semibold">{defaultEmployee.name}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <section className="max-w-5xl p-6 bg-background-b0 rounded-xl">
          <div className="">
            <p className="text-text-primary text-sm">Personal Information</p>
          </div>

          <EmployeeProfileHeader defaultEmployee={defaultEmployee} />

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-secondary">
                Contracts
              </h3>
            </div>
            <ContractGrid />
          </div>
        </section>
      </main>
    </div>
  );
}
