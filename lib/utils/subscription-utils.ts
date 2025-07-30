import { SubscriptionStatus, FeatureAccessResult, FeatureStatus } from "@/contexts/subscription-context";

// Subscription status utilities
export function isSubscriptionActive(status: SubscriptionStatus | null): boolean {
    if (!status) return false;
    return status.hasAccess && status.isValid;
}

export function isSubscriptionExpired(status: SubscriptionStatus | null): boolean {
    if (!status?.subscription?.currentPeriodEnd) return false;
    return new Date(status.subscription.currentPeriodEnd) < new Date();
}

export function getDaysUntilExpiry(status: SubscriptionStatus | null): number {
    if (!status?.subscription?.currentPeriodEnd) return 0;
    const expiryDate = new Date(status.subscription.currentPeriodEnd);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isSubscriptionExpiringSoon(status: SubscriptionStatus | null, daysThreshold: number = 7): boolean {
    const daysUntilExpiry = getDaysUntilExpiry(status);
    return daysUntilExpiry > 0 && daysUntilExpiry <= daysThreshold;
}

export function getSubscriptionPlanName(status: SubscriptionStatus | null): string {
    return status?.subscription?.planName || "Free";
}

export function getSubscriptionStatus(status: SubscriptionStatus | null): string {
    return status?.subscription?.status || "inactive";
}

// Feature access utilities
export function hasFeatureAccess(featureName: string, status: SubscriptionStatus | null): boolean {
    if (!status) return false;
    return status.accessibleFeatures.includes(featureName);
}

export function getAccessibleFeatures(status: SubscriptionStatus | null): string[] {
    return status?.accessibleFeatures || [];
}

export function getPremiumFeatures(status: SubscriptionStatus | null): string[] {
    const allFeatures = [
        "ai_coaching",
        "behavioral_analysis",
        "risk_management",
        "performance_goals",
        "live_monitoring",
        "trade_validator"
    ];

    const accessibleFeatures = getAccessibleFeatures(status);
    return allFeatures.filter(feature => !accessibleFeatures.includes(feature));
}

export function getFeatureAccessLevel(featureName: string, status: SubscriptionStatus | null): "free" | "basic" | "pro" | "enterprise" {
    const featurePlanMap: Record<string, "free" | "basic" | "pro" | "enterprise"> = {
        "basic_analytics": "free",
        "trade_tracking": "free",
        "ai_coaching": "pro",
        "behavioral_analysis": "pro",
        "risk_management": "pro",
        "performance_goals": "pro",
        "live_monitoring": "enterprise",
        "trade_validator": "enterprise"
    };

    return featurePlanMap[featureName] || "free";
}

export function requiresUpgrade(featureName: string, status: SubscriptionStatus | null): boolean {
    return !hasFeatureAccess(featureName, status);
}

export function getRequiredPlan(featureName: string): string {
    const featurePlanMap: Record<string, string> = {
        "ai_coaching": "Pro",
        "behavioral_analysis": "Pro",
        "risk_management": "Pro",
        "performance_goals": "Pro",
        "live_monitoring": "Enterprise",
        "trade_validator": "Enterprise"
    };

    return featurePlanMap[featureName] || "Basic";
}

// Subscription health utilities
export function getSubscriptionHealth(status: SubscriptionStatus | null): "excellent" | "good" | "fair" | "poor" {
    if (!status) return "poor";

    if (!isSubscriptionActive(status)) return "poor";

    const daysUntilExpiry = getDaysUntilExpiry(status);

    if (daysUntilExpiry > 30) return "excellent";
    if (daysUntilExpiry > 7) return "good";
    if (daysUntilExpiry > 0) return "fair";

    return "poor";
}

export function getSubscriptionHealthScore(status: SubscriptionStatus | null): number {
    if (!status) return 0;

    const health = getSubscriptionHealth(status);
    const healthScores = {
        excellent: 100,
        good: 75,
        fair: 50,
        poor: 25
    };

    return healthScores[health];
}

// Feature usage utilities
export function getFeatureUsageStats(featureStatus: FeatureStatus | null): {
    totalFeatures: number;
    accessibleFeatures: number;
    premiumFeatures: number;
    usagePercentage: number;
} {
    if (!featureStatus) {
        return {
            totalFeatures: 0,
            accessibleFeatures: 0,
            premiumFeatures: 0,
            usagePercentage: 0
        };
    }

    const totalFeatures = featureStatus.premiumFeatures.length;
    const accessibleFeatures = featureStatus.accessibleFeatures.length;
    const premiumFeatures = featureStatus.premiumFeatures.filter(f => f.isActive).length;
    const usagePercentage = totalFeatures > 0 ? (accessibleFeatures / totalFeatures) * 100 : 0;

    return {
        totalFeatures,
        accessibleFeatures,
        premiumFeatures,
        usagePercentage
    };
}

// Upgrade recommendation utilities
export function getUpgradeRecommendations(status: SubscriptionStatus | null): {
    recommendedFeatures: string[];
    currentPlan: string;
    suggestedPlan: string;
    benefits: string[];
} {
    const currentPlan = getSubscriptionPlanName(status);
    const accessibleFeatures = getAccessibleFeatures(status);

    const allFeatures = [
        "ai_coaching",
        "behavioral_analysis",
        "risk_management",
        "performance_goals",
        "live_monitoring",
        "trade_validator"
    ];

    const missingFeatures = allFeatures.filter(feature => !accessibleFeatures.includes(feature));

    let suggestedPlan = "Basic";
    if (missingFeatures.length > 0) {
        const hasProFeatures = missingFeatures.some(f =>
            ["ai_coaching", "behavioral_analysis", "risk_management", "performance_goals"].includes(f)
        );
        const hasEnterpriseFeatures = missingFeatures.some(f =>
            ["live_monitoring", "trade_validator"].includes(f)
        );

        if (hasEnterpriseFeatures) {
            suggestedPlan = "Enterprise";
        } else if (hasProFeatures) {
            suggestedPlan = "Pro";
        }
    }

    const benefits = missingFeatures.map(feature => {
        const featureNames: Record<string, string> = {
            ai_coaching: "AI-powered trading insights",
            behavioral_analysis: "Behavioral pattern analysis",
            risk_management: "Comprehensive risk assessment",
            performance_goals: "Goal tracking and analytics",
            live_monitoring: "Real-time portfolio monitoring",
            trade_validator: "Advanced trade validation"
        };
        return featureNames[feature] || feature;
    });

    return {
        recommendedFeatures: missingFeatures,
        currentPlan,
        suggestedPlan,
        benefits
    };
}

// Validation utilities
export function validateSubscriptionStatus(status: SubscriptionStatus | null): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
} {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!status) {
        issues.push("No subscription status available");
        recommendations.push("Please check your subscription status");
        return { isValid: false, issues, recommendations };
    }

    if (!status.isValid) {
        issues.push("Subscription is not valid");
        recommendations.push("Please contact support to resolve subscription issues");
    }

    if (!status.hasAccess) {
        issues.push("No active subscription found");
        recommendations.push("Upgrade to a premium plan to access features");
    }

    if (isSubscriptionExpired(status)) {
        issues.push("Subscription has expired");
        recommendations.push("Renew your subscription to continue accessing premium features");
    }

    if (isSubscriptionExpiringSoon(status)) {
        issues.push("Subscription is expiring soon");
        recommendations.push("Consider renewing your subscription to avoid service interruption");
    }

    const isValid = issues.length === 0;

    return { isValid, issues, recommendations };
}

