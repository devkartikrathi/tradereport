"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Star, Zap, Shield, Target, BarChart3, Brain, TrendingUp, Crown, ArrowRight } from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";

interface UpgradeFlowProps {
  currentPlan?: string;
  targetPlan?: string;
  onUpgrade?: (planId: string) => void;
  onCancel?: () => void;
  showCurrentPlan?: boolean;
  className?: string;
}

interface PlanComparisonProps {
  currentPlan?: string;
  onUpgrade?: (planId: string) => void;
  className?: string;
}

interface UpgradeBenefitsProps {
  planId: string;
  onUpgrade?: (planId: string) => void;
  className?: string;
}

const PLANS = {
  basic: {
    id: "basic",
    name: "Basic",
    price: 9,
    yearlyPrice: 87,
    description: "Essential features for beginners",
    features: [
      "Basic analytics",
      "Trade tracking",
      "Basic reports",
      "Email support"
    ],
    icon: <BarChart3 className="h-6 w-6" />
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 29,
    yearlyPrice: 279,
    description: "Advanced features for serious traders",
    features: [
      "All Basic features",
      "AI coaching",
      "Behavioral analysis",
      "Risk management",
      "Priority support"
    ],
    icon: <Brain className="h-6 w-6" />,
    popular: true
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    yearlyPrice: 949,
    description: "Complete solution for professionals",
    features: [
      "All Pro features",
      "Live monitoring",
      "Advanced validation",
      "Priority support",
      "Custom integrations"
    ],
    icon: <Crown className="h-6 w-6" />
  }
};

const FEATURE_COMPARISON = {
  ai_coaching: {
    name: "AI Coaching",
    description: "Personalized AI trading insights",
    basic: false,
    pro: true,
    enterprise: true
  },
  behavioral_analysis: {
    name: "Behavioral Analysis",
    description: "Trading psychology insights",
    basic: false,
    pro: true,
    enterprise: true
  },
  risk_management: {
    name: "Risk Management",
    description: "Comprehensive risk assessment",
    basic: false,
    pro: true,
    enterprise: true
  },
  performance_goals: {
    name: "Performance Goals",
    description: "Goal tracking and analytics",
    basic: false,
    pro: true,
    enterprise: true
  },
  live_monitoring: {
    name: "Live Monitoring",
    description: "Real-time portfolio tracking",
    basic: false,
    pro: false,
    enterprise: true
  },
  trade_validator: {
    name: "Trade Validator",
    description: "Advanced trade validation",
    basic: false,
    pro: false,
    enterprise: true
  },
  basic_analytics: {
    name: "Basic Analytics",
    description: "Fundamental trading insights",
    basic: true,
    pro: true,
    enterprise: true
  },
  trade_tracking: {
    name: "Trade Tracking",
    description: "Track your trading history",
    basic: true,
    pro: true,
    enterprise: true
  },
  email_support: {
    name: "Email Support",
    description: "Basic email support",
    basic: true,
    pro: true,
    enterprise: true
  },
  priority_support: {
    name: "Priority Support",
    description: "Priority customer support",
    basic: false,
    pro: true,
    enterprise: true
  }
};

