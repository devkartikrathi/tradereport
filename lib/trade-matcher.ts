export interface RawTrade {
  date: string;
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  commission?: number;
  time?: string;
  tradeId?: string;
}

export interface MatchedTrade {
  id: string;
  symbol: string;
  buyDate: string;
  sellDate: string;
  buyTime?: string;
  sellTime?: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  commission: number;
  buyTradeId?: string;
  sellTradeId?: string;
  duration?: number; // in minutes
}

export interface OpenPosition {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  date: string;
  time?: string;
  price: number;
  remainingQuantity: number;
  commission: number;
  tradeId?: string;
  currentValue?: number;
}

export interface TradeMatchingResult {
  matchedTrades: MatchedTrade[];
  openPositions: OpenPosition[];
  totalMatched: number;
  totalUnmatched: number;
  netProfit: number;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function calculateDuration(buyDate: string, sellDate: string, buyTime?: string, sellTime?: string): number | undefined {
  if (!buyTime || !sellTime) return undefined;
  
  try {
    const buyDateTime = new Date(`${buyDate} ${buyTime}`);
    const sellDateTime = new Date(`${sellDate} ${sellTime}`);
    const diffMs = sellDateTime.getTime() - buyDateTime.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  } catch {
    return undefined;
  }
}

export function matchTrades(rawTrades: RawTrade[]): TradeMatchingResult {
  // Group trades by symbol
  const tradeMap: { [symbol: string]: RawTrade[] } = {};
  
  for (const trade of rawTrades) {
    if (!tradeMap[trade.symbol]) {
      tradeMap[trade.symbol] = [];
    }
    tradeMap[trade.symbol].push({ ...trade });
  }

  const matchedTrades: MatchedTrade[] = [];
  const openPositions: OpenPosition[] = [];

  // Process each symbol
  for (const symbol in tradeMap) {
    const trades = tradeMap[symbol];
    
    // Separate buys and sells, sort by date
    const buys: (RawTrade & { remainingQty: number })[] = trades
      .filter(t => t.type === "BUY")
      .map(t => ({ ...t, remainingQty: t.quantity }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
    const sells: (RawTrade & { remainingQty: number })[] = trades
      .filter(t => t.type === "SELL")
      .map(t => ({ ...t, remainingQty: t.quantity }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Match trades using FIFO (First In, First Out)
    while (sells.length > 0 && buys.length > 0) {
      const buy = buys[0];
      const sell = sells[0];
      const matchQty = Math.min(buy.remainingQty, sell.remainingQty);
      
      if (matchQty > 0) {
        const profit = (sell.price - buy.price) * matchQty;
        const totalCommission = (buy.commission || 0) + (sell.commission || 0);
        const netProfit = profit - totalCommission;
        
        const duration = calculateDuration(buy.date, sell.date, buy.time, sell.time);

        matchedTrades.push({
          id: generateId(),
          symbol,
          buyDate: buy.date,
          sellDate: sell.date,
          buyTime: buy.time,
          sellTime: sell.time,
          quantity: matchQty,
          buyPrice: buy.price,
          sellPrice: sell.price,
          profit: parseFloat(netProfit.toFixed(2)),
          commission: totalCommission,
          buyTradeId: buy.tradeId,
          sellTradeId: sell.tradeId,
          duration,
        });

        buy.remainingQty -= matchQty;
        sell.remainingQty -= matchQty;
      }

      // Remove fully matched trades
      if (buy.remainingQty === 0) buys.shift();
      if (sell.remainingQty === 0) sells.shift();
    }

    // Add remaining unmatched buys as open long positions
    buys.forEach(buy => {
      if (buy.remainingQty > 0) {
        openPositions.push({
          id: generateId(),
          symbol,
          type: "BUY",
          date: buy.date,
          time: buy.time,
          price: buy.price,
          remainingQuantity: buy.remainingQty,
          commission: buy.commission || 0,
          tradeId: buy.tradeId,
        });
      }
    });

    // Add remaining unmatched sells as open short positions
    sells.forEach(sell => {
      if (sell.remainingQty > 0) {
        openPositions.push({
          id: generateId(),
          symbol,
          type: "SELL",
          date: sell.date,
          time: sell.time,
          price: sell.price,
          remainingQuantity: sell.remainingQty,
          commission: sell.commission || 0,
          tradeId: sell.tradeId,
        });
      }
    });
  }

  const totalMatched = matchedTrades.length;
  const totalUnmatched = openPositions.length;
  const netProfit = matchedTrades.reduce((sum, trade) => sum + trade.profit, 0);

  return {
    matchedTrades,
    openPositions,
    totalMatched,
    totalUnmatched,
    netProfit: parseFloat(netProfit.toFixed(2)),
  };
} 