// Formatting utilities
export function formatSubscriptionStatus(status: SubscriptionStatus | null): string {
    if (!status) return "Unknown";

    if (!status.isValid) return "Invalid";
    if (!status.hasAccess) return "No Subscription";
    if (isSubscriptionExpired(status)) return "Expired";
    if (isSubscriptionExpiringSoon(status)) return "Expiring Soon";

    return "Active";
}

export function formatDaysUntilExpiry(status: SubscriptionStatus | null): string {
    const days = getDaysUntilExpiry(status);

    if (days === 0) return "Expired";
    if (days === 1) return "Expires tomorrow";
    if (days < 7) return `Expires in ${days} days`;
    if (days < 30) return `Expires in ${Math.ceil(days / 7)} weeks`;

    return `Expires in ${Math.ceil(days / 30)} months`;
}

export function formatPlanName(planName: string | undefined): string {
    if (!planName) return "Free";
    return planName.charAt(0).toUpperCase() + planName.slice(1);
}

// Cache utilities
export function createCacheKey(type: string, userId: string, featureName?: string): string {
    if (featureName) {
        return `${type}_${userId}_${featureName}`;
    }
    return `${type}_${userId}`;
}

export function isCacheValid(timestamp: number, timeout: number = 5 * 60 * 1000): boolean {
    return Date.now() - timestamp < timeout;
}

// Error handling utilities
export function handleSubscriptionError(error: any): string {
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    return "An unknown error occurred";
}

export function isNetworkError(error: any): boolean {
    const errorMessage = handleSubscriptionError(error).toLowerCase();
    return errorMessage.includes("network") ||
        errorMessage.includes("fetch") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("connection");
}

export function shouldRetryRequest(error: any): boolean {
    return isNetworkError(error);
} 