export function UpgradeFlow({ 
  currentPlan, 
  targetPlan, 
  onUpgrade, 
  onCancel, 
  showCurrentPlan = true,
  className = "" 
}: UpgradeFlowProps) {
  const { userId } = useAuth();
  const { subscriptionStatus } = useSubscriptionStatus();
  const [selectedPlan, setSelectedPlan] = useState(targetPlan || "pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleUpgrade = async () => {
    if (!userId) return;
    
    setIsUpgrading(true);
    try {
      if (onUpgrade) {
        onUpgrade(selectedPlan);
      } else {
        // Default upgrade flow
        const plan = PLANS[selectedPlan as keyof typeof PLANS];
        if (plan) {
          const response = await fetch("/api/payments/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              planId: plan.id,
              billingCycle,
              userId
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.paymentUrl) {
              window.location.href = data.paymentUrl;
            } else {
              window.location.href = "/pricing";
            }
          } else {
            window.location.href = "/pricing";
          }
        }
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      window.location.href = "/pricing";
    } finally {
      setIsUpgrading(false);
    }
  };

  const getCurrentPlanData = () => {
    if (!currentPlan) return null;
    return PLANS[currentPlan as keyof typeof PLANS] || null;
  };

  const currentPlanData = getCurrentPlanData();

  return (
    <div className={`space-y-6 ${className}`}>
      {showCurrentPlan && currentPlanData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              Current Plan: {currentPlanData.name}
            </CardTitle>
            <CardDescription>
              You're currently on the {currentPlanData.name} plan
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">
          Select the plan that best fits your trading needs
        </p>
      </div>

      <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly (Save 20%)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(PLANS).map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative cursor-pointer transition-all ${
                  selectedPlan === plan.id 
                    ? "border-blue-500 ring-2 ring-blue-200" 
                    : "hover:border-gray-300"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      {plan.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">${plan.price}<span className="text-sm font-normal">/month</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="yearly" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(PLANS).map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative cursor-pointer transition-all ${
                  selectedPlan === plan.id 
                    ? "border-blue-500 ring-2 ring-blue-200" 
                    : "hover:border-gray-300"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      {plan.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">${plan.yearlyPrice}<span className="text-sm font-normal">/year</span></div>
                  <div className="text-sm text-green-600">Save ${(plan.price * 12) - plan.yearlyPrice}/year</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 justify-center">
        <Button 
          onClick={() => setShowDialog(true)}
          size="lg"
          disabled={isUpgrading}
          className="min-w-[200px]"
        >
          {isUpgrading ? "Processing..." : "Upgrade Now"}
        </Button>
        {onCancel && (
          <Button 
            onClick={onCancel}
            variant="outline"
            size="lg"
          >
            Cancel
          </Button>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Upgrade</DialogTitle>
            <DialogDescription>
              Are you sure you want to upgrade to the {PLANS[selectedPlan as keyof typeof PLANS]?.name} plan?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Upgrade Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{PLANS[selectedPlan as keyof typeof PLANS]?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Billing:</span>
                  <span className="font-medium">{billingCycle === "monthly" ? "Monthly" : "Yearly"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-medium">
                    ${billingCycle === "monthly" 
                      ? PLANS[selectedPlan as keyof typeof PLANS]?.price 
                      : PLANS[selectedPlan as keyof typeof PLANS]?.yearlyPrice
                    }/{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleUpgrade} className="flex-1" disabled={isUpgrading}>
                {isUpgrading ? "Processing..." : "Confirm Upgrade"}
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PlanComparison({ currentPlan, onUpgrade, className = "" }: PlanComparisonProps) {
  const [selectedPlan, setSelectedPlan] = useState("pro");

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Plan Comparison</h2>
        <p className="text-gray-600">
          Compare features across all our plans
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium">Feature</th>
              <th className="text-center p-4 font-medium">Basic</th>
              <th className="text-center p-4 font-medium">Pro</th>
              <th className="text-center p-4 font-medium">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(FEATURE_COMPARISON).map(([key, feature]) => (
              <tr key={key} className="border-b">
                <td className="p-4">
                  <div>
                    <div className="font-medium">{feature.name}</div>
                    <div className="text-sm text-gray-600">{feature.description}</div>
                  </div>
                </td>
                <td className="text-center p-4">
                  {feature.basic ? (
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="text-center p-4">
                  {feature.pro ? (
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="text-center p-4">
                  {feature.enterprise ? (
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center">
        <Button 
          onClick={() => onUpgrade?.(selectedPlan)}
          size="lg"
          className="min-w-[200px]"
        >
          Start Free Trial
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export function UpgradeBenefits({ planId, onUpgrade, className = "" }: UpgradeBenefitsProps) {
  const plan = PLANS[planId as keyof typeof PLANS];
  
  if (!plan) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Upgrade to {plan.name}</h3>
        <p className="text-gray-600">Unlock powerful features to improve your trading</p>
      </div>

      <div className="grid gap-4">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button 
          onClick={() => onUpgrade?.(planId)}
          size="lg"
          className="min-w-[200px]"
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
} 