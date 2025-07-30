"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentReturnStatus {
  success: boolean;
  message: string;
  payment?: {
    orderId: string;
    amount: number;
    currency: string;
    status: string;
    transactionId?: string;
    planName?: string;
  };
}

export default function PaymentReturnPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentReturnStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPaymentReturn = async () => {
      try {
        // Extract payment return parameters from URL
        const returnParams = {
          merchantId: searchParams.get("merchantId"),
          merchantTransactionId: searchParams.get("merchantTransactionId"),
          transactionId: searchParams.get("transactionId"),
          amount: searchParams.get("amount"),
          status: searchParams.get("status"),
          responseCode: searchParams.get("responseCode"),
          responseMessage: searchParams.get("responseMessage"),
          signature: searchParams.get("signature"),
        };

        // Validate required parameters
        if (!returnParams.merchantTransactionId || !returnParams.status) {
          setError("Invalid payment return parameters");
          setIsLoading(false);
          return;
        }

        // Send payment return data to API for processing
        const response = await fetch("/api/payments/return", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(returnParams),
        });

        if (!response.ok) {
          throw new Error("Failed to process payment return");
        }

        const result = await response.json();
        setStatus(result);
      } catch {
        setError("Failed to process payment return");
      } finally {
        setIsLoading(false);
      }
    };

    processPaymentReturn();
  }, [searchParams]);

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />;
    } else {
      return <XCircle className="h-12 w-12 text-red-500 mx-auto" />;
    }
  };

  const getStatusColor = (success: boolean) => {
    if (success) {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    } else {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <h2 className="text-xl font-semibold">Processing Payment Return</h2>
              <p className="text-muted-foreground">
                Please wait while we process your payment return...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-red-600">Payment Return Error</h2>
              <p className="text-muted-foreground">{error}</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.href = "/dashboard"}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = "/pricing"}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
              <h2 className="text-xl font-semibold text-yellow-600">Payment Return Not Found</h2>
              <p className="text-muted-foreground">
                Unable to process payment return information.
              </p>
              <Button onClick={() => window.location.href = "/dashboard"}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon(status.success)}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status.success ? "Payment Successful" : "Payment Failed"}
          </CardTitle>
          <Badge className={`mt-2 ${getStatusColor(status.success)}`}>
            {status.success ? "SUCCESS" : "FAILED"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {status.message}
          </p>

          {status.payment && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Order ID:</span>
                <span className="text-sm font-mono">{status.payment.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(status.payment.amount)} {status.payment.currency}
                </span>
              </div>
              {status.payment.transactionId && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transaction ID:</span>
                  <span className="text-sm font-mono">{status.payment.transactionId}</span>
                </div>
              )}
              {status.payment.planName && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Plan:</span>
                  <span className="text-sm font-semibold">{status.payment.planName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-semibold">{status.payment.status}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            {status.success ? (
              <Button 
                className="flex-1" 
                onClick={() => window.location.href = "/dashboard"}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  className="flex-1" 
                  variant="outline"
                  onClick={() => window.location.href = "/pricing"}
                >
                  Try Again
                </Button>
                <Button 
                  className="flex-1" 
                  variant="outline"
                  onClick={() => window.location.href = "/dashboard"}
                >
                  Go to Dashboard
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 