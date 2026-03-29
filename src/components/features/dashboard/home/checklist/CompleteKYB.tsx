"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import Dropdown from "@/components/ui/dropdown";
import FileUpload from "@/components/ui/file-upload";

interface KybFormData {
  businessRegistrationType: string;
  businessRegistrationNo: string;
  incorporationCertificate: File | null;
  memorandumArticle: File | null;
  formC02C07: File | null;
}

const businessRegistrationTypes = [
  "Limited Liability Company (LLC)",
  "Corporation",
  "Partnership",
  "Sole Proprietorship",
  "Limited Partnership (LP)",
  "Limited Liability Partnership (LLP)",
  "S Corporation",
  "Non-Profit Corporation",
  "Professional Corporation",
  "Other",
];

export default function CompleteKYBPage() {
  const [formData, setFormData] = useState<KybFormData>({
    businessRegistrationType: "",
    businessRegistrationNo: "",
    incorporationCertificate: null,
    memorandumArticle: null,
    formC02C07: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof KybFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (field: keyof KybFormData, file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append("registrationType", formData.businessRegistrationType);
      submitData.append("registrationNo", formData.businessRegistrationNo);

      if (formData.incorporationCertificate) {
        submitData.append(
          "incorporationCertificate",
          formData.incorporationCertificate,
        );
      }
      if (formData.memorandumArticle) {
        submitData.append("memorandumArticle", formData.memorandumArticle);
      }
      if (formData.formC02C07) {
        submitData.append("formC02C07", formData.formC02C07);
      }

      const response = await fetch("/api/v1/kyb/submit", {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message);
        return;
      }

      // TODO: Handle success (show confirmation, update checklist state)
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md dark:bg-gray-900"
    >
      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {error && (
          <motion.div
            variants={itemVariants}
            className="bg-red-50 text-red-600 p-3 rounded-lg text-sm dark:bg-red-900/20 dark:text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Business Registration Type */}
        <motion.div variants={itemVariants}>
          <Dropdown
            label="Business registration type"
            options={businessRegistrationTypes}
            value={formData.businessRegistrationType}
            onChange={(value) =>
              handleInputChange("businessRegistrationType", value)
            }
            placeholder="--"
          />
        </motion.div>

        {/* Business Registration Number */}
        <motion.div variants={itemVariants}>
          <InputField
            id="businessRegistrationNo"
            label="Enter business registration No."
            type="text"
            placeholder="--"
            value={formData.businessRegistrationNo}
            onChange={(e) =>
              handleInputChange("businessRegistrationNo", e.target.value)
            }
          />
        </motion.div>

        {/* File Uploads */}
        <motion.div variants={itemVariants}>
          <FileUpload
            key="incorporation-certificate"
            label="Upload Incorporation Certificate"
            onFileSelect={(file) =>
              handleFileSelect("incorporationCertificate", file)
            }
            file={formData.incorporationCertificate}
            accept=".svg,.png,.jpg,.jpeg,.gif,.pdf"
            maxSize={5}
            isUploading={isSubmitting}
            uploadProgress={0}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <FileUpload
            key="memorandum-article"
            label="Memorandum & Article of Association"
            onFileSelect={(file) => handleFileSelect("memorandumArticle", file)}
            file={formData.memorandumArticle}
            accept=".svg,.png,.jpg,.jpeg,.gif,.pdf"
            maxSize={5}
            isUploading={isSubmitting}
            uploadProgress={0}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <FileUpload
            key="form-c02-c07"
            label="Form C02/C07"
            onFileSelect={(file) => handleFileSelect("formC02C07", file)}
            file={formData.formC02C07}
            accept=".svg,.png,.jpg,.jpeg,.gif,.pdf"
            maxSize={5}
            isUploading={isSubmitting}
            uploadProgress={0}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div variants={itemVariants} className="pt-4">
          <Button
            type="submit"
            variant="default"
            size="lg"
            disabled={isSubmitting}
            className="w-full bg-[#5E2A8C] py-6 lg:h-[56px] mt-4 hover:bg-[#4A1F6F] text-white rounded-[12px] transition-colors"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
}


