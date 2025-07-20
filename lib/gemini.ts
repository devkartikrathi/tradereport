import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

interface TradingData {
  hasData: boolean;
  totalTrades?: number;
  totalNetProfitLoss?: number;
  winRate?: number;
  avgProfitLoss?: number;
  hourlyPerformance?: Array<{ hour: number; avgPnL: number; total: number; count: number }>;
  daylyPerformance?: Array<{ day: string; avgPnL: number; total: number; count: number }>;
  symbolPerformance?: Array<{ symbol: string; avgPnL: number; total: number; count: number }>;
}

export async function generateChatResponse(
  message: string, 
  tradingData: TradingData, 
  csvData?: string
): Promise<string> {
  try {
    const prompt = createChatPrompt(message, tradingData, csvData);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate AI response');
  }
}

export async function analyzeCsvData(csvContent: string, userQuestion?: string): Promise<string> {
  try {
    const prompt = createCsvAnalysisPrompt(csvContent, userQuestion);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Gemini CSV analysis error:', error);
    throw new Error('Failed to analyze CSV data');
  }
}

function createChatPrompt(message: string, tradingData: TradingData, csvData?: string): string {
  const basePrompt = `You are TradePulse AI, an expert Indian trading advisor specializing in the Indian stock market (NSE, BSE), crypto, and forex trading. You understand Indian trading terminology, market hours (9:15 AM to 3:30 PM), and regulatory environment (SEBI guidelines).

**Trading Context:**
- All currency values should be displayed in Indian Rupees (₹)
- Consider Indian market dynamics, trading sessions, and typical Indian retail trading patterns
- Reference Indian brokers, tax implications (STCG, LTCG), and compliance requirements when relevant
- Use Indian English and trading terminology familiar to Indian traders

**User's Trading Data Summary:**
${tradingData.hasData ? `
- Total Trades: ${tradingData.totalTrades}
- Net P&L: ₹${tradingData.totalNetProfitLoss?.toLocaleString('en-IN')}
- Win Rate: ${tradingData.winRate?.toFixed(1)}%
- Average P&L per Trade: ₹${tradingData.avgProfitLoss?.toLocaleString('en-IN')}
- Best Trading Hour: ${tradingData.hourlyPerformance?.[0]?.hour}:00
- Best Trading Day: ${tradingData.daylyPerformance?.[0]?.day}
- Top Performing Symbol: ${tradingData.symbolPerformance?.[0]?.symbol}
  ` : 'No trading data available yet. User needs to upload trading data files first.'}

${csvData ? `**Raw CSV Data for Deep Analysis:**\n${csvData}\n\n` : ''}

**User Question:** ${message}

**Instructions:**
1. Provide specific, actionable insights based on the user's actual trading data
2. Use Indian context and terminology
3. Format all monetary values in Indian Rupees (₹) with proper Indian number formatting
4. Include emojis for better readability
5. Provide practical advice suitable for Indian retail traders
6. If analyzing patterns, consider Indian market timings and session dynamics
7. Keep responses conversational but professional
8. If data is insufficient, guide the user on what additional information would help

**Response Format:**
- Use clear headings with emojis
- Bullet points for key insights
- Specific numbers from their data
- Actionable recommendations
- Cultural context appropriate for Indian traders`;

  return basePrompt;
}

function createCsvAnalysisPrompt(csvContent: string, userQuestion?: string): string {
  const prompt = `You are TradePulse AI, an expert trading analyst for Indian markets. Analyze the provided CSV trading data and provide comprehensive insights.

**CSV Trading Data:**
${csvContent}

**Analysis Instructions:**
1. Parse and understand the trading data structure
2. Calculate key performance metrics relevant to Indian traders:
   - Total P&L in Indian Rupees (₹)
   - Win/Loss ratio and percentages
   - Best and worst performing stocks/instruments
   - Time-based patterns (consider Indian market hours 9:15 AM - 3:30 PM)
   - Day-wise performance patterns
   - Risk metrics and drawdown analysis
   - Trading frequency and position sizing patterns

3. Provide insights considering Indian market context:
   - NSE/BSE trading patterns
   - Sector-wise performance if applicable
   - Intraday vs delivery trading patterns
   - Volatility analysis during different market sessions

**Specific Question:** ${userQuestion || 'Provide a comprehensive trading performance analysis'}

**Output Format:**
1. **📊 Performance Summary**
   - Key metrics in Indian Rupees
   - Overall assessment

2. **📈 Strengths & Opportunities**
   - What's working well
   - Areas of strong performance

3. **⚠️ Areas for Improvement**
   - Weak points identified
   - Risk management issues

4. **🎯 Actionable Recommendations**
   - Specific steps to improve performance
   - Risk management suggestions
   - Timing optimization

5. **🔍 Pattern Analysis**
   - Time-based patterns
   - Symbol/sector patterns
   - Behavioral patterns

Use Indian number formatting for currency (₹1,23,456) and provide context suitable for Indian retail traders.`;

  return prompt;
}

export async function generateTradingInsights(tradingData: TradingData): Promise<string> {
  try {
    const prompt = `As TradePulse AI, analyze this Indian trader's performance data and provide personalized insights:

Trading Performance Data:
${JSON.stringify(tradingData, null, 2)}

Provide a comprehensive analysis covering:
1. Overall performance assessment
2. Risk management evaluation
3. Time-based trading patterns
4. Symbol/sector preferences
5. Specific improvement recommendations

Format all currency in Indian Rupees and provide context relevant to Indian markets.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Gemini insights error:', error);
    throw new Error('Failed to generate trading insights');
  }
} 