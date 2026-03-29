"use client";
import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import ModalWelcomeOnboard from "@/components/shared/modal-welcome-onboard";
import Stepper from "@/components/features/auth/Stepper";
import { AuthService } from "@/lib/api/v1/auth";

interface FormData {
  companyName: string;
  companySize: string;
  companyIndustry: string;
  headquarterCountry: string;
  businessDescription: string;
}

interface FormErrors {
  companyName?: string;
  companySize?: string;
  companyIndustry?: string;
  headquarterCountry?: string;
  businessDescription?: string;
}

interface DropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  error?: string;
  required?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required = false,
  isOpen,
  onToggle,
}) => {
  return (
    <div className="relative">
      <label className="block mb-2 text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className={`w-full px-4 py-3 text-left bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2A8C] focus:border-[#5E2A8C] transition-all duration-200 ${value ? "text-gray-900" : "text-gray-500"}`}
        >
          {value || placeholder}
          <ChevronDown
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg max-h-60">
            {options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onChange(option);
                  onToggle();
                }}
                className="w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-gray-900"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

const BusinessRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    companySize: "",
    companyIndustry: "",
    headquarterCountry: "",
    businessDescription: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const companySizes = [
    "1-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201-500 employees",
    "501-1000 employees",
    "1000+ employees",
  ];

  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Retail",
    "Manufacturing",
    "Real Estate",
    "Media & Entertainment",
    "Food & Beverage",
    "Transportation",
    "Other",
  ];

  const countries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Germany",
    "France",
    "Australia",
    "Japan",
    "Singapore",
    "Netherlands",
    "Nigeria",
    "South Africa",
    "Other",
  ];

  // Calculate progress based on form completion
  useEffect(() => {
    const storedData = localStorage.getItem("registrationData");
    if (storedData) {
      const data = JSON.parse(storedData);
      console.log("Registration data:", data);
    }

    let completedFields = 0;

    if (formData.companyName.trim()) completedFields++;
    if (formData.companySize) completedFields++;
    if (formData.companyIndustry) completedFields++;
    if (formData.headquarterCountry) completedFields++;
    if (formData.businessDescription.trim()) completedFields++;

    setProgress(Math.max(1, completedFields));
  }, [formData]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.companySize) {
      newErrors.companySize = "Please select company size";
    }

    if (!formData.companyIndustry) {
      newErrors.companyIndustry = "Please select an industry";
    }

    if (!formData.headquarterCountry) {
      newErrors.headquarterCountry = "Please select headquarter country";
    }

    if (!formData.businessDescription.trim()) {
      newErrors.businessDescription = "Business description is required";
    } else if (formData.businessDescription.trim().length < 10) {
      newErrors.businessDescription =
        "Description must be at least 10 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const registrationData = JSON.parse(
        localStorage.getItem("registrationData") || "{}",
      );

      const completeData = {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        businessEmail: registrationData.businessEmail,
        accountType: registrationData.accountType,
        companyName: formData.companyName,
        companySize: formData.companySize,
        companyIndustry: formData.companyIndustry,
        headquarterCountry: formData.headquarterCountry,
        businessDescription: formData.businessDescription,
      };

      // Submit complete registration data using AuthService
      await AuthService.completeRegistration(completeData);

      console.log("Registration completed successfully:", completeData);
      localStorage.removeItem("registrationData");
      setShowWelcomeModal(true);
    } catch (error) {
      console.error("Registration completion failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormValid =
    formData.companyName &&
    formData.companySize &&
    formData.companyIndustry &&
    formData.headquarterCountry &&
    formData.businessDescription;

  return (
    <div className="flex items-center justify-center w-full max-w-md ">
      <div className="w-full space-y-6">
        {/* Progress Indicator - Now Functional */}
        <Stepper currentStep={5} totalSteps={5} />

        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-gray-900 text-3xl md:text-[2.5rem] font-bold mb-2 tracking-[-2%]">
            Add business details
          </h2>
          <p className="text-gray-600 text-[16px] w-[440px]">
            Tell us about your business
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6 text-gray-900">
          {/* Company Name */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Company name
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              placeholder="What's the name of your company"
              className={`w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2A8C] focus:border-[#5E2A8C] transition-all duration-200 ${
                errors.companyName ? "border-red-300" : "border-gray-200"
              }`}
            />
            {errors.companyName && (
              <p className="mt-2 text-sm text-red-600">{errors.companyName}</p>
            )}
          </div>

          {/* Company Size and Industry - Always 2 columns */}
          <div className="grid grid-cols-2 gap-4 text-gray-900">
            <Dropdown
              label="Company size"
              value={formData.companySize}
              onChange={(value) => handleInputChange("companySize", value)}
              options={companySizes}
              placeholder="Select"
              error={errors.companySize}
              required
              isOpen={openDropdown === "companySize"}
              onToggle={() =>
                setOpenDropdown(
                  openDropdown === "companySize" ? null : "companySize",
                )
              }
            />

            <Dropdown
              label="Company industry"
              value={formData.companyIndustry}
              onChange={(value) => handleInputChange("companyIndustry", value)}
              options={industries}
              placeholder="Select your industry"
              error={errors.companyIndustry}
              required
              isOpen={openDropdown === "companyIndustry"}
              onToggle={() =>
                setOpenDropdown(
                  openDropdown === "companyIndustry" ? null : "companyIndustry",
                )
              }
            />
          </div>

          {/* Headquarter Country */}
          <Dropdown
            label="Headquarter country"
            value={formData.headquarterCountry}
            onChange={(value) => handleInputChange("headquarterCountry", value)}
            options={countries}
            placeholder="Where country is your headquarter located?"
            error={errors.headquarterCountry}
            required
            isOpen={openDropdown === "headquarterCountry"}
            onToggle={() =>
              setOpenDropdown(
                openDropdown === "headquarterCountry"
                  ? null
                  : "headquarterCountry",
              )
            }
          />

          {/* Business Description */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              What does your business do?{" "}
            </label>
            <textarea
              value={formData.businessDescription}
              onChange={(e) =>
                handleInputChange("businessDescription", e.target.value)
              }
              placeholder="Describe what your company does"
              rows={4}
              className={`w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2A8C] focus:border-[#5E2A8C] transition-all duration-200 resize-none ${
                errors.businessDescription
                  ? "border-red-300"
                  : "border-gray-200"
              }`}
            />
            {errors.businessDescription && (
              <p className="mt-2 text-sm text-red-600">
                {errors.businessDescription}
              </p>
            )}
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
              isFormValid && !isSubmitting
                ? "bg-[#5E2A8C] hover:bg-[#4E2275] focus:outline-none focus:ring-2 focus:ring-[#5E2A8C] focus:ring-offset-2 transform hover:scale-[1.02]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 pb-4 mb-2 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                Processing...
              </div>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
      {showWelcomeModal && <ModalWelcomeOnboard open={showWelcomeModal} />}
    </div>
  );
};

export default BusinessRegistrationForm;


