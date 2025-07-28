"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, ResponsiveGrid } from "@/components/ui/responsive-container";
import { LoadingOverlay } from "@/components/ui/loading";
import { apiClient } from "@/lib/api-client";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Calendar,
  Zap,
} from "lucide-react";

interface PerformanceMetrics {
  totalPnL: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  profitFactor: number;
  avgTrade: number;
  bestDay: number;
  worstDay: number;
  currentStreak: number;
  longestStreak: number;
}

interface PerformanceOverviewProps {
  refreshInterval?: number;
  showDetails?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function PerformanceOverview({
  refreshInterval = 30000, // 30 seconds
  showDetails = true,
  onMetricsUpdate,
}: PerformanceOverviewProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
    maxDrawdown: 0,
    profitFactor: 0,
    avgTrade: 0,
    bestDay: 0,
    worstDay: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getAnalytics("1m"); // Last month
      
      if (!result.success || result.error) {
        throw new Error(result.error || "Failed to fetch metrics");
      }

      const data = result.data as { analytics?: Record<string, number> };
      if (data?.analytics) {
        const newMetrics: PerformanceMetrics = {
          totalPnL: data.analytics.totalNetProfitLoss || 0,
          winRate: data.analytics.winRate || 0,
          totalTrades: data.analytics.totalTrades || 0,
          maxDrawdown: data.analytics.maxDrawdown || 0,
          profitFactor: data.analytics.profitFactor || 0,
          avgTrade: data.analytics.avgProfitLossPerTrade || 0,
          bestDay: data.analytics.bestDay || 0,
          worstDay: data.analytics.worstDay || 0,
          currentStreak: data.analytics.currentStreak || 0,
          longestStreak: data.analytics.longestWinStreak || 0,
        };

        setMetrics(newMetrics);
        setLastUpdated(new Date());
        
        if (onMetricsUpdate) {
          onMetricsUpdate(newMetrics);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      apiClient.handleError({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (value: number, type: "pnl" | "rate" | "factor") => {
    switch (type) {
      case "pnl":
        return value >= 0 ? "text-green-600" : "text-red-600";
      case "rate":
        return value >= 50 ? "text-green-600" : value >= 30 ? "text-yellow-600" : "text-red-600";
      case "factor":
        return value >= 1.5 ? "text-green-600" : value >= 1.0 ? "text-yellow-600" : "text-red-600";
      default:
        return "text-foreground";
    }
  };

  const getStatusIcon = (value: number, type: "pnl" | "rate" | "factor") => {
    switch (type) {
      case "pnl":
        return value >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />;
      case "rate":
        return value >= 50 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "factor":
        return value >= 1.5 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchMetrics} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <LoadingOverlay isLoading={loading} text="Updating metrics...">
      <ResponsiveContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Performance Overview</h2>
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <Button onClick={fetchMetrics} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Key Metrics Grid */}
          <ResponsiveGrid cols={{ sm: 2, md: 3, lg: 4 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getStatusColor(metrics.totalPnL, "pnl")}`}>
                  {formatCurrency(metrics.totalPnL)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {getStatusIcon(metrics.totalPnL, "pnl")}
                  <p className="text-xs text-muted-foreground">
                    {metrics.totalPnL >= 0 ? "Profitable" : "Loss"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getStatusColor(metrics.winRate, "rate")}`}>
                  {formatPercentage(metrics.winRate)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {getStatusIcon(metrics.winRate, "rate")}
                  <p className="text-xs text-muted-foreground">
                    {metrics.totalTrades} trades
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getStatusColor(metrics.profitFactor, "factor")}`}>
                  {metrics.profitFactor.toFixed(2)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {getStatusIcon(metrics.profitFactor, "factor")}
                  <p className="text-xs text-muted-foreground">
                    {metrics.profitFactor >= 1.5 ? "Excellent" : metrics.profitFactor >= 1.0 ? "Good" : "Needs improvement"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(metrics.maxDrawdown)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Risk exposure
                </p>
              </CardContent>
            </Card>
          </ResponsiveGrid>

          {/* Detailed Metrics */}
          {showDetails && (
            <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Trading Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Trades</span>
                    <span className="font-medium">{metrics.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Trade</span>
                    <span className={`font-medium ${getStatusColor(metrics.avgTrade, "pnl")}`}>
                      {formatCurrency(metrics.avgTrade)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Streak</span>
                    <span className="font-medium">{metrics.currentStreak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Longest Streak</span>
                    <span className="font-medium">{metrics.longestStreak}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Daily Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Best Day</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(metrics.bestDay)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Worst Day</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(metrics.worstDay)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Detailed Analytics
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Clock className="mr-2 h-4 w-4" />
                    View Trade History
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Target className="mr-2 h-4 w-4" />
                    Set Performance Goals
                  </Button>
                </CardContent>
              </Card>
            </ResponsiveGrid>
          )}
        </div>
      </ResponsiveContainer>
    </LoadingOverlay>
  );
} 