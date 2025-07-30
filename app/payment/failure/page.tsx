"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XCircle, RefreshCw, HelpCircle, Mail, Phone } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentFailureData {
  orderId: string;
  amount: number;
  currency: string;
  planName: string;
  errorCode?: string;
  errorMessage?: string;
  retryUrl?: string;
}

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [failureData, setFailureData] = useState<PaymentFailureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFailureData = async () => {
      try {
        if (!orderId) {
          setError("No order ID provided");
          setIsLoading(false);
          return;
        }

        // Fetch payment failure data
        const response = await fetch(`/api/payments/${orderId}/failure`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch payment failure data");
        }

        const data = await response.json();
        setFailureData(data);
      } catch {
        setError("Failed to load payment failure data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFailureData();
  }, [orderId]);

  const handleRetry = () => {
    if (failureData?.retryUrl) {
      window.location.href = failureData.retryUrl;
    } else {
      window.location.href = "/pricing";
    }
  };

  const getErrorMessage = (errorCode?: string) => {
    switch (errorCode) {
      case "PAYMENT_DECLINED":
        return "Your payment was declined by your bank. Please check your card details and try again.";
      case "INSUFFICIENT_FUNDS":
        return "Insufficient funds in your account. Please ensure you have enough balance.";
      case "CARD_EXPIRED":
        return "Your card has expired. Please update your payment method.";
      case "INVALID_CARD":
        return "Invalid card details. Please check your card information.";
      case "NETWORK_ERROR":
        return "Network error occurred. Please check your internet connection and try again.";
      case "TIMEOUT":
        return "Payment request timed out. Please try again.";
      default:
        return "Payment failed. Please try again or contact support if the problem persists.";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-red-200 dark:from-red-950 dark:via-red-900 dark:to-red-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <h2 className="text-xl font-semibold">Loading Payment Details</h2>
              <p className="text-muted-foreground">
                Please wait while we load your payment details...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-red-200 dark:from-red-950 dark:via-red-900 dark:to-red-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-600">Payment Error</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => window.location.href = "/dashboard"}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!failureData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-red-200 dark:from-red-950 dark:via-red-900 dark:to-red-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-600">Payment Failed</h2>
              <p className="text-muted-foreground">
                Your payment failed, but we couldn&apos;t load the details.
              </p>
              <Button onClick={() => window.location.href = "/pricing"}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-red-200 dark:from-red-950 dark:via-red-900 dark:to-red-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-red-700">
            Payment Failed
          </CardTitle>
          <Badge className="mt-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            PAYMENT FAILED
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">
              We&apos;re sorry, but your payment for {failureData.planName} could not be processed.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Order ID:</span>
                <span className="text-sm font-mono">{failureData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(failureData.amount)} {failureData.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Plan:</span>
                <span className="text-sm font-semibold">{failureData.planName}</span>
              </div>
              {failureData.errorCode && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Error Code:</span>
                  <span className="text-sm font-mono text-red-600">{failureData.errorCode}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-700 mb-2">What happened?</h3>
              <p className="text-sm text-muted-foreground">
                {failureData.errorMessage || getErrorMessage(failureData.errorCode)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={handleRetry}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = "/pricing"}
            >
              Choose Different Plan
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Need Help?</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Check our FAQ</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Mail className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Email Support</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Phone className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Call Support</span>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Don&apos;t worry, your card has not been charged.</p>
            <p>If you continue to have issues, please contact our support team.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 