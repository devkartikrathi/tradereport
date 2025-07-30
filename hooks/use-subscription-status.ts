import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export interface SubscriptionStatus {
  isValid: boolean;
  hasAccess: boolean;
  subscription?: {
    status: string;
    planName?: string;
    currentPeriodEnd?: string;
  };
  accessibleFeatures: string[];
  error?: string;
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  featureName: string;
  subscriptionStatus?: string;
  planName?: string;
  error?: string;
  upgradeRequired?: boolean;
}

export interface FeatureStatus {
  accessibleFeatures: string[];
  premiumFeatures: Array<{
    name: string;
    description: string;
    category: string;
    requiredPlan: string;
    isActive: boolean;
  }>;
  subscriptionStatus?: string;
  planName?: string;
  hasActiveSubscription: boolean;
}

export function useSubscriptionStatus() {
  const { userId } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!userId) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/subscriptions/validate");

      if (!response.ok) {
        throw new Error("Failed to fetch subscription status");
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const checkFeatureAccess = useCallback(async (featureName: string): Promise<FeatureAccessResult> => {
    if (!userId) {
      return {
        hasAccess: false,
        featureName,
        error: "User not authenticated"
      };
    }

    try {
      const response = await fetch(`/api/subscriptions/validate?feature=${featureName}`);

      if (!response.ok) {
        throw new Error("Failed to check feature access");
      }

      return await response.json();
    } catch (err) {
      return {
        hasAccess: false,
        featureName,
        error: err instanceof Error ? err.message : "Unknown error"
      };
    }
  }, [userId]);

  const getFeatureStatus = useCallback(async (): Promise<FeatureStatus | null> => {
    if (!userId) {
      return null;
    }

    try {
      const response = await fetch("/api/features/status");

      if (!response.ok) {
        throw new Error("Failed to fetch feature status");
      }

      return await response.json();
    } catch (err) {
      console.error("Error fetching feature status:", err);
      return null;
    }
  }, [userId]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const refresh = useCallback(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  return {
    status,
    loading,
    error,
    checkFeatureAccess,
    getFeatureStatus,
    refresh
  };
}

export function useFeatureAccess(featureName: string) {
  const { userId } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const checkAccess = useCallback(async () => {
    if (!userId) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/subscriptions/validate?feature=${featureName}`);

      if (!response.ok) {
        throw new Error("Failed to check feature access");
      }

      const data = await response.json();
      setHasAccess(data.hasAccess);
      setUpgradeRequired(data.upgradeRequired || false);
      setError(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [userId, featureName]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const refresh = useCallback(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    hasAccess,
    loading,
    error,
    upgradeRequired,
    refresh
  };
}

export function usePremiumFeatures() {
  const { userId } = useAuth();
  const [features, setFeatures] = useState<FeatureStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    if (!userId) {
      setFeatures(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/features/status");

      if (!response.ok) {
        throw new Error("Failed to fetch premium features");
      }

      const data = await response.json();
      setFeatures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setFeatures(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const refresh = useCallback(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return {
    features,
    loading,
    error,
    refresh
  };
} 