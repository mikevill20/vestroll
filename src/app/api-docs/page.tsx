"use client";

import React from "react";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Define props for SwaggerUI
interface SwaggerUIProps {
  url: string;
}

// Use dynamic import to avoid SSR issues with swagger-ui-react
const SwaggerUI = dynamic<SwaggerUIProps>(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      Loading API Documentation...
    </div>
  ),
});

export default function ApiDocsPage() {
  return (
    <div className="bg-white min-h-screen">
      <SwaggerUI url="/api/v1/docs" />
    </div>
  );
}

