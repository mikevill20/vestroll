"use client";

import React, { useState, useEffect } from "react";
import { Info, X } from "lucide-react";
import { PermissionFormData, User } from "@/types/permissions-tab.types";
import PermissionsInfoModal from "@/components/features/permissions/PermissionInfoModal";
import { useRouter } from "next/navigation";

interface PermissionFormViewProps {
  selectedUser: User | null;
  initialFormData: PermissionFormData;
  initialPermissions: string[];
  onClose: () => void;
  onSave: (formData: PermissionFormData, permissions: string[]) => void;
}

export const availablePermissions: string[] = [
  "Administrator",
  "Team manager",
  "Expenses administrator",
  "External recruiter",
  "Invoice administrator",
  "Payroll administrator",
  "Time off administrator",
];

export default function PermissionFormView({
  selectedUser,
  initialFormData,
  initialPermissions,
  onClose,
  onSave,
}: PermissionFormViewProps) {
  const [formData, setFormData] = useState<PermissionFormData>({
    name: "",
    email: "",
  });
  const [permissions, setPermissions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<PermissionFormData>>({});
  const [showInfo, setShowInfo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialFormData) {
      setFormData(initialFormData);
    }
    if (initialPermissions) {
      setPermissions(initialPermissions);
    }
  }, [initialFormData, initialPermissions]);

  const handleGoBack = () => {
    router.back();
    onClose();
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PermissionFormData> = {};

    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!isValidEmail(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const togglePermission = (permission: string): void => {
    if (permissions.includes(permission)) {
      setPermissions(permissions.filter((p) => p !== permission));
    } else {
      setPermissions([...permissions, permission]);
    }
  };

  const handleSave = (): void => {
    if (selectedUser || validateForm()) onSave(formData, permissions);
  };

  const isFormValid =
    formData &&
    formData.name &&
    formData.name.trim() &&
    formData.email &&
    formData.email.trim() &&
    isValidEmail(formData.email.trim());

  return (
    <div className="min-h-screen">
      {/* Header - Same as CompanyInfoPage */}
      <div className="bg-white p-4 border-b border-gray-300">
        <button
          onClick={handleGoBack}
          className="text-gray-400 text-sm mb-1 hover:text-gray-600 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl mb-2 font-semibold text-gray-900">
          {selectedUser ? "Edit Permissions" : "Set Permissions"}
        </h1>
      </div>

      {/* Body - Same structure as CompanyInfoPage */}
      <div className="bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-sm p-6 md:p-8">
          {/* Full name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full name
            </label>
            <input
              type="text"
              value={formData?.name || ""}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              disabled={!!selectedUser}
              className={`w-full px-4 py-3 rounded-lg text-gray-700 placeholder-gray-400 outline-none transition-colors ${
                selectedUser
                  ? "bg-[#F5F6F7] text-gray-400 cursor-not-allowed"
                  : "bg-[#F5F6F7] border border-gray-300 focus:ring-2 focus:ring-purple-900"
              } ${errors.name ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              type="email"
              value={formData?.email || ""}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              disabled={!!selectedUser}
              className={`w-full px-4 py-3 rounded-lg text-gray-700 placeholder-gray-400 outline-none transition-colors ${
                selectedUser
                  ? "bg-[#F5F6F7] text-gray-400 cursor-not-allowed"
                  : "bg-[#F5F6F7] border border-gray-300 focus:ring-2 focus:ring-purple-900"
              } ${errors.email ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Permissions */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Permissions
              </label>
              <button
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setShowInfo(true)}
              >
                <Info className="w-4 h-4 text-orange-500" />
                More info
              </button>
            </div>

            {/* Permission chips */}
            <div className="flex flex-wrap gap-2">
              {availablePermissions.map((permission) => {
                const isSelected = permissions.includes(permission);
                return (
                  <button
                    key={permission}
                    type="button"
                    onClick={() => togglePermission(permission)}
                    className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-purple-100 text-[#5E2A8C]"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {permission}
                    {isSelected && (
                      <X className="w-4 h-4 text-[#5E2A8C] cursor-pointer" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save button - Same style as CompanyInfoPage */}
          <div className="mt-12">
            <button
              onClick={handleSave}
              disabled={!isFormValid}
              className={`w-full text-white px-8 py-6 rounded-lg text-base font-semibold ${
                isFormValid
                  ? "bg-[#5E2A8C] hover:bg-[#4A1F73]"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>

      <PermissionsInfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        iconSrc="/permission-icon.png"
      />
    </div>
  );
}
