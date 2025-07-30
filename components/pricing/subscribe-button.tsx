"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Shield } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Plan } from "@prisma/client";

interface SubscribeButtonProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  isSignedIn?: boolean;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export default function SubscribeButton({
  plan,
  isCurrentPlan = false,
  isSignedIn = false,
  variant = "default",
  size = "default",
  className = ""
}: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const getBillingText = (cycle: string) => {
    switch (cycle) {
      case "monthly": return "month";
      case "quarterly": return "quarter";
      case "yearly": return "year";
      default: return cycle;
    }
  };

  const handleSubscribe = async () => {
    if (isLoading || isCurrentPlan) return;

    setIsLoading(true);
    try {
      if (!isSignedIn) {
        // Redirect to sign up
        window.location.href = "/sign-up";
        return;
      }

      if (isCurrentPlan) {
        return;
      }

      // Show confirmation dialog for signed-in users
      setShowDialog(true);
    } catch (error) {
      console.error("Error handling subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSubscription = async () => {
    setIsLoading(true);
    try {
      // Call payment checkout API
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          amount: plan.price,
          currency: plan.currency,
          metadata: {
            planName: plan.name,
            billingCycle: plan.billingCycle,
          }
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Payment initiation failed");
      }

      // Redirect to payment URL
      if (result.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl;
      } else {
        throw new Error("Payment URL not received");
      }

      setShowDialog(false);
    } catch (error) {
      console.error("Error confirming subscription:", error);
      // Show error message to user
      alert(`Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isCurrentPlan) return "Current Plan";
    if (!isSignedIn) return "Get Started";
    return "Subscribe Now";
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) return "outline" as const;
    return variant;
  };

  return (
    <>
      <Button
        className={className}
        variant={getButtonVariant()}
        size={size}
        disabled={isCurrentPlan || isLoading}
        onClick={handleSubscribe}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          getButtonText()
        )}
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Confirm Subscription</span>
            </DialogTitle>
                         <DialogDescription>
               You&apos;re about to subscribe to the {plan.name} plan.
             </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Plan Details */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{plan.name}</h3>
                <Badge variant="secondary">{plan.billingCycle}</Badge>
              </div>
              <div className="text-2xl font-bold mb-2">
                {formatCurrency(plan.price)}/{getBillingText(plan.billingCycle)}
              </div>
              {plan.description && (
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              )}
            </div>

            {/* Features Preview */}
            <div className="space-y-2">
              <h4 className="font-medium">Plan Features:</h4>
              <div className="space-y-1">
                {plan.features.slice(0, 5).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
                {plan.features.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    +{plan.features.length - 5} more features
                  </p>
                )}
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-start space-x-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <Shield className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Secure Payment
                </p>
                <p className="text-green-700 dark:text-green-300">
                  Your payment information is encrypted and secure.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSubscription}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Subscribe</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 