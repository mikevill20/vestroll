"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Stepper from "./Stepper";
import Step1BasicInfo from "@/components/features/auth/register-steps/Step1BasicInfo";
import Step2Password from "@/components/features/auth/register-steps/Step2Password";
import Step3VerifyEmail from "@/components/features/auth/register-steps/Step3VerifyEmail";
import Step4AccountType from "@/components/features/auth/register-steps/Step4AccountType";
import Step5BusinessDetails from "@/components/features/auth/register-steps/Step5BusinessDetails";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import ModalWelcomeOnboard from "@/components/shared/modal-welcome-onboard";

export type RegistrationFormData = {
  firstName: string;
  lastName: string;
  businessEmail: string;
  agreement: boolean;
  password?: string;
  accountType?: string;
  companyName?: string;
  companySize?: string;
  companyIndustry?: string;
  headquarterCountry?: string;
  businessDescription?: string;
};

export default function RegistrationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { toasts, removeToast, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: "",
    lastName: "",
    businessEmail: "",
    agreement: false,
  });

  const updateFormData = (data: Partial<RegistrationFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleStep1Submit = () => {
    nextStep();
  };

  const handleStep2Submit = (password: string) => {
    updateFormData({ password });
    nextStep();
  };

  const handleStep4Submit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        showError(result.message || "Registration failed");
        return;
      }

      // Success - Registration initiated, OTP sent
      nextStep();
    } catch (err) {
      showError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    setShowSuccessModal(true);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1BasicInfo
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleStep1Submit}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <Step2Password
            onNext={handleStep2Submit}
            onBack={prevStep}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <Step4AccountType
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <Step5BusinessDetails
            formData={formData}
            updateFormData={updateFormData}
            onBack={prevStep}
            onComplete={handleStep4Submit}
            isLoading={isLoading}
          />
        );
      case 5:
        return (
          <Step3VerifyEmail
            email={formData.businessEmail}
            onNext={handleComplete}
            onBack={prevStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="w-full mb-8">
        <Stepper totalSteps={5} currentStep={step} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
      {showSuccessModal && <ModalWelcomeOnboard open={showSuccessModal} />}
    </div>
  );
}


