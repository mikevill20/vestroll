"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import InputField from "@/components/ui/input-field";
import { Copy } from "lucide-react";

export default function QRScanPage() {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState("");

  const handleGoBack = () => {
    router.back();
  };

  const handleContinue = () => {
    console.log("Verifying code:", verificationCode);
  };

  const handleCopyKey = () => {
    const setupKey = "VEST-ROLL-2FA-SETUP-KEY-EXAMPLE";
    navigator.clipboard
      .writeText(setupKey)
      .then(() => {
        console.log("Setup key copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const handlePrev = () => {
    router.push("/2fa");
  };

  const handleNext = () => {
    if (verificationCode) {
      handleContinue();
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-white p-4 border-b border-gray-300">
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
          <div className="flex flex-col mb-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Scan QR Code
            </h2>
          </div>

          <div className="flex flex-col items-center text-center ">
            <p className="text-gray-900">
              Scan this QR code with your authenticator
            </p>
            <p className="text-gray-900 mb-6">
              app to link it to your VestRoll account
            </p>

            {/* QR Code Placeholder */}
            <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="text-gray-400 mb-2">QR Code Placeholder</div>
                <div className="text-xs text-gray-500">
                  (In a real app, this would display a generated QR code)
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Or manually enter this key in your authenticator app
            </p>
          </div>

          {/* Manual Key Input with Copy Button */}
          <div className="mb-6">
            <div className="relative">
              <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                <span className="text-gray-700 font-mono flex-1">
                  VEST-ROLL-2FA-SETUP-KEY-EXAMPLE
                </span>
                <button
                  onClick={handleCopyKey}
                  className="flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <Copy width={16} height={16} className="text-purple-600" />
                  <span className="text-sm font-medium">Copy</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {/* Warning Message */}
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border rounded-lg">
              <Image
                src="/warning.svg"
                width={20}
                height={20}
                alt="Warning"
                className="text-yellow-600 mt-0.5"
              />
              <div className="text-sm text-yellow-800">
                <p className="font-medium text-black">
                  Don&pos;t have an authenticator app?
                </p>
                <span className="text-gray-700">
                  You can download one from the App Store or Google Play on your
                  mobile device. Some compatible apps include Google
                  Authenticator, Microsoft Authenticator, Authy, and more.
                </span>
              </div>
            </div>
          </div>

          {/* Prev/Next Buttons */}
          <div className="flex gap-4 mt-8">
            <Button
              onClick={handlePrev}
              variant="outline"
              className="flex-1 border-[#17171C] text-gray-700  py-6 text-base font-semibold"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 text-white px-8 py-6 rounded-lg text-base font-semibold bg-[#5E2A8C] cursor-not-allowed"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
