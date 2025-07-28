"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  X,
  Link,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  summary?: {
    totalRows: number;
    validRows: number;
    errors: number;
    uploaded: number;
    brokerDetected?: string;
    columnMapping?: Record<string, string>;
  };
  aiInsights?: string;
}

interface ZerodhaState {
  isConnected: boolean;
  isFetching: boolean;
  lastSync?: string;
  connectionError?: string;
}

const expectedColumns = [
  "Date",
  "Script/Symbol",
  "Type (Buy/Sell)",
  "Quantity",
  "Price",
  "Exchange",
  "Product Type",
  "Brokerage/Commission",
  "Trade Number/ID",
  "Trade Time",
  "Optional: ISIN, ETT, GST, STT, SEBI, Stamp Duty",
];

export default function UniversalUploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
  });
  const [zerodhaState, setZerodhaState] = useState<ZerodhaState>({
    isConnected: false,
    isFetching: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [dragActive, setDragActive] = useState(false);

  // Check for Zerodha connection success
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "zerodha_connected") {
      setZerodhaState((prev) => ({ ...prev, isConnected: true }));
    }
  }, [searchParams]);

  // Check Zerodha connection status
  useEffect(() => {
    const checkZerodhaConnection = async () => {
      try {
        const response = await fetch("/api/zerodha/fetch-trades");
        if (response.ok) {
          setZerodhaState((prev) => ({ ...prev, isConnected: true }));
        }
      } catch {
        // Connection not available
      }
    };
    checkZerodhaConnection();
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const fileExtension = file.name.toLowerCase().split(".").pop();
    if (!["csv", "xlsx", "xls"].includes(fileExtension || "")) {
      return "Please upload a CSV, XLSX, or XLS file";
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return "File size must be less than 10MB";
    }

    return null;
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        const error = validateFile(file);
        if (error) {
          setUploadState((prev) => ({ ...prev, error }));
          return;
        }
        setSelectedFile(file);
        setUploadState((prev) => ({ ...prev, error: null }));
      }
    },
    [validateFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const error = validateFile(file);
        if (error) {
          setUploadState((prev) => ({ ...prev, error }));
          return;
        }
        setSelectedFile(file);
        setUploadState((prev) => ({ ...prev, error: null }));
      }
    },
    [validateFile]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false,
    });

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload-trades", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const result = await response.json();

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        success: true,
        summary: result.summary,
        aiInsights: result.aiInsights,
      });

      // Redirect to dashboard after success
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Upload failed",
        success: false,
      });
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
    });
  };

  const connectZerodha = () => {
    window.location.href = "/api/auth/zerodha";
  };

  const fetchZerodhaData = async () => {
    setZerodhaState((prev) => ({ ...prev, isFetching: true }));
    try {
      const response = await fetch("/api/zerodha/fetch-trades");
      if (response.ok) {
        await response.json();
        setZerodhaState((prev) => ({
          ...prev,
          isFetching: false,
          lastSync: new Date().toISOString(),
        }));
        // Handle the fetched data - could redirect to dashboard or show summary
        router.push("/dashboard");
      } else {
        setZerodhaState((prev) => ({
          ...prev,
          isFetching: false,
          connectionError: "Failed to fetch data",
        }));
      }
    } catch {
      setZerodhaState((prev) => ({
        ...prev,
        isFetching: false,
        connectionError: "Network error",
      }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Upload Trade Data</h1>
        <p className="text-muted-foreground">
          Upload your trading data file (CSV, XLSX, or XLS) to analyze your
          performance
        </p>
        <div className="mt-4">
          <a
            href="/sample-trades.csv"
            download
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Download Sample File
          </a>
        </div>
      </div>

      {/* Zerodha Integration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Connect Zerodha Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {zerodhaState.isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Connected to Zerodha</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={fetchZerodhaData}
                  disabled={zerodhaState.isFetching}
                  size="sm"
                >
                  {zerodhaState.isFetching ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Fetch Latest Data
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/broker-connection")}
                >
                  Manage Connection
                </Button>
              </div>
              {zerodhaState.lastSync && (
                <p className="text-sm text-muted-foreground">
                  Last synced:{" "}
                  {new Date(zerodhaState.lastSync).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Zerodha account to automatically import your
                trading data
              </p>
              <Button onClick={connectZerodha} size="sm">
                <Link className="h-4 w-4 mr-2" />
                Connect Zerodha
              </Button>
            </div>
          )}
          {zerodhaState.connectionError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {zerodhaState.connectionError}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Expected Format Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Expected File Format
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Your file should contain the following columns:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {expectedColumns.map((column) => (
              <div key={column} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="font-mono">{column}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> TradePulse automatically detects and maps
              your column headers using AI. Supports CSV, XLSX, and XLS files
              from any broker or platform.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          {!selectedFile ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/25",
                "hover:border-primary/50 hover:bg-primary/5"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Upload Trading File
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your file here, or click to select (CSV, XLSX,
                XLS)
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Select File</span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  disabled={uploadState.isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Upload Progress */}
              {uploadState.isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadState.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={uploadState.isUploading || uploadState.success}
                className="w-full"
              >
                {uploadState.isUploading ? (
                  "Processing..."
                ) : uploadState.success ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Upload Successful
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload and Analyze
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {uploadState.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{uploadState.error}</AlertDescription>
        </Alert>
      )}

      {uploadState.success && (
        <div className="space-y-4">
          <Alert className="border-green-500 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your trade data has been successfully uploaded and processed!
              Redirecting to dashboard...
            </AlertDescription>
          </Alert>

          {uploadState.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Rows:</span>
                    <span className="ml-2 font-medium">
                      {uploadState.summary.totalRows}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valid Trades:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {uploadState.summary.uploaded}
                    </span>
                  </div>
                  {uploadState.summary.errors > 0 && (
                    <div>
                      <span className="text-muted-foreground">Errors:</span>
                      <span className="ml-2 font-medium text-red-600">
                        {uploadState.summary.errors}
                      </span>
                    </div>
                  )}
                  {uploadState.summary.brokerDetected && (
                    <div>
                      <span className="text-muted-foreground">
                        Broker Detected:
                      </span>
                      <span className="ml-2 font-medium capitalize">
                        {uploadState.summary.brokerDetected}
                      </span>
                    </div>
                  )}
                </div>

                {uploadState.aiInsights && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <h4 className="font-medium mb-2">AI Analysis Preview</h4>
                    <p className="text-sm text-muted-foreground">
                      {uploadState.aiInsights.substring(0, 200)}...
                    </p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm"
                      onClick={() => router.push("/chat")}
                    >
                      View Full Analysis →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
