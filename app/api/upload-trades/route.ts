import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { parseEnhancedCSV, EnhancedParsedTrade } from '@/lib/enhanced-csv-parser';
import { matchTrades, RawTrade, TradeMatchingResult } from '@/lib/trade-matcher';
import { analyzeCsvData } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the uploaded file and broker info
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brokerHint = formData.get('broker') as string | null;
    const isIncremental = formData.get('incremental') === 'true'; // For adding more data

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Please upload a CSV file' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Read file content
    const csvContent = await file.text();
    
    // Parse CSV with enhanced AI-powered column mapping
    const parseResult = await parseEnhancedCSV(csvContent);
    
    if (parseResult.errors.length > 0 && parseResult.validRows === 0) {
      return NextResponse.json({ 
        error: 'No valid trades found in CSV',
        details: parseResult.errors.slice(0, 10) // Limit error messages
      }, { status: 400 });
    }

    // Get or create user in database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        openPositions: true // Get existing open positions for matching
      }
    });

    if (!user) {
      // Create user if doesn't exist
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: '', // Will be updated later if needed
        },
        include: {
          openPositions: true
        }
      });
    }

    // Convert parsed trades to RawTrade format for matching
    const newRawTrades: RawTrade[] = parseResult.trades.map((trade: EnhancedParsedTrade) => ({
      date: trade.date.toISOString().split('T')[0],
      symbol: trade.symbol,
      type: trade.tradeType.toUpperCase() as "BUY" | "SELL",
      quantity: trade.quantity,
      price: trade.entryPrice, // Use entryPrice as the actual trade price
      commission: trade.commission,
      time: trade.time,
      tradeId: trade.tradeId,
    }));

    // If not incremental, clear existing data
    if (!isIncremental) {
      await prisma.$transaction(async (tx) => {
        await tx.trade.deleteMany({ where: { userId: user.id } });
        await tx.matchedTrade.deleteMany({ where: { userId: user.id } });
        await tx.openPosition.deleteMany({ where: { userId: user.id } });
        await tx.analytics.deleteMany({ where: { userId: user.id } });
      });
    }

    // Combine new trades with existing open positions for matching
    const existingOpenTrades: RawTrade[] = user.openPositions.map(pos => ({
      date: pos.date.toISOString().split('T')[0],
      symbol: pos.symbol,
      type: pos.type as "BUY" | "SELL",
      quantity: pos.remainingQuantity,
      price: pos.price,
      commission: pos.commission,
      time: pos.time || '00:00:00',
      tradeId: pos.tradeId || '',
    }));

    // Combine all trades for matching
    const allRawTrades = [...existingOpenTrades, ...newRawTrades];

    // **STEP 1: MATCH TRADES FIRST**
    if (process.env.NODE_ENV === 'development') {
      console.log('Starting trade matching...');
    }
    const matchingResult: TradeMatchingResult = matchTrades(allRawTrades);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Trade matching completed:
        - Matched trades: ${matchingResult.totalMatched}
        - Open positions: ${matchingResult.totalUnmatched}
        - Net profit: ₹${matchingResult.netProfit}`);
    }

    // Store the trade matching results in database
    await prisma.$transaction(async (tx) => {
      // Clear existing matched trades and open positions if not incremental
      if (!isIncremental) {
        await tx.matchedTrade.deleteMany({ where: { userId: user.id } });
        await tx.openPosition.deleteMany({ where: { userId: user.id } });
      } else {
        // For incremental, clear all since we re-matched everything
        await tx.matchedTrade.deleteMany({ where: { userId: user.id } });
        await tx.openPosition.deleteMany({ where: { userId: user.id } });
      }

      // Insert matched trades
      if (matchingResult.matchedTrades.length > 0) {
        await tx.matchedTrade.createMany({
          data: matchingResult.matchedTrades.map(match => ({
            userId: user.id,
            symbol: match.symbol,
            buyDate: new Date(match.buyDate),
            sellDate: new Date(match.sellDate),
            buyTime: match.buyTime,
            sellTime: match.sellTime,
            quantity: match.quantity,
            buyPrice: match.buyPrice,
            sellPrice: match.sellPrice,
            profit: match.profit,
            commission: match.commission,
            buyTradeId: match.buyTradeId,
            sellTradeId: match.sellTradeId,
            duration: match.duration,
          }))
        });
      }

      // Insert open positions
      if (matchingResult.openPositions.length > 0) {
        await tx.openPosition.createMany({
          data: matchingResult.openPositions.map(pos => ({
            userId: user.id,
            symbol: pos.symbol,
            type: pos.type,
            date: new Date(pos.date),
            time: pos.time,
            price: pos.price,
            remainingQuantity: pos.remainingQuantity,
            commission: pos.commission,
            tradeId: pos.tradeId,
          }))
        });
      }

      // Also store individual raw trades for reference
      const tradesToInsert = parseResult.trades.map((trade: EnhancedParsedTrade) => ({
        tradeId: trade.tradeId,
        userId: user.id,
        date: trade.date,
        time: trade.time,
        symbol: trade.symbol,
        tradeType: trade.tradeType,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        quantity: trade.quantity,
        commission: trade.commission,
        profitLoss: trade.profitLoss,
        duration: trade.duration,
      }));

      if (!isIncremental) {
        await tx.trade.createMany({ data: tradesToInsert });
      } else {
        // For incremental, only add new trades
        await tx.trade.createMany({ data: tradesToInsert });
      }
    });

    // **STEP 2: CALCULATE ANALYTICS ON MATCHED TRADES ONLY**
    await calculateAndStoreAnalyticsFromMatches(user.id);

    // Optional: Generate AI insights if Gemini is configured
    let aiInsights = null;
    try {
      if (process.env.GOOGLE_API_KEY) {
        const analysisData = `
