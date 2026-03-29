"use client";

import React from "react";
import EmailVerification from "@/components/shared/emailVerificationModal";

interface Step3Props {
  email: string;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3VerifyEmail({
  email,
  onNext,
  onBack,
}: Step3Props) {
  const handleVerify = async (otp: string) => {
    try {
      const response = await fetch("/api/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        return false;
      }

      onNext();
      return true;
    } catch (error) {
      console.error("Verification error:", error);
      return false;
    }
  };

  const handleResend = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Verification code resent!");
  };

  return (
    <div className="w-full">
      <EmailVerification
        email={email}
        onVerify={handleVerify}
        onResend={handleResend}
        onGoBack={onBack}
        resendCooldown={60}
      />
    </div>
  );
}


