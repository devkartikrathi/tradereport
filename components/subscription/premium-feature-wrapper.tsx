"use client";

import { ReactNode } from "react";
import { useFeatureAccess } from "@/hooks/use-subscription-status";
import { UpgradePrompt, FeaturePreview } from "./upgrade-prompts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lock, Star, Zap, Shield, Users, Target, TrendingUp, Crown } from "lucide-react";

interface PremiumFeatureWrapperProps {
  featureName: string;
  children: ReactNode;
  className?: string;
  showUpgradeDialog?: boolean;
  upgradeDialogTitle?: string;
  upgradeDialogDescription?: string;
}

interface PremiumUpgradeDialogProps {
  featureName: string;
  title?: string;
  description?: string;
  onUpgrade?: () => void;
}

const featureIcons: Record<string, ReactNode> = {
  ai_coaching: <Zap className="h-6 w-6" />,
  trade_validator: <Shield className="h-6 w-6" />,
  real_time_monitoring: <TrendingUp className="h-6 w-6" />,
  behavioral_analysis: <Users className="h-6 w-6" />,
  risk_management: <Shield className="h-6 w-6" />,
  performance_goals: <Target className="h-6 w-6" />,
  market_context: <TrendingUp className="h-6 w-6" />
};

const featureNames: Record<string, string> = {
  ai_coaching: "AI Coaching",
  trade_validator: "Trade Validator",
  real_time_monitoring: "Real-time Monitoring",
  behavioral_analysis: "Behavioral Analysis",
  risk_management: "Risk Management",
  performance_goals: "Performance Goals",
  market_context: "Market Context"
};

const featureDescriptions: Record<string, string> = {
  ai_coaching: "Get AI-powered coaching insights and personalized recommendations to improve your trading performance.",
  trade_validator: "Validate your trade ideas with AI analysis of chart images and comprehensive checklists.",
  real_time_monitoring: "Monitor your trades in real-time with live alerts and position tracking.",
  behavioral_analysis: "Understand your trading patterns with AI-powered behavioral analysis.",
  risk_management: "Get comprehensive risk assessment and position sizing recommendations.",
  performance_goals: "Set and track performance goals with AI-powered insights and analytics.",
  market_context: "Integrate market data and context-aware analysis for better decision making."
};


  const displayName = featureNames[featureName] || featureName;
  const featureDescription = featureDescriptions[featureName] || "Premium feature";
  const icon = featureIcons[featureName] || <Star className="h-6 w-6" />;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Lock className="h-4 w-4 mr-2" />
          Upgrade to Premium
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              {icon}
            </div>
            <span>{title || displayName}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <Badge variant="secondary" className="mb-2">
              Premium Feature
            </Badge>
            <p className="text-muted-foreground">
              {description || featureDescription}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Access to {displayName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-blue-500" />
              <span className="text-sm">All premium features included</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm">Priority support</span>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={onUpgrade} 
              className="w-full"
              size="lg"
            >
              Upgrade to Premium
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Get access to all premium features including {displayName}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PremiumFeatureWrapper({ 
  featureName, 
  children, 
  className = "",
  showUpgradeDialog = true,
  upgradeDialogTitle,
  upgradeDialogDescription
}: PremiumFeatureWrapperProps) {
  const { hasAccess, loading } = useFeatureAccess(featureName);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center p-4`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    if (showUpgradeDialog) {
      return (
        <div className={className}>
          <UpgradePrompt 
            featureName={featureName}
            title={upgradeDialogTitle}
            description={upgradeDialogDescription}
            onUpgrade={() => {
              // Navigate to pricing page
              window.location.href = "/pricing";
            }}
          />
        </div>
      );
    }

    return null;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface PremiumFeatureCardProps {
  featureName: string;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function PremiumFeatureCard({ 
  featureName, 
  children, 
  title,
  description,
  className = "" 
}: PremiumFeatureCardProps) {
  const { hasAccess, loading } = useFeatureAccess(featureName);
  const displayName = featureNames[featureName] || featureName;
  const featureDescription = featureDescriptions[featureName] || "Premium feature";
  const icon = featureIcons[featureName] || <Star className="h-5 w-5" />;

  if (loading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <FeaturePreview
        featureName={featureName}
        title={title || displayName}
        description={description || featureDescription}
        benefits={[
          "Advanced analytics and insights",
          "Personalized recommendations",
          "Enhanced risk management",
          "Priority support"
        ]}
        onUpgrade={() => window.location.href = "/pricing"}
        className={className}
      />
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg">{title || displayName}</CardTitle>
            <Badge variant="default" className="text-xs">
              Premium
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
} 