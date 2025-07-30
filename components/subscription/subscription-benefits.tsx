"use client";

import { useState } from "react";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Check, 
  Star, 
  Zap, 
  Shield, 
  Target, 
  BarChart3, 
  Brain, 
  TrendingUp, 
  Crown, 
  ArrowRight,
  Calendar,
  CreditCard,
  Users,
  Activity
} from "lucide-react";

interface SubscriptionBenefitsProps {
  className?: string;
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
}

interface BenefitCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  isPremium: boolean;
  className?: string;
}

interface UsageStatsProps {
  className?: string;
}

const BENEFITS = [
  {
    id: "basic_analytics",
    title: "Basic Analytics",
    description: "Track your trading performance with fundamental insights",
    icon: <BarChart3 className="h-5 w-5" />,
    plan: "basic",
    isActive: true
  },
  {
    id: "trade_tracking",
    title: "Trade Tracking",
    description: "Record and analyze your trading history",
    icon: <Activity className="h-5 w-5" />,
    plan: "basic",
    isActive: true
  },
  {
    id: "ai_coaching",
    title: "AI Coaching",
    description: "Get personalized AI-powered trading insights and recommendations",
    icon: <Brain className="h-5 w-5" />,
    plan: "pro",
    isActive: false
  },
  {
    id: "behavioral_analysis",
    title: "Behavioral Analysis",
    description: "Understand your trading psychology and behavioral patterns",
    icon: <Users className="h-5 w-5" />,
    plan: "pro",
    isActive: false
  },
  {
    id: "risk_management",
    title: "Risk Management",
    description: "Comprehensive risk assessment and portfolio protection tools",
    icon: <Shield className="h-5 w-5" />,
    plan: "pro",
    isActive: false
  },
  {
    id: "performance_goals",
    title: "Performance Goals",
    description: "Set and track your trading goals with detailed analytics",
    icon: <Target className="h-5 w-5" />,
    plan: "pro",
    isActive: false
  },
  {
    id: "live_monitoring",
    title: "Live Monitoring",
    description: "Real-time portfolio monitoring and instant alerts",
    icon: <TrendingUp className="h-5 w-5" />,
    plan: "enterprise",
    isActive: false
  },
  {
    id: "trade_validator",
    title: "Trade Validator",
    description: "Advanced trade validation and optimization tools",
    icon: <Zap className="h-5 w-5" />,
    plan: "enterprise",
    isActive: false
  }
];

const PLAN_FEATURES = {
  basic: {
    name: "Basic",
    price: 9,
    features: ["Basic Analytics", "Trade Tracking", "Email Support"],
    color: "bg-gray-100 text-gray-800"
  },
  pro: {
    name: "Pro",
    price: 29,
    features: ["All Basic features", "AI Coaching", "Behavioral Analysis", "Risk Management", "Priority Support"],
    color: "bg-blue-100 text-blue-800"
  },
  enterprise: {
    name: "Enterprise",
    price: 99,
    features: ["All Pro features", "Live Monitoring", "Trade Validator", "Custom Integrations", "Priority Support"],
    color: "bg-purple-100 text-purple-800"
  }
};

function BenefitCard({ title, description, icon, isActive, isPremium, className = "" }: BenefitCardProps) {
  return (
    <Card className={`${className} ${isActive ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              {isPremium && (
                <Badge variant="secondary" className="text-xs">
                  Premium
                </Badge>
              )}
            </div>
          </div>
          {isActive ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <Star className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function UsageStats({ className = "" }: UsageStatsProps) {
  const { subscriptionStatus } = useSubscriptionStatus();
  
  // Mock usage data - in a real app, this would come from analytics
  const usageData = {
    featuresUsed: subscriptionStatus?.planName === "Pro" ? 8 : 3,
    totalFeatures: 8,
    daysActive: subscriptionStatus?.planName === "Pro" ? 45 : 12,
    totalDays: subscriptionStatus?.planName === "Pro" ? 60 : 30,
    sessionsThisMonth: subscriptionStatus?.planName === "Pro" ? 28 : 8,
    averageSessions: subscriptionStatus?.planName === "Pro" ? 35 : 15
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">Usage Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Features Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Features</span>
                <span>{usageData.featuresUsed}/{usageData.totalFeatures}</span>
              </div>
              <Progress value={(usageData.featuresUsed / usageData.totalFeatures) * 100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Days Active</span>
                <span>{usageData.daysActive}/{usageData.totalDays}</span>
              </div>
              <Progress value={(usageData.daysActive / usageData.totalDays) * 100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sessions</span>
                <span>{usageData.sessionsThisMonth}</span>
              </div>
              <div className="text-xs text-gray-600">
                Avg: {usageData.averageSessions} sessions/month
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm">
                  {subscriptionStatus?.planName || "Free"} Plan
                </span>
              </div>
              {subscriptionStatus?.endDate && (
                <div className="text-xs text-gray-600">
                  Renews: {new Date(subscriptionStatus.endDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SubscriptionBenefits({ className = "", showUpgradeButton = true, onUpgrade }: SubscriptionBenefitsProps) {
  const { subscriptionStatus } = useSubscriptionStatus();
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const currentPlan = subscriptionStatus?.planName?.toLowerCase() || "free";
  const currentPlanData = PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES];
  
  const activeBenefits = BENEFITS.filter(benefit => {
    if (currentPlan === "enterprise") return true;
    if (currentPlan === "pro") return benefit.plan === "basic" || benefit.plan === "pro";
    if (currentPlan === "basic") return benefit.plan === "basic";
    return false;
  });

  const availableBenefits = BENEFITS.filter(benefit => !activeBenefits.includes(benefit));
  const displayedBenefits = showAllFeatures ? BENEFITS : activeBenefits;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Plan Summary */}
      {currentPlanData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              Your {currentPlanData.name} Plan
            </CardTitle>
            <CardDescription>
              You have access to {activeBenefits.length} features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-600" />
                <span className="text-sm">${currentPlanData.price}/month</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {currentPlanData.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Statistics */}
      <UsageStats />

      {/* Benefits Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Benefits</h3>
          {availableBenefits.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllFeatures(!showAllFeatures)}
            >
              {showAllFeatures ? "Show Active Only" : "Show All Features"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedBenefits.map((benefit) => (
            <BenefitCard
              key={benefit.id}
              title={benefit.title}
              description={benefit.description}
              icon={benefit.icon}
              isActive={benefit.isActive}
              isPremium={benefit.plan !== "basic"}
            />
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      {showUpgradeButton && availableBenefits.length > 0 && (
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Unlock More Features</h3>
                <p className="text-gray-600 mb-4">
                  Upgrade to access {availableBenefits.length} additional premium features
                </p>
                <Button 
                  onClick={onUpgrade || (() => window.location.href = "/pricing")}
                  size="lg"
                  className="min-w-[200px]"
                >
                  Upgrade Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PlanBenefits({ planId, className = "" }: { planId: string; className?: string }) {
  const planData = PLAN_FEATURES[planId as keyof typeof PLAN_FEATURES];
  
  if (!planData) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">{planData.name} Plan Benefits</h3>
        <p className="text-gray-600">Everything included in your {planData.name} plan</p>
      </div>

      <div className="grid gap-3">
        {planData.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <div className="text-2xl font-bold">${planData.price}<span className="text-sm font-normal">/month</span></div>
      </div>
    </div>
  );
} 