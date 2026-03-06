"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

type AuthMethod = "authenticator" | "email" | null;

export default function FaSetupPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>(null);

  const handleGoBack = () => {
    router.back();
  };

  const isFormValid = selectedMethod !== null;

  const handleMethodSelect = (method: AuthMethod) => {
    setSelectedMethod(method);
  };

  const handleContinue = () => {
    if (selectedMethod === "authenticator") {
      router.push("/app/profile-settings/2fa-setup/qr-code");
    } else if (selectedMethod === "email") {
      router.push("/app/profile-settings/2fa-setup/email-verify");
    }
  };

  return (
    <div className="min-h-screen ">
      <div className=" bg-white p-4 border-b border-gray-300">
        <button
          onClick={handleGoBack}
          className="text-gray-400 text-sm mb-1 hover:text-gray-600 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl mb-2 font-semibold text-gray-900">2FA Setup</h1>
      </div>
      <div className="bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-sm p-6 md:p-8">
          <div className="flex flex-col text-gray-900 mb-6">
            <h1>Choose 2FA method</h1>
          </div>

          <div className="flex flex-col gap-4 text-black mb-50">
            <div className="flex items-center justify-center gap-3 bg-purple-100 rounded-xl border border-gray-300 px-4 py-4">
              <Image
                src="/warning.svg"
                width={24}
                height={24}
                alt="Warning"
                className="text-purple-600"
              />
              <div className="text-sm text-black px-2">
                For security reasons, only one 2FA method can be enabled at a
                time
              </div>
            </div>

            {/* Authenticator App Option */}
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedMethod === "authenticator"
                  ? "border-purple-500 bg-purple-50 shadow-sm"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onClick={() => handleMethodSelect("authenticator")}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-[24px] text-gray-900">
                    Authenticator App
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Use an authenticator app like Google Authenticator or
                    Microsoft Authenticator to generate verification codes.
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedMethod === "authenticator"
                      ? "border-purple-500 bg-purple-500"
                      : "border-gray-400"
                  }`}
                >
                  {selectedMethod === "authenticator" && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Email Verification Option */}
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedMethod === "email"
                  ? "border-purple-500 bg-purple-50 shadow-sm"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onClick={() => handleMethodSelect("email")}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-[24px] text-gray-900">
                    Email Verification
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive verification codes via email to your registered
                    email address.
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedMethod === "email"
                      ? "border-purple-500 bg-purple-500"
                      : "border-gray-400"
                  }`}
                >
                  {selectedMethod === "email" && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Method-specific setup instructions */}
            {selectedMethod === "authenticator" && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Authenticator App Setup
                </h4>
                <p className="text-sm text-blue-800">
                  After continuing, you&apos;ll be guided to scan a QR code with
                  your authenticator app and enter the generated code to verify
                  setup.
                </p>
              </div>
            )}

            {selectedMethod === "email" && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Email Verification Setup
                </h4>
                <p className="text-sm text-blue-800">
                  After continuing, we&apos;ll send a verification code to your
                  email address to complete the setup process.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8">
            <Button
              onClick={handleContinue}
              disabled={!isFormValid}
              className={`w-full text-white px-8 py-6 rounded-lg text-base font-semibold ${
                isFormValid
                  ? "bg-[#5E2A8C] hover:bg-[#4A1F73]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}