Matched Trades: ${matchingResult.totalMatched}
Open Positions: ${matchingResult.totalUnmatched}
Net Profit: ₹${matchingResult.netProfit}
Success Rate: ${matchingResult.totalMatched > 0 ? ((matchingResult.matchedTrades.filter(t => t.profit > 0).length / matchingResult.totalMatched) * 100).toFixed(1) : 0}%

Recent matched trades data:
${matchingResult.matchedTrades.slice(0, 10).map(t => 
  `${t.symbol}: ${t.quantity} shares, ₹${t.buyPrice} → ₹${t.sellPrice}, Profit: ₹${t.profit}`
).join('\n')}
        `;
        aiInsights = await analyzeCsvData(analysisData, "Analyze this trading performance focusing on matched trades and provide insights");
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('AI analysis failed, continuing without insights:', error);
      }
    }

    return NextResponse.json({
      message: 'Trades uploaded and matched successfully',
      summary: {
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        errors: parseResult.errors.length,
        uploaded: parseResult.trades.length,
        brokerDetected: parseResult.brokerDetected || brokerHint,
        brokerHint: brokerHint,
        columnMapping: parseResult.columnMapping
      },
      matching: {
        totalMatched: matchingResult.totalMatched,
        totalUnmatched: matchingResult.totalUnmatched,
        netProfit: matchingResult.netProfit,
        openPositions: matchingResult.openPositions.length,
        matchedTrades: matchingResult.matchedTrades.length
      },
      aiInsights,
      errors: parseResult.errors.length > 0 ? parseResult.errors.slice(0, 10) : undefined
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// **NEW: Calculate analytics based on matched trades only**
async function calculateAndStoreAnalyticsFromMatches(userId: string) {
  // Get all matched trades for the user
  const matchedTrades = await prisma.matchedTrade.findMany({
    where: { userId },
    orderBy: { buyDate: 'asc' }
  });

  if (matchedTrades.length === 0) {
    // If no matched trades, set analytics to zero
    await prisma.analytics.upsert({
      where: { userId },
      create: {
        userId,
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
      },
      update: {
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
        lastCalculated: new Date()
      }
    });
    return;
  }

  // Calculate metrics based on matched trades
  const totalTrades = matchedTrades.length;
  const winningTrades = matchedTrades.filter(t => t.profit > 0).length;
  const losingTrades = matchedTrades.filter(t => t.profit < 0).length;
  const totalNetProfitLoss = matchedTrades.reduce((sum, t) => sum + t.profit, 0);
  const grossProfit = matchedTrades.filter(t => t.profit > 0).reduce((sum, t) => sum + t.profit, 0);
  const grossLoss = Math.abs(matchedTrades.filter(t => t.profit < 0).reduce((sum, t) => sum + t.profit, 0));
  
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const lossRate = totalTrades > 0 ? (losingTrades / totalTrades) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  
  const avgProfitPerWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLossPerLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const avgProfitLossPerTrade = totalTrades > 0 ? totalNetProfitLoss / totalTrades : 0;
  
  // Calculate drawdown based on cumulative matched trade profits
  let runningPnL = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const drawdowns: number[] = [];
  
  for (const trade of matchedTrades) {
    runningPnL += trade.profit;
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
  
  for (const trade of matchedTrades) {
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
  
  // Calculate profitable/loss days based on sell dates
  const dailyPnL = new Map<string, number>();
  for (const trade of matchedTrades) {
    const dateKey = trade.sellDate.toISOString().split('T')[0];
    dailyPnL.set(dateKey, (dailyPnL.get(dateKey) || 0) + trade.profit);
  }
  
  const profitableDays = Array.from(dailyPnL.values()).filter(pnl => pnl > 0).length;
  const lossDays = Array.from(dailyPnL.values()).filter(pnl => pnl < 0).length;
  
  // Store analytics
  await prisma.analytics.upsert({
    where: { userId },
    create: {
      userId,
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
    },
    update: {
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
      lastCalculated: new Date()
    }
  });
} 