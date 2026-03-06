"use client";

import React, { useState } from "react";
import InputField from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface FormData {
  name: string;
  emailAddress: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export default function EditProfilePage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const [formData, setFormData] = useState<FormData>({
    name: "",
    emailAddress: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const isFormValid = true;

  return (
    <div className="min-h-screen ">
      <div className=" bg-white p-4 border-b border-gray-300">
        <button
          onClick={handleGoBack}
          className="text-gray-400 text-sm mb-1 hover:text-gray-600 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl mb-2 font-semibold text-gray-900">
          Edit Profile
        </h1>
      </div>
      <div className="bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-sm p-6 md:p-8">
          <div className="flex flex-col items-center justify-center mb-6"></div>

          <div className="flex flex-col gap-4 text-black mb-40">
            <InputField
              id="name"
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Peter"
            />

            <InputField
              id="emailAddress"
              label="Account email address"
              value={formData.emailAddress}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  emailAddress: e.target.value,
                }))
              }
              placeholder="mailpete07@gmail.com"
            />

            <span>Change your Password</span>

            <InputField
              id="currentPassword"
              label="Current password"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              placeholder=""
            />

            <InputField
              id="newPassword"
              label="New password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              placeholder=""
            />

            <InputField
              id="confrimNewPassword"
              label="Confirm new password"
              value={formData.confirmNewPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confrimNewPassword: e.target.value,
                }))
              }
              placeholder=""
            />
          </div>

          <div className="mt-12">
            <Button
              disabled={!isFormValid}
              className={`w-full text-white px-8 py-6 rounded-lg text-base font-semibold ${
                isFormValid
                  ? "bg-[#5E2A8C] hover:bg-[#4A1F73]"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
