import { prisma } from '@/lib/prisma';
import { format, startOfDay, endOfDay, getDay, getHours } from 'date-fns';
import { logger } from '@/lib/logger';

export interface AnalyticsData {
  analytics: Analytics | CalculatedAnalytics;
  chartData: ChartData;
  summary: AnalyticsSummary;
}

export interface Analytics {
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
}

export interface CalculatedAnalytics extends Analytics {
  calculated: true;
}

export interface ChartData {
  equityCurve: EquityCurvePoint[];
  dailyPnL: DailyPnLPoint[];
  winLossDistribution: DistributionPoint[];
  profitLossDistribution: HistogramPoint[];
  hourlyPerformance: PerformancePoint[];
  weeklyPerformance: PerformancePoint[];
  symbolPerformance: SymbolPerformancePoint[];
}

export interface EquityCurvePoint {
  date: string;
  value: number;
  trade: number;
}

export interface DailyPnLPoint {
  date: string;
  pnl: number;
  color: string;
}

export interface DistributionPoint {
  name: string;
  value: number;
  color: string;
}

export interface HistogramPoint {
  range: string;
  count: number;
  minValue: number;
  maxValue: number;
}

export interface PerformancePoint {
  hour?: string;
  day?: string;
  avgPnL: number;
  totalPnL: number;
  trades: number;
}

export interface SymbolPerformancePoint {
  symbol: string;
  totalPnL: number;
  trades: number;
  avgPnL: number;
}

