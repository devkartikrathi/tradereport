"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ImportDataButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    results?: Record<
      string,
      { imported?: number; total?: number; error?: string }
    >;
  } | null>(null);

  const handleImport = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/broker/import-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ importType: "all" }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          results: data.results,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to import data",
        });
      }
    } catch {
      setResult({
        success: false,
        message: "Network error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleImport}
        disabled={isLoading}
      >
        <RefreshCw
          className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
        />
        {isLoading ? "Importing..." : "Import Data"}
      </Button>

      {result && (
        <Alert
          className={
            result.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={result.success ? "text-green-800" : "text-red-800"}
          >
            {result.message}
            {result.results && (
              <div className="mt-2 text-sm">
                {result.results.trades && (
                  <div>Trades: {result.results.trades.imported} imported</div>
                )}
                {result.results.positions && (
                  <div>
                    Positions: {result.results.positions.imported} imported
                  </div>
                )}
                {result.results.holdings && (
                  <div>
                    Holdings: {result.results.holdings.imported} imported
                  </div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
