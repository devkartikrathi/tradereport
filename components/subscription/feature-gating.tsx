"use client";

import { ReactNode } from "react";
import { useFeatureAccess } from "@/hooks/use-subscription-status";
import { UpgradePrompt } from "./upgrade-prompts";
import { Lock, Star, Zap, Shield, Users, Target, TrendingUp } from "lucide-react";

interface FeatureGatingProps {
  featureName: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}





export function FeatureGating({ 
  featureName, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: FeatureGatingProps) {
  const { hasAccess, loading, error } = useFeatureAccess(featureName);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Error loading feature</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return (
        <UpgradePrompt 
          featureName={featureName}
          onUpgrade={() => {
            // Navigate to pricing page
            window.location.href = "/pricing";
          }}
        />
      );
    }

    return null;
  }

  return <>{children}</>;
}

interface PremiumFeatureWrapperProps {
  featureName: string;
  children: ReactNode;
  className?: string;
}

export function PremiumFeatureWrapper({ 
  featureName, 
  children, 
  className = "" 
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
    return null;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface FeatureAccessIndicatorProps {
  featureName: string;
  showLabel?: boolean;
  className?: string;
}

export function FeatureAccessIndicator({ 
  featureName, 
  showLabel = false,
  className = "" 
}: FeatureAccessIndicatorProps) {
  const { hasAccess, loading } = useFeatureAccess(featureName);

  if (loading) {
    return (
      <div className={`${className} flex items-center space-x-2`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        {showLabel && <span className="text-sm text-muted-foreground">Checking access...</span>}
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className={`${className} flex items-center space-x-2`}>
        <Lock className="h-4 w-4 text-muted-foreground" />
        {showLabel && <span className="text-sm text-muted-foreground">Premium required</span>}
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center space-x-2`}>
      <Star className="h-4 w-4 text-green-500" />
      {showLabel && <span className="text-sm text-green-600">Premium access</span>}
    </div>
  );
} 