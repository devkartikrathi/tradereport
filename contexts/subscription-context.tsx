"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

// Types
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

// State
interface SubscriptionState {
  subscriptionStatus: SubscriptionStatus | null;
  featureStatus: FeatureStatus | null;
  cache: Map<string, { data: any; timestamp: number }>;
  loading: boolean;
  error: string | null;
}

// Actions
type SubscriptionAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SUBSCRIPTION_STATUS"; payload: SubscriptionStatus }
  | { type: "SET_FEATURE_STATUS"; payload: FeatureStatus }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CACHE_DATA"; payload: { key: string; data: any } }
  | { type: "CLEAR_CACHE" }
  | { type: "RESET" };

// Context
interface SubscriptionContextType {
  state: SubscriptionState;
  refreshSubscriptionStatus: () => Promise<void>;
  refreshFeatureStatus: () => Promise<void>;
  checkFeatureAccess: (featureName: string) => Promise<FeatureAccessResult>;
  clearCache: () => void;
  isFeatureAccessible: (featureName: string) => boolean;
  getSubscriptionStatus: () => SubscriptionStatus | null;
  getFeatureStatus: () => FeatureStatus | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Reducer
function subscriptionReducer(state: SubscriptionState, action: SubscriptionAction): SubscriptionState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    
    case "SET_SUBSCRIPTION_STATUS":
      return { ...state, subscriptionStatus: action.payload, error: null };
    
    case "SET_FEATURE_STATUS":
      return { ...state, featureStatus: action.payload, error: null };
    
    case "SET_ERROR":
      return { ...state, error: action.payload };
    
    case "CACHE_DATA":
      const newCache = new Map(state.cache);
      newCache.set(action.payload.key, {
        data: action.payload.data,
        timestamp: Date.now()
      });
      return { ...state, cache: newCache };
    
    case "CLEAR_CACHE":
      return { ...state, cache: new Map() };
    
    case "RESET":
      return {
        subscriptionStatus: null,
        featureStatus: null,
        cache: new Map(),
        loading: false,
        error: null
      };
    
    default:
      return state;
  }
}

// Provider
interface SubscriptionProviderProps {
  children: React.ReactNode;
  cacheTimeout?: number; // milliseconds
}

