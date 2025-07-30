"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, CreditCard, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentStatus {
  orderId: string;
  status: "pending" | "processing" | "success" | "failed" | "cancelled" | "redirecting";
  amount: number;
  currency: string;
  planId: string;
  planName?: string;
  message?: string;
  paymentUrl?: string;
}

export default function PaymentProcessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided");
      setIsLoading(false);
      return;
    }

    // Get payment status and handle redirection
    const processPayment = async () => {
      try {
        // Fetch payment status from API
        const response = await fetch(`/api/payments/${orderId}/status`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch payment status");
        }

        const paymentData = await response.json();
        
        if (paymentData.paymentUrl && paymentData.status === "PENDING") {
          // Payment needs redirection to PhonePe
          setPaymentStatus({
            orderId,
            status: "redirecting",
            amount: paymentData.amount,
            currency: paymentData.currency,
            planId: paymentData.planId,
            planName: paymentData.planName,
            paymentUrl: paymentData.paymentUrl,
            message: "Redirecting to PhonePe for secure payment..."
          });
          
          // Redirect to PhonePe after a short delay
          setTimeout(() => {
            setRedirecting(true);
            window.location.href = paymentData.paymentUrl;
          }, 2000);
        } else {
          // Payment already processed
          setPaymentStatus({
            orderId,
            status: paymentData.status.toLowerCase(),
            amount: paymentData.amount,
            currency: paymentData.currency,
            planId: paymentData.planId,
            planName: paymentData.planName,
            message: paymentData.message || "Payment processed"
          });
        }
      } catch {
        setError("Payment processing failed");
      } finally {
        setIsLoading(false);
      }
    };

    processPayment();
  }, [orderId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-8 w-8 text-yellow-500" />;
      case "processing":
        return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />;
      case "redirecting":
        return <ExternalLink className="h-8 w-8 text-blue-500" />;
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <CreditCard className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "redirecting":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Payment Pending";
      case "processing":
        return "Processing Payment";
      case "redirecting":
        return "Redirecting to PhonePe";
      case "success":
        return "Payment Successful";
      case "failed":
        return "Payment Failed";
      case "cancelled":
        return "Payment Cancelled";
      default:
        return "Unknown Status";
    }
  };

  const handleManualRedirect = () => {
    if (paymentStatus?.paymentUrl) {
      setRedirecting(true);
      window.location.href = paymentStatus.paymentUrl;
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <ExternalLink className="h-12 w-12 text-blue-500 animate-pulse mx-auto" />
              <h2 className="text-xl font-semibold">Redirecting to PhonePe</h2>
              <p className="text-muted-foreground">
                You are being redirected to PhonePe for secure payment processing...
              </p>
              <div className="text-sm text-muted-foreground">
                If you are not redirected automatically, please click the button below.
              </div>
              <Button onClick={handleManualRedirect} className="w-full">
                Continue to PhonePe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <h2 className="text-xl font-semibold">Processing Payment</h2>
              <p className="text-muted-foreground">
                Please wait while we process your payment...
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
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-red-600">Payment Error</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-red-600">Payment Not Found</h2>
              <p className="text-muted-foreground">
                Unable to find payment information for this order.
              </p>
              <Button onClick={() => window.history.back()}>
                Go Back
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
            {getStatusIcon(paymentStatus.status)}
          </div>
          <CardTitle className="text-2xl font-bold">
            {getStatusText(paymentStatus.status)}
          </CardTitle>
          <Badge className={`mt-2 ${getStatusColor(paymentStatus.status)}`}>
            {paymentStatus.status.toUpperCase()}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentStatus.message && (
            <p className="text-center text-muted-foreground">
              {paymentStatus.message}
            </p>
          )}

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Order ID:</span>
              <span className="text-sm font-mono">{paymentStatus.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="text-sm font-semibold">
                {formatCurrency(paymentStatus.amount)} {paymentStatus.currency}
              </span>
            </div>
            {paymentStatus.planName && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Plan:</span>
                <span className="text-sm font-semibold">{paymentStatus.planName}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            {paymentStatus.status === "redirecting" && paymentStatus.paymentUrl ? (
              <Button 
                className="flex-1" 
                onClick={handleManualRedirect}
              >
                Continue to PhonePe
              </Button>
            ) : paymentStatus.status === "success" ? (
              <Button 
                className="flex-1" 
                onClick={() => window.location.href = "/dashboard"}
              >
                Go to Dashboard
              </Button>
            ) : paymentStatus.status === "failed" || paymentStatus.status === "cancelled" ? (
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => window.location.href = "/pricing"}
              >
                Try Again
              </Button>
            ) : (
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => window.location.href = "/dashboard"}
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 