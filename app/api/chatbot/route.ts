import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { generateChatResponse } from '@/lib/gemini';
import { formatCurrency } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the message from the request
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user and their trading data
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        analytics: true,
        trades: {
          orderBy: { date: 'desc' },
          take: 100 // Limit to recent trades for context
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate contextual data for AI
    const contextData = generateContextData(user);
    
    // Get CSV data if available for detailed analysis
    let csvData = '';
    if (user.trades.length > 0) {
      csvData = generateCSVFromTrades(user.trades.slice(0, 50)); // Last 50 trades
    }

    // Generate AI response using Google Gemini
    const response = await generateChatResponse(message, contextData, csvData);

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Chatbot error:', error);
    
    // Fallback to basic response if Gemini fails
    const fallbackResponse = generateFallbackResponse(error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ response: fallbackResponse });
  }
}

function generateContextData(user: any) {
  const analytics = user.analytics;
  const trades = user.trades;
  
  if (!analytics || !trades.length) {
    return {
      hasData: false,
      totalTrades: 0,
      totalNetProfitLoss: 0,
      winRate: 0,
      avgProfitLoss: 0
    };
  }
  
  // Calculate time-based patterns
  const hourlyPerformance = new Map<number, { total: number, count: number }>();
  const daylyPerformance = new Map<number, { total: number, count: number }>();
  const symbolPerformance = new Map<string, { total: number, count: number }>();
  
  for (const trade of trades) {
    const date = new Date(trade.date);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // Hourly performance
    const hourData = hourlyPerformance.get(hour) || { total: 0, count: 0 };
    hourData.total += trade.profitLoss;
    hourData.count += 1;
    hourlyPerformance.set(hour, hourData);
    
    // Daily performance
    const dayData = daylyPerformance.get(dayOfWeek) || { total: 0, count: 0 };
    dayData.total += trade.profitLoss;
    dayData.count += 1;
    daylyPerformance.set(dayOfWeek, dayData);
    
    // Symbol performance
    const symbolData = symbolPerformance.get(trade.symbol) || { total: 0, count: 0 };
    symbolData.total += trade.profitLoss;
    symbolData.count += 1;
    symbolPerformance.set(trade.symbol, symbolData);
  }
  
  return {
    hasData: true,
    analytics,
    trades,
    totalTrades: analytics.totalTrades,
    totalNetProfitLoss: analytics.totalNetProfitLoss,
    winRate: analytics.winRate,
    avgProfitLoss: analytics.avgProfitLossPerTrade,
    hourlyPerformance: Array.from(hourlyPerformance.entries()).map(([hour, data]) => ({
      hour,
      avgPnL: data.total / data.count,
      total: data.total,
      count: data.count
    })).sort((a, b) => b.avgPnL - a.avgPnL),
    daylyPerformance: Array.from(daylyPerformance.entries()).map(([day, data]) => ({
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
      avgPnL: data.total / data.count,
      total: data.total,
      count: data.count
    })).sort((a, b) => b.avgPnL - a.avgPnL),
    symbolPerformance: Array.from(symbolPerformance.entries()).map(([symbol, data]) => ({
      symbol,
      avgPnL: data.total / data.count,
      total: data.total,
      count: data.count
    })).sort((a, b) => b.total - a.total)
  };
}

function generateCSVFromTrades(trades: any[]): string {
  if (!trades.length) return '';
  
  const headers = ['TradeID', 'Date', 'Time', 'Symbol', 'TradeType', 'EntryPrice', 'ExitPrice', 'Quantity', 'Commission', 'ProfitLoss', 'Duration'];
  const csvRows = [headers.join(',')];
  
  for (const trade of trades) {
    const row = [
      trade.tradeId,
      trade.date.toISOString().split('T')[0],
      trade.time,
      trade.symbol,
      trade.tradeType,
      trade.entryPrice,
      trade.exitPrice,
      trade.quantity,
      trade.commission,
      trade.profitLoss,
      trade.duration || ''
    ];
    csvRows.push(row.join(','));
  }
  
  return csvRows.join('\n');
}

function generateFallbackResponse(error: string): string {
  return `I apologize, but I'm experiencing some technical difficulties with my AI processing. 

🔧 **Technical Issue**: ${error}

💡 **What you can do**:
- Try asking your question again in a different way
- Upload your CSV data if you haven't already
- Check our help section for common questions

I'm designed to help you analyze your trading performance with insights about:
- 📊 Overall performance metrics
- 🎯 Win/loss patterns
- ⏰ Time-based trading analysis
- 📈 Symbol performance
- ⚠️ Risk management insights
- 💡 Personalized improvement suggestions

Please try your question again, and I'll do my best to help you with your trading analysis!`;
} 