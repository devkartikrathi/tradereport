"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Plan } from "@prisma/client";

interface PlanCardProps {
  plan: Plan;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  isSignedIn?: boolean;
  onSubscribe?: (planId: string) => void;
  onUpgrade?: (planId: string) => void;
}

export default function PlanCard({
  plan,
  isPopular = false,
  isCurrentPlan = false,
  isSignedIn = false,
  onSubscribe,
  onUpgrade
}: PlanCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getBillingText = (cycle: string) => {
    switch (cycle) {
      case "monthly": return "month";
      case "quarterly": return "quarter";
      case "yearly": return "year";
      default: return cycle;
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("basic") || name.includes("starter")) return <Zap className="h-5 w-5" />;
    if (name.includes("premium") || name.includes("pro")) return <Crown className="h-5 w-5" />;
    return <Star className="h-5 w-5" />;
  };

  const handleAction = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isCurrentPlan) {
        // Already subscribed to this plan
        return;
      }

      if (isSignedIn) {
        if (onUpgrade) {
          onUpgrade(plan.id);
        } else if (onSubscribe) {
          onSubscribe(plan.id);
        }
      } else {
        // Redirect to sign up
        window.location.href = "/sign-up";
      }
    } catch (error) {
      console.error("Error handling plan action:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionButtonText = () => {
    if (isCurrentPlan) return "Current Plan";
    if (!isSignedIn) return "Get Started";
    return "Subscribe Now";
  };

  const getActionButtonVariant = () => {
    if (isCurrentPlan) return "outline" as const;
    if (isPopular) return "default" as const;
    return "outline" as const;
  };

  return (
    <Card 
      className={`relative transition-all duration-300 hover:shadow-lg ${
        isPopular 
          ? 'border-primary shadow-lg scale-105 ring-2 ring-primary/20' 
          : 'border-border hover:border-primary/50'
      } ${
        isCurrentPlan 
          ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' 
          : ''
      }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-lg">
            <Star className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4 z-10">
          <Badge className="bg-green-500 text-white px-3 py-1 shadow-lg">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4 pt-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            {getPlanIcon(plan.name)}
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
          <span className="text-muted-foreground">/{getBillingText(plan.billingCycle)}</span>
        </div>
        {plan.description && (
          <p className="text-muted-foreground mt-2 text-sm">{plan.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {plan.features.map((feature: string, index: number) => (
            <div key={index} className="flex items-start space-x-3">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <Button 
            className="w-full" 
            size="lg"
            variant={getActionButtonVariant()}
            disabled={isCurrentPlan || isLoading}
            onClick={handleAction}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              getActionButtonText()
            )}
          </Button>
        </div>

        {/* Additional Info */}
        {plan.maxUsers && (
          <p className="text-xs text-muted-foreground text-center">
            Up to {plan.maxUsers} users
          </p>
        )}
      </CardContent>
    </Card>
  );
} 