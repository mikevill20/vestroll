"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function EmailVerificationPage() {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState<string[]>(
    new Array(6).fill("")
  );

  const handleGoBack = () => {
    router.back();
  };

  const handleSendCode = () => {
    console.log("Verification code sent to email");
  };

  const handleVerifyCode = () => {
    const fullCode = verificationCode.join("");
    console.log("Verifying email code:", fullCode);
  };

  const handleInputChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "");

    if (digit.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = digit;
      setVerificationCode(newCode);

      if (digit && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }

    // Handle delete
    if (e.key === "Delete" && verificationCode[index] && index < 5) {
      const newCode = [...verificationCode];
      newCode[index] = "";
      setVerificationCode(newCode);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedData.length > 0) {
      const newCode = [...verificationCode];
      for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
        newCode[i] = pastedData[i];
      }
      setVerificationCode(newCode);

      // Focus the next empty input or the last one
      const nextIndex = Math.min(pastedData.length, 5);
      const nextInput = document.getElementById(`otp-${nextIndex}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const isFormValid = verificationCode.every((digit) => digit !== "");

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
          <div className="flex flex-col mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Verify code
            </h2>
            <p className="text-gray-600 mb-2">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <div className="space">
            {/* 6-digit OTP input area */}
            <div className="mb-6 text-gray-900">
              <p className="text-xs">OTP</p>
              <div className="flex  gap-4 mb-4">
                {verificationCode.map((digit, index) => (
                  <div key={index} className="relative">
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className="w-15 h-15 text-center text-xl font-semibold border bg-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      id={`otp-${index}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerifyCode}
              disabled={!isFormValid}
              className={`w-full text-white px-8 py-6 rounded-lg text-base font-semibold mb-4 ${
                isFormValid
                  ? "bg-[#5E2A8C] hover:bg-[#4A1F73]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Verify
            </Button>

            {/* Go Back Button */}
            <div className="flex justify-center">
              <button
                onClick={handleGoBack}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