export interface AnalyticsSummary {
  totalTrades: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface MatchedTrade {
  id: string;
  userId: string;
  symbol: string;
  buyDate: Date;
  sellDate: Date;
  buyTime: string | null;
  sellTime: string | null;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  commission: number;
  buyTradeId: string | null;
  sellTradeId: string | null;
  duration: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AnalyticsService {
  /**
   * Get comprehensive analytics for a user
   */
  async getUserAnalytics(userId: string, options: {
    period?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<AnalyticsData> {
    const startTime = Date.now();

    try {
      // Get user with optimized includes
      const user = await this.getUserWithTrades(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Filter trades by date range with optimized queries
      const filteredTrades = this.filterTradesByDateRange(user.matchedTrades, options);

      // Use cached analytics if available and not filtered
      const useStoredAnalytics = !options.startDate && !options.endDate && options.period === '1y';
      const analytics = useStoredAnalytics && user.analytics 
        ? user.analytics 
        : this.calculateAnalytics(filteredTrades);

      // Generate chart data
      const chartData = this.generateChartData(filteredTrades);

      const result = {
        analytics,
        chartData,
        summary: {
          totalTrades: filteredTrades.length,
          dateRange: {
            start: filteredTrades.length > 0 ? filteredTrades[0].sellDate : null,
            end: filteredTrades.length > 0 ? filteredTrades[filteredTrades.length - 1].sellDate : null
          }
        }
      };

      const duration = Date.now() - startTime;
      logger.info('Analytics calculation completed', {
        userId,
        duration,
        tradesProcessed: filteredTrades.length,
        usedStoredAnalytics: useStoredAnalytics
      });

      return result;
    } catch (error) {
      logger.error('Analytics calculation failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Get user with optimized includes for performance
   */
  private async getUserWithTrades(userId: string) {
    return await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        analytics: true,
        matchedTrades: {
          orderBy: { sellDate: 'asc' },
          select: {
            id: true,
            userId: true,
            symbol: true,
            buyDate: true,
            sellDate: true,
            buyTime: true,
            sellTime: true,
            quantity: true,
            buyPrice: true,
            sellPrice: true,
            profit: true,
            commission: true,
            buyTradeId: true,
            sellTradeId: true,
            duration: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });
  }

  /**
   * Filter trades by date range with optimized logic
   */
  private filterTradesByDateRange(trades: MatchedTrade[], options: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }): MatchedTrade[] {
    if (options.startDate && options.endDate) {
      const start = startOfDay(new Date(options.startDate));
      const end = endOfDay(new Date(options.endDate));
      return trades.filter(trade => 
        trade.sellDate >= start && trade.sellDate <= end
      );
    }

    if (options.period) {
      const now = new Date();
      let filterDate: Date;
      
      switch (options.period) {
        case '1m':
          filterDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case '3m':
          filterDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6m':
          filterDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '1y':
        default:
          filterDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
      }
      
      return trades.filter(trade => trade.sellDate >= filterDate);
    }

    return trades;
  }

  /**
   * Calculate analytics with optimized algorithms
   */
  private calculateAnalytics(trades: MatchedTrade[]): CalculatedAnalytics {
    if (trades.length === 0) {
      return {
        totalNetProfitLoss: 0,
        grossProfit: 0,
        grossLoss: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        lossRate: 0,
        profitFactor: 0,
        avgProfitPerWin: 0,
        avgLossPerLoss: 0,
        avgProfitLossPerTrade: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        avgDrawdown: 0,
        longestWinStreak: 0,
        longestLossStreak: 0,
        profitableDays: 0,
        lossDays: 0,
        calculated: true
      };
    }

    // Basic metrics - single pass through trades
    let totalNetProfitLoss = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let winningTrades = 0;
    let losingTrades = 0;

    for (const trade of trades) {
      totalNetProfitLoss += trade.profit;
      
      if (trade.profit > 0) {
        grossProfit += trade.profit;
        winningTrades++;
      } else if (trade.profit < 0) {
        grossLoss += Math.abs(trade.profit);
        losingTrades++;
      }
    }

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const lossRate = totalTrades > 0 ? (losingTrades / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    const avgProfitPerWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
    const avgLossPerLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
    const avgProfitLossPerTrade = totalTrades > 0 ? totalNetProfitLoss / totalTrades : 0;
    
    // Calculate drawdown and streaks
    const { maxDrawdown, maxDrawdownPercent, avgDrawdown } = this.calculateDrawdown(trades);
    const { longestWinStreak, longestLossStreak } = this.calculateStreaks(trades);
    const { profitableDays, lossDays } = this.calculateDailyMetrics(trades);

    return {
      totalNetProfitLoss,
      grossProfit,
      grossLoss,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      lossRate,
      profitFactor,
      avgProfitPerWin,
      avgLossPerLoss,
      avgProfitLossPerTrade,
      maxDrawdown,
      maxDrawdownPercent,
      avgDrawdown,
      longestWinStreak,
      longestLossStreak,
      profitableDays,
      lossDays,
      calculated: true
    };
  }

  /**
   * Calculate drawdown metrics efficiently
   */
  private calculateDrawdown(trades: MatchedTrade[]) {
    let runningPnL = 0;
    let peak = 0;
    let maxDrawdown = 0;
    const drawdowns: number[] = [];
    
    for (const trade of trades) {
      runningPnL += trade.profit;
      peak = Math.max(peak, runningPnL);
      const drawdown = peak - runningPnL;
      drawdowns.push(drawdown);
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    const avgDrawdown = drawdowns.length > 0 ? 
      drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length : 0;
    const maxDrawdownPercent = peak > 0 ? (maxDrawdown / peak) * 100 : 0;

    return { maxDrawdown, maxDrawdownPercent, avgDrawdown };
  }

  /**
   * Calculate winning and losing streaks
   */
  private calculateStreaks(trades: MatchedTrade[]) {
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    for (const trade of trades) {
      if (trade.profit > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
      } else if (trade.profit < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
      }
    }

    return { longestWinStreak, longestLossStreak };
  }

  /**
   * Calculate daily performance metrics
   */
  private calculateDailyMetrics(trades: MatchedTrade[]) {
    const dailyPnL = new Map<string, number>();
    
    for (const trade of trades) {
      const dateKey = trade.sellDate.toISOString().split('T')[0];
      dailyPnL.set(dateKey, (dailyPnL.get(dateKey) || 0) + trade.profit);
    }
    
    const profitableDays = Array.from(dailyPnL.values()).filter(pnl => pnl > 0).length;
    const lossDays = Array.from(dailyPnL.values()).filter(pnl => pnl < 0).length;

    return { profitableDays, lossDays };
  }

  /**
   * Generate comprehensive chart data
   */
  private generateChartData(trades: MatchedTrade[]): ChartData {
    if (trades.length === 0) {
      return {
        equityCurve: [],
        dailyPnL: [],
        winLossDistribution: [],
        profitLossDistribution: [],
        hourlyPerformance: [],
        weeklyPerformance: [],
        symbolPerformance: []
      };
    }

    return {
      equityCurve: this.generateEquityCurve(trades),
      dailyPnL: this.generateDailyPnL(trades),
      winLossDistribution: this.generateWinLossDistribution(trades),
      profitLossDistribution: this.generateProfitLossDistribution(trades),
      hourlyPerformance: this.generateHourlyPerformance(trades),
      weeklyPerformance: this.generateWeeklyPerformance(trades),
      symbolPerformance: this.generateSymbolPerformance(trades)
    };
  }

  private generateEquityCurve(trades: MatchedTrade[]): EquityCurvePoint[] {
    const equityCurve: EquityCurvePoint[] = [];
    let runningPnL = 0;
    
    for (const trade of trades) {
      runningPnL += trade.profit;
      equityCurve.push({
        date: format(new Date(trade.sellDate), 'yyyy-MM-dd'),
        value: runningPnL,
        trade: trade.profit
      });
    }
    
    return equityCurve;
  }

  private generateDailyPnL(trades: MatchedTrade[]): DailyPnLPoint[] {
    const dailyPnLMap = new Map<string, number>();
    
    for (const trade of trades) {
      const dateKey = format(new Date(trade.sellDate), 'yyyy-MM-dd');
      dailyPnLMap.set(dateKey, (dailyPnLMap.get(dateKey) || 0) + trade.profit);
    }
    
    return Array.from(dailyPnLMap.entries()).map(([date, pnl]) => ({
      date,
      pnl,
      color: pnl >= 0 ? 'green' : 'red'
    }));
  }

  private generateWinLossDistribution(trades: MatchedTrade[]): DistributionPoint[] {
    const winningTrades = trades.filter(t => t.profit > 0).length;
    const losingTrades = trades.filter(t => t.profit < 0).length;
    
    return [
      { name: 'Winning Trades', value: winningTrades, color: '#22c55e' },
      { name: 'Losing Trades', value: losingTrades, color: '#ef4444' }
    ];
  }

  private generateProfitLossDistribution(trades: MatchedTrade[]): HistogramPoint[] {
    return this.createHistogram(trades.map(t => t.profit));
  }

  private generateHourlyPerformance(trades: MatchedTrade[]): PerformancePoint[] {
    const hourlyMap = new Map<number, { pnl: number, count: number }>();
    
    for (const trade of trades) {
      const hour = getHours(new Date(`${trade.sellDate}T${trade.sellTime || '00:00'}`));
      const current = hourlyMap.get(hour) || { pnl: 0, count: 0 };
      hourlyMap.set(hour, { pnl: current.pnl + trade.profit, count: current.count + 1 });
    }
    
    return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour: `${hour}:00`,
      avgPnL: data.pnl / data.count,
      totalPnL: data.pnl,
      trades: data.count
    }));
  }

  private generateWeeklyPerformance(trades: MatchedTrade[]): PerformancePoint[] {
    const weeklyMap = new Map<number, { pnl: number, count: number }>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (const trade of trades) {
      const day = getDay(new Date(trade.sellDate));
      const current = weeklyMap.get(day) || { pnl: 0, count: 0 };
      weeklyMap.set(day, { pnl: current.pnl + trade.profit, count: current.count + 1 });
    }
    
    return Array.from(weeklyMap.entries()).map(([day, data]) => ({
      day: dayNames[day],
      avgPnL: data.pnl / data.count,
      totalPnL: data.pnl,
      trades: data.count
    }));
  }

  private generateSymbolPerformance(trades: MatchedTrade[]): SymbolPerformancePoint[] {
    const symbolMap = new Map<string, { pnl: number, count: number }>();
    
    for (const trade of trades) {
      const current = symbolMap.get(trade.symbol) || { pnl: 0, count: 0 };
      symbolMap.set(trade.symbol, { pnl: current.pnl + trade.profit, count: current.count + 1 });
    }
    
    return Array.from(symbolMap.entries())
      .map(([symbol, data]) => ({
        symbol,
        totalPnL: data.pnl,
        trades: data.count,
        avgPnL: data.pnl / data.count
      }))
      .sort((a, b) => b.totalPnL - a.totalPnL)
      .slice(0, 10); // Top 10 symbols
  }

  private createHistogram(values: number[], bins = 10): HistogramPoint[] {
    if (values.length === 0) return [];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const binSize = range / bins;
    
    const histogram = Array(bins).fill(0).map((_, i) => ({
      range: `${(min + i * binSize).toFixed(2)} to ${(min + (i + 1) * binSize).toFixed(2)}`,
      count: 0,
      minValue: min + i * binSize,
      maxValue: min + (i + 1) * binSize
    }));
    
    for (const value of values) {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      histogram[binIndex].count++;
    }
    
    return histogram;
  }
}

export const analyticsService = new AnalyticsService(); 