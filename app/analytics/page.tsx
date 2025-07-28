"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/navigation/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoading } from "@/components/ui/loading";
import { apiClient } from "@/lib/api-client";
import EquityCurveChart from "@/components/charts/equity-curve-chart";
import DailyPnLChart from "@/components/charts/daily-pnl-chart";
import WinLossChart from "@/components/charts/win-loss-chart";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Clock,
  BarChart3,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";

interface AnalyticsData {
  analytics: {
    totalNetProfitLoss: number;
    grossProfit: number;
    grossLoss: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    lossRate: number;
    profitFactor: number;
    avgProfitPerWin: number;
    avgLossPerLoss: number;
    avgProfitLossPerTrade: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    avgDrawdown: number;
    longestWinStreak: number;
    longestLossStreak: number;
    profitableDays: number;
    lossDays: number;
  };
  chartData: {
    equityCurve: Array<{ date: string; value: number; trade: number }>;
    dailyPnL: Array<{ date: string; pnl: number; color: string }>;
    winLossDistribution: Array<{ name: string; value: number; color: string }>;
    profitLossDistribution: Array<{
      range: string;
      count: number;
      minValue: number;
      maxValue: number;
    }>;
    hourlyPerformance: Array<{
      hour: string;
      avgPnL: number;
      totalPnL: number;
      trades: number;
    }>;
    weeklyPerformance: Array<{
      day: string;
      avgPnL: number;
      totalPnL: number;
      trades: number;
    }>;
    symbolPerformance: Array<{
      symbol: string;
      totalPnL: number;
      trades: number;
      avgPnL: number;
    }>;
  };
  summary: {
    totalTrades: number;
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("1y");

  const fetchAnalytics = async (selectedPeriod: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getAnalytics(selectedPeriod);
      
      if (!result.success || result.error) {
        throw new Error(result.error || "Failed to fetch analytics");
      }

      setData(result.data as AnalyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      apiClient.handleError({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

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

  if (loading) {
    return (
      <Sidebar>
        <PageLoading 
          title="Loading Analytics"
          description="Please wait while we prepare your trading analytics"
        />
      </Sidebar>
    );
  }

  if (error) {
    return (
      <Sidebar>
        <div className="p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Error Loading Analytics
            </h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchAnalytics(period)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </Sidebar>
    );
  }

  if (!data) {
    return (
      <Sidebar>
        <div className="p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Data Available</h1>
            <p className="text-muted-foreground mb-4">
              Please upload your trade data to view analytics.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have trade data? Download our sample file to test the
                analytics:
              </p>
              <a
                href="/sample-trades.csv"
                download
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download Sample File
              </a>
            </div>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive analysis of your trading performance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Last Month</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => fetchAnalytics(period)}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  data.analytics.totalNetProfitLoss >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(data.analytics.totalNetProfitLoss)}
              </div>
              <p className="text-xs text-muted-foreground">
                Gross Profit: {formatCurrency(data.analytics.grossProfit)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(data.analytics.winRate)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.analytics.winningTrades} winning trades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Trades
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.analytics.totalTrades}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg P&L: {formatCurrency(data.analytics.avgProfitLossPerTrade)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Max Drawdown
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(data.analytics.maxDrawdown)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(data.analytics.maxDrawdownPercent)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <EquityCurveChart data={data.chartData.equityCurve} />
              <WinLossChart data={data.chartData.winLossDistribution} />
            </div>
            <DailyPnLChart data={data.chartData.dailyPnL} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Key Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Profit Factor
                    </span>
                    <span className="font-medium">
                      {data.analytics.profitFactor.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Avg Win
                    </span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(data.analytics.avgProfitPerWin)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Avg Loss
                    </span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(data.analytics.avgLossPerLoss)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Longest Win Streak
                    </span>
                    <span className="font-medium">
                      {data.analytics.longestWinStreak}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Longest Loss Streak
                    </span>
                    <span className="font-medium">
                      {data.analytics.longestLossStreak}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Profitable Days
                    </span>
                    <span className="font-medium">
                      {data.analytics.profitableDays}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Loss Days
                    </span>
                    <span className="font-medium">
                      {data.analytics.lossDays}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Performing Symbols
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.chartData.symbolPerformance
                      .slice(0, 5)
                      .map((symbol) => (
                        <div
                          key={symbol.symbol}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <span className="font-medium">{symbol.symbol}</span>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-bold ${
                                symbol.totalPnL >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(symbol.totalPnL)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {symbol.trades} trades
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Hourly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.chartData.hourlyPerformance.map((hour) => (
                      <div
                        key={hour.hour}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{hour.hour}</span>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              hour.avgPnL >= 0 ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              hour.avgPnL >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(hour.avgPnL)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.chartData.weeklyPerformance.map((day) => (
                      <div
                        key={day.day}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{day.day}</span>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              day.avgPnL >= 0 ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              day.avgPnL >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(day.avgPnL)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Sidebar>
  );
}
