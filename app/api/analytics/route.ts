import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { format, startOfDay, endOfDay, getDay, getHours } from 'date-fns';
import { Trade, EquityCurvePoint } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        analytics: true,
        trades: {
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '1y'; // 1y, 6m, 3m, 1m
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Filter trades by date range
    let filteredTrades = user.trades;
    
    if (startDate && endDate) {
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));
      filteredTrades = user.trades.filter(trade => 
        trade.date >= start && trade.date <= end
      );
    } else {
      // Apply default period filtering
      const now = new Date();
      let filterDate: Date;
      
      switch (period) {
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
      
      filteredTrades = user.trades.filter(trade => trade.date >= filterDate);
    }

    // Calculate real-time metrics for filtered trades
    const analytics = calculateAnalytics(filteredTrades);

    // Generate chart data
    const chartData = generateChartData(filteredTrades);

    return NextResponse.json({
      analytics: user.analytics || analytics,
      chartData,
      summary: {
        totalTrades: filteredTrades.length,
        dateRange: {
          start: filteredTrades.length > 0 ? filteredTrades[0].date : null,
          end: filteredTrades.length > 0 ? filteredTrades[filteredTrades.length - 1].date : null
        }
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function calculateAnalytics(trades: Trade[]) {
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
      lossDays: 0
    };
  }

  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.profitLoss > 0).length;
  const losingTrades = trades.filter(t => t.profitLoss < 0).length;
  const totalNetProfitLoss = trades.reduce((sum, t) => sum + t.profitLoss, 0);
  const grossProfit = trades.filter(t => t.profitLoss > 0).reduce((sum, t) => sum + t.profitLoss, 0);
  const grossLoss = Math.abs(trades.filter(t => t.profitLoss < 0).reduce((sum, t) => sum + t.profitLoss, 0));
  
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const lossRate = totalTrades > 0 ? (losingTrades / totalTrades) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  
  const avgProfitPerWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLossPerLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const avgProfitLossPerTrade = totalTrades > 0 ? totalNetProfitLoss / totalTrades : 0;
  
  // Calculate drawdown
  let runningPnL = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const drawdowns: number[] = [];
  
  for (const trade of trades) {
    runningPnL += trade.profitLoss;
    peak = Math.max(peak, runningPnL);
    const drawdown = peak - runningPnL;
    drawdowns.push(drawdown);
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }
  
  const avgDrawdown = drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length;
  const maxDrawdownPercent = peak > 0 ? (maxDrawdown / peak) * 100 : 0;
  
  // Calculate streaks
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  
  for (const trade of trades) {
    if (trade.profitLoss > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else if (trade.profitLoss < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
      longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
    }
  }
  
  // Calculate profitable/loss days
  const dailyPnL = new Map<string, number>();
  for (const trade of trades) {
    const dateKey = trade.date.toISOString().split('T')[0];
    dailyPnL.set(dateKey, (dailyPnL.get(dateKey) || 0) + trade.profitLoss);
  }
  
  const profitableDays = Array.from(dailyPnL.values()).filter(pnl => pnl > 0).length;
  const lossDays = Array.from(dailyPnL.values()).filter(pnl => pnl < 0).length;

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
    lossDays
  };
}

function generateChartData(trades: Trade[]) {
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

  // Equity Curve
  const equityCurve: EquityCurvePoint[] = [];
  let runningPnL = 0;
  for (const trade of trades) {
    runningPnL += trade.profitLoss;
    equityCurve.push({
      date: format(new Date(trade.date), 'yyyy-MM-dd'),
      value: runningPnL,
      trade: trade.profitLoss
    });
  }

  // Daily P&L
  const dailyPnLMap = new Map<string, number>();
  for (const trade of trades) {
    const dateKey = format(new Date(trade.date), 'yyyy-MM-dd');
    dailyPnLMap.set(dateKey, (dailyPnLMap.get(dateKey) || 0) + trade.profitLoss);
  }
  
  const dailyPnL = Array.from(dailyPnLMap.entries()).map(([date, pnl]) => ({
    date,
    pnl,
    color: pnl >= 0 ? 'green' : 'red'
  }));

  // Win/Loss Distribution
  const winningTrades = trades.filter(t => t.profitLoss > 0).length;
  const losingTrades = trades.filter(t => t.profitLoss < 0).length;
  const winLossDistribution = [
    { name: 'Winning Trades', value: winningTrades, color: '#22c55e' },
    { name: 'Losing Trades', value: losingTrades, color: '#ef4444' }
  ];

  // Profit/Loss Distribution (histogram)
  const profitLossDistribution = createHistogram(trades.map(t => t.profitLoss));

  // Hourly Performance
  const hourlyMap = new Map<number, { pnl: number, count: number }>();
  for (const trade of trades) {
    const hour = getHours(new Date(`${trade.date}T${trade.time}`));
    const current = hourlyMap.get(hour) || { pnl: 0, count: 0 };
    hourlyMap.set(hour, { pnl: current.pnl + trade.profitLoss, count: current.count + 1 });
  }
  
  const hourlyPerformance = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour: `${hour}:00`,
    avgPnL: data.pnl / data.count,
    totalPnL: data.pnl,
    trades: data.count
  }));

  // Weekly Performance
  const weeklyMap = new Map<number, { pnl: number, count: number }>();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (const trade of trades) {
    const day = getDay(new Date(trade.date));
    const current = weeklyMap.get(day) || { pnl: 0, count: 0 };
    weeklyMap.set(day, { pnl: current.pnl + trade.profitLoss, count: current.count + 1 });
  }
  
  const weeklyPerformance = Array.from(weeklyMap.entries()).map(([day, data]) => ({
    day: dayNames[day],
    avgPnL: data.pnl / data.count,
    totalPnL: data.pnl,
    trades: data.count
  }));

  // Symbol Performance
  const symbolMap = new Map<string, { pnl: number, count: number }>();
  for (const trade of trades) {
    const current = symbolMap.get(trade.symbol) || { pnl: 0, count: 0 };
    symbolMap.set(trade.symbol, { pnl: current.pnl + trade.profitLoss, count: current.count + 1 });
  }
  
  const symbolPerformance = Array.from(symbolMap.entries())
    .map(([symbol, data]) => ({
      symbol,
      totalPnL: data.pnl,
      trades: data.count,
      avgPnL: data.pnl / data.count
    }))
    .sort((a, b) => b.totalPnL - a.totalPnL)
    .slice(0, 10); // Top 10 symbols

  return {
    equityCurve,
    dailyPnL,
    winLossDistribution,
    profitLossDistribution,
    hourlyPerformance,
    weeklyPerformance,
    symbolPerformance
  };
}

function createHistogram(values: number[], bins = 10) {
  if (values.length === 0) {
    return [];
  }
  
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