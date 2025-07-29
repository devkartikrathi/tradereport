"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ZerodhaCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = () => {
      // Get all query parameters
      const params = new URLSearchParams();
      searchParams.forEach((value, key) => {
        params.append(key, value);
      });

      // Redirect directly to the API endpoint - it will handle the redirect logic
      window.location.href = `/api/auth/zerodha/callback?${params.toString()}`;
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Processing Zerodha Connection</h2>
        <p className="text-gray-600">Please wait while we complete your authentication...</p>
      </div>
    </div>
  );
} 