"use client";

import Image from "next/image";
import React, { useState, useRef } from "react";
import { X, Upload } from "lucide-react";

interface UploadImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUpload: (file: File) => void;
  currentImage: string | null;
  userName: string;
}

export default function UploadImageModal({
  isOpen,
  onClose,
  onImageUpload,
}: UploadImageModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onImageUpload(selectedFile);
      onClose();
      resetModal();
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 ">
          <button
            onClick={handleClose}
            className="text-gray-900 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-xl items-center justify-center mr-40 font-semibold text-gray-900">
            Edit Image
          </h2>
        </div>

        <div className="p-6">
          {/* Upload Area */}
          <div className="flex flex-col items-center space-y-6">
            <div
              className={`  p-8 text-center cursor-pointer transition-colors w-64 h-64 flex items-center justify-center ${
                isDragging
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-300 hover:border-purple-400 hover:bg-purple-50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                className="hidden"
              />

              {previewUrl ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-64 h-64 rounded-full overflow-hidden">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-gray-600 max-w-48">
                    Click to choose a different image
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3 px-4">
                  <div className="flex justify-center">
                    <Upload size={40} className="text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-medium text-gray-900 leading-tight">
                      Drop your image here
                    </p>
                    <p className="text-sm text-gray-500 mt-1 leading-tight">
                      or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      JPG, PNG, GIF • Max 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile}
            className="flex-1 px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
