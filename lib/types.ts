export interface Trade {
  id: string;
  tradeId: string;
  userId: string;
  date: Date;
  time: string;
  symbol: string;
  tradeType: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  commission: number;
  profitLoss: number;
  duration?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  id: string;
  userId: string;
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
  lastCalculated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartData {
  equityCurve: EquityCurvePoint[];
  dailyPnL: DailyPnLPoint[];
  winLossDistribution: WinLossPoint[];
  profitLossDistribution: HistogramPoint[];
  hourlyPerformance: HourlyPerformancePoint[];
  weeklyPerformance: WeeklyPerformancePoint[];
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

export interface WinLossPoint {
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

export interface HourlyPerformancePoint {
  hour: string;
  avgPnL: number;
  totalPnL: number;
  trades: number;
}

export interface WeeklyPerformancePoint {
  day: string;
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