export function SubscriptionProvider({ 
  children, 
  cacheTimeout = 5 * 60 * 1000 // 5 minutes default
}: SubscriptionProviderProps) {
  const { userId } = useAuth();
  const [state, dispatch] = useReducer(subscriptionReducer, {
    subscriptionStatus: null,
    featureStatus: null,
    cache: new Map(),
    loading: false,
    error: null
  });

  // Check if cached data is still valid
  const isCacheValid = useCallback((key: string): boolean => {
    const cached = state.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < cacheTimeout;
  }, [state.cache, cacheTimeout]);

  // Get cached data
  const getCachedData = useCallback((key: string): any => {
    const cached = state.cache.get(key);
    return cached?.data || null;
  }, [state.cache]);

  // Cache data
  const cacheData = useCallback((key: string, data: any) => {
    dispatch({ type: "CACHE_DATA", payload: { key, data } });
  }, []);

  // Fetch subscription status
  const fetchSubscriptionStatus = useCallback(async (): Promise<SubscriptionStatus | null> => {
    if (!userId) return null;

    const cacheKey = `subscription_status_${userId}`;
    
    // Check cache first
    if (isCacheValid(cacheKey)) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        dispatch({ type: "SET_SUBSCRIPTION_STATUS", payload: cached });
        return cached;
      }
    }

    try {
      const response = await fetch("/api/subscriptions/validate");
      
      if (!response.ok) {
        throw new Error("Failed to fetch subscription status");
      }

      const data = await response.json();
      
      // Cache the result
      cacheData(cacheKey, data);
      dispatch({ type: "SET_SUBSCRIPTION_STATUS", payload: data });
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return null;
    }
  }, [userId, isCacheValid, getCachedData, cacheData]);

  // Fetch feature status
  const fetchFeatureStatus = useCallback(async (): Promise<FeatureStatus | null> => {
    if (!userId) return null;

    const cacheKey = `feature_status_${userId}`;
    
    // Check cache first
    if (isCacheValid(cacheKey)) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        dispatch({ type: "SET_FEATURE_STATUS", payload: cached });
        return cached;
      }
    }

    try {
      const response = await fetch("/api/features/status");
      
      if (!response.ok) {
        throw new Error("Failed to fetch feature status");
      }

      const data = await response.json();
      
      // Cache the result
      cacheData(cacheKey, data);
      dispatch({ type: "SET_FEATURE_STATUS", payload: data });
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return null;
    }
  }, [userId, isCacheValid, getCachedData, cacheData]);

  // Check feature access
  const checkFeatureAccess = useCallback(async (featureName: string): Promise<FeatureAccessResult> => {
    if (!userId) {
      return {
        hasAccess: false,
        featureName,
        error: "User not authenticated"
      };
    }

    const cacheKey = `feature_access_${userId}_${featureName}`;
    
    // Check cache first
    if (isCacheValid(cacheKey)) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await fetch(`/api/subscriptions/validate?feature=${featureName}`);
      
      if (!response.ok) {
        throw new Error("Failed to check feature access");
      }

      const data = await response.json();
      
      // Cache the result
      cacheData(cacheKey, data);
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        hasAccess: false,
        featureName,
        error: errorMessage
      };
    }
  }, [userId, isCacheValid, getCachedData, cacheData]);

  // Refresh subscription status
  const refreshSubscriptionStatus = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    await fetchSubscriptionStatus();
    dispatch({ type: "SET_LOADING", payload: false });
  }, [fetchSubscriptionStatus]);

  // Refresh feature status
  const refreshFeatureStatus = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    await fetchFeatureStatus();
    dispatch({ type: "SET_LOADING", payload: false });
  }, [fetchFeatureStatus]);

  // Clear cache
  const clearCache = useCallback(() => {
    dispatch({ type: "CLEAR_CACHE" });
  }, []);

  // Check if feature is accessible (synchronous check using cached data)
  const isFeatureAccessible = useCallback((featureName: string): boolean => {
    if (!state.subscriptionStatus) return false;
    return state.subscriptionStatus.accessibleFeatures.includes(featureName);
  }, [state.subscriptionStatus]);

  // Get subscription status
  const getSubscriptionStatus = useCallback((): SubscriptionStatus | null => {
    return state.subscriptionStatus;
  }, [state.subscriptionStatus]);

  // Get feature status
  const getFeatureStatus = useCallback((): FeatureStatus | null => {
    return state.featureStatus;
  }, [state.featureStatus]);

  // Initial data fetch
  useEffect(() => {
    if (userId) {
      dispatch({ type: "SET_LOADING", payload: true });
      
      Promise.all([
        fetchSubscriptionStatus(),
        fetchFeatureStatus()
      ]).finally(() => {
        dispatch({ type: "SET_LOADING", payload: false });
      });
    } else {
      dispatch({ type: "RESET" });
    }
  }, [userId, fetchSubscriptionStatus, fetchFeatureStatus]);

  // Auto-refresh subscription status every 5 minutes
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetchSubscriptionStatus();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [userId, fetchSubscriptionStatus]);

  const contextValue: SubscriptionContextType = {
    state,
    refreshSubscriptionStatus,
    refreshFeatureStatus,
    checkFeatureAccess,
    clearCache,
    isFeatureAccessible,
    getSubscriptionStatus,
    getFeatureStatus
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Hook to use subscription context
export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscriptionContext must be used within a SubscriptionProvider");
  }
  return context;
}

// Enhanced hooks that use the context
export function useSubscriptionStatus() {
  const { state, refreshSubscriptionStatus } = useSubscriptionContext();
  
  return {
    subscriptionStatus: state.subscriptionStatus,
    loading: state.loading,
    error: state.error,
    refresh: refreshSubscriptionStatus
  };
}

export function useFeatureAccess(featureName: string) {
  const { state, checkFeatureAccess, isFeatureAccessible } = useSubscriptionContext();
  const [hasAccess, setHasAccess] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = React.useState(false);

  React.useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await checkFeatureAccess(featureName);
        setHasAccess(result.hasAccess);
        setUpgradeRequired(result.upgradeRequired || false);
        setError(result.error || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [featureName, checkFeatureAccess]);

  // Also check cached data for immediate response
  React.useEffect(() => {
    const cachedAccess = isFeatureAccessible(featureName);
    if (cachedAccess !== hasAccess) {
      setHasAccess(cachedAccess);
    }
  }, [featureName, isFeatureAccessible, hasAccess]);

  return {
    hasAccess,
    loading,
    error,
    upgradeRequired,
    refresh: () => checkFeatureAccess(featureName)
  };
}

export function usePremiumFeatures() {
  const { state, refreshFeatureStatus } = useSubscriptionContext();
  
  return {
    features: state.featureStatus,
    loading: state.loading,
    error: state.error,
    refresh: refreshFeatureStatus
  };
} 