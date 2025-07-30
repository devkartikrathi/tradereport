"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Zap, Shield, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentSuccessData {
  orderId: string;
  amount: number;
  currency: string;
  planName: string;
  planFeatures: string[];
  transactionId?: string;
  subscriptionStatus: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [successData, setSuccessData] = useState<PaymentSuccessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuccessData = async () => {
      try {
        if (!orderId) {
          setError("No order ID provided");
          setIsLoading(false);
          return;
        }

        // Fetch payment success data
        const response = await fetch(`/api/payments/${orderId}/success`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch payment success data");
        }

        const data = await response.json();
        setSuccessData(data);
      } catch {
        setError("Failed to load payment success data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuccessData();
  }, [orderId]);

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case "analytics":
        return <Zap className="h-4 w-4" />;
      case "coaching":
        return <Star className="h-4 w-4" />;
      case "security":
        return <Shield className="h-4 w-4" />;
      case "support":
        return <Users className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-green-950 dark:via-green-900 dark:to-green-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <h2 className="text-xl font-semibold">Activating Your Subscription</h2>
              <p className="text-muted-foreground">
                Please wait while we activate your subscription...
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
                <CheckCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-600">Activation Error</h2>
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

  if (!successData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 dark:from-yellow-950 dark:via-yellow-900 dark:to-yellow-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-yellow-600">Payment Success</h2>
              <p className="text-muted-foreground">
                Your payment was successful, but we couldn&apos;t load the details.
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-green-950 dark:via-green-900 dark:to-green-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-green-700">
            Payment Successful!
          </CardTitle>
          <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            SUBSCRIPTION ACTIVE
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">
              Welcome to {successData.planName}! Your subscription is now active.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Order ID:</span>
                <span className="text-sm font-mono">{successData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(successData.amount)} {successData.currency}
                </span>
              </div>
              {successData.transactionId && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transaction ID:</span>
                  <span className="text-sm font-mono">{successData.transactionId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-semibold text-green-600">
                  {successData.subscriptionStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Your Plan Features</h3>
            <div className="grid grid-cols-1 gap-3">
              {successData.planFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  {getFeatureIcon(feature)}
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = "/dashboard"}
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = "/analytics"}
            >
              View Analytics
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>You can now access all premium features.</p>
            <p>Need help? Contact our support team.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 