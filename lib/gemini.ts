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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function generateContextualResponse(
  message: string,
  conversationHistory: ChatMessage[],
  tradingData: TradingData,
  csvData?: string
): Promise<string> {
  try {
    const prompt = createContextualPrompt(message, conversationHistory, tradingData, csvData);

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error('Gemini contextual API error:', error);
    throw new Error('Failed to generate contextual AI response');
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

export async function generateBehavioralAnalysis(
  tradingData: TradingData,
  patterns: {
    emotional: unknown[];
    riskTaking: unknown[];
    consistency: unknown[];
    discipline: unknown[];
  }
): Promise<string> {
  try {
    const prompt = createBehavioralAnalysisPrompt(tradingData, patterns);

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error('Gemini behavioral analysis error:', error);
    throw new Error('Failed to generate behavioral analysis');
  }
}

export async function generateRiskAnalysis(
  tradingData: TradingData,
  riskMetrics: {
    positionSizing: unknown;
    riskReward: unknown;
    stopLoss: unknown;
    portfolioRisk: unknown;
  }
): Promise<string> {
  try {
    const prompt = createRiskAnalysisPrompt(tradingData, riskMetrics);

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error('Gemini risk analysis error:', error);
    throw new Error('Failed to generate risk analysis');
  }
}

export async function generateGoalInsights(
  tradingData: TradingData,
  goals: Record<string, unknown>[]
): Promise<string> {
  try {
    const prompt = createGoalInsightsPrompt(tradingData, goals);

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error('Gemini goal insights error:', error);
    throw new Error('Failed to generate goal insights');
  }
}

export async function generateMarketContextAnalysis(
  tradingData: TradingData,
  marketData: Record<string, unknown>
): Promise<string> {
  try {
    const prompt = createMarketContextAnalysisPrompt(tradingData, marketData);

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error('Gemini market context analysis error:', error);
    throw new Error('Failed to generate market context analysis');
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

function createContextualPrompt(
  message: string,
  conversationHistory: ChatMessage[],
  tradingData: TradingData,
  csvData?: string
): string {
  const conversationContext = conversationHistory
    .slice(-5) // Last 5 messages for context
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const basePrompt = `You are TradePulse AI, an expert Indian trading advisor specializing in the Indian stock market (NSE, BSE), crypto, and forex trading. You understand Indian trading terminology, market hours (9:15 AM to 3:30 PM), and regulatory environment (SEBI guidelines).

**Previous Conversation Context:**
${conversationContext ? `\n${conversationContext}\n` : 'No previous conversation context.'}

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

**Current User Question:** ${message}

**Instructions:**
1. Consider the conversation context when providing your response
2. Provide specific, actionable insights based on the user's actual trading data
3. Use Indian context and terminology
4. Format all monetary values in Indian Rupees (₹) with proper Indian number formatting
5. Include emojis for better readability
6. Provide practical advice suitable for Indian retail traders
7. If analyzing patterns, consider Indian market timings and session dynamics
8. Keep responses conversational but professional
9. If data is insufficient, guide the user on what additional information would help
10. Build upon previous conversation context when relevant

**Response Format:**
- Use clear headings with emojis
- Bullet points for key insights
- Specific numbers from their data
- Actionable recommendations
- Cultural context appropriate for Indian traders
- Reference previous conversation points when relevant`;

  return basePrompt;
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

function createBehavioralAnalysisPrompt(
  tradingData: TradingData,
  patterns: {
    emotional: unknown[];
    riskTaking: unknown[];
    consistency: unknown[];
    discipline: unknown[];
  }
): string {
  return `You are TradePulse AI, an expert Indian trading psychologist and behavioral analyst specializing in Indian retail trading patterns. You understand the unique psychological challenges faced by Indian traders.

**Trading Context:**
- All currency values should be displayed in Indian Rupees (₹)
- Consider Indian market dynamics and cultural factors
- Reference Indian trading psychology and behavioral patterns
- Use Indian English and trading terminology

**User's Trading Data:**
${tradingData.hasData ? `
- Total Trades: ${tradingData.totalTrades}
- Net P&L: ₹${tradingData.totalNetProfitLoss?.toLocaleString('en-IN')}
- Win Rate: ${tradingData.winRate?.toFixed(1)}%
- Average P&L per Trade: ₹${tradingData.avgProfitLoss?.toLocaleString('en-IN')}
` : 'No trading data available yet.'}

**Detected Behavioral Patterns:**

**Emotional Patterns:** ${patterns.emotional.length > 0 ? patterns.emotional.map((p: unknown) => `• ${(p as { type: string; description: string }).type}: ${(p as { type: string; description: string }).description}`).join('\n') : 'None detected'}

**Risk-Taking Patterns:** ${patterns.riskTaking.length > 0 ? patterns.riskTaking.map((p: unknown) => `• ${(p as { type: string; description: string }).type}: ${(p as { type: string; description: string }).description}`).join('\n') : 'None detected'}

**Consistency Patterns:** ${patterns.consistency.length > 0 ? patterns.consistency.map((p: unknown) => `• ${(p as { type: string; description: string }).type}: ${(p as { type: string; description: string }).description}`).join('\n') : 'None detected'}

**Discipline Patterns:** ${patterns.discipline.length > 0 ? patterns.discipline.map((p: unknown) => `• ${(p as { type: string; description: string }).type}: ${(p as { type: string; description: string }).description}`).join('\n') : 'None detected'}

**Task:** Analyze the user's behavioral patterns and provide personalized improvement recommendations.

**Instructions:**
1. Identify the most critical behavioral issues
2. Provide specific, actionable strategies for improvement
3. Consider Indian trading psychology and cultural factors
4. Focus on emotional control and discipline
5. Provide step-by-step improvement plans
6. Use encouraging but realistic language

**Response Format:**
- Start with a behavioral summary
- Identify 3-5 key improvement areas
- Provide specific strategies for each area
- Include progress tracking suggestions
- End with motivational encouragement

**Focus Areas:**
• Emotional control and FOMO management
• Risk management and position sizing
• Trading consistency and discipline
• Learning from mistakes
• Continuous improvement mindset`;
}

function createRiskAnalysisPrompt(
  tradingData: TradingData,
  riskMetrics: {
    positionSizing: unknown;
    riskReward: unknown;
    stopLoss: unknown;
    portfolioRisk: unknown;
  }
): string {
  return `You are TradePulse AI, an expert Indian risk management specialist specializing in Indian retail trading. You understand the unique risk management challenges faced by Indian traders.

**Trading Context:**
- All currency values should be displayed in Indian Rupees (₹)
- Consider Indian market dynamics and risk management practices
- Reference Indian trading regulations and best practices
- Use Indian English and trading terminology

**User's Trading Data:**
${tradingData.hasData ? `
- Total Trades: ${tradingData.totalTrades}
- Net P&L: ₹${tradingData.totalNetProfitLoss?.toLocaleString('en-IN')}
- Win Rate: ${tradingData.winRate?.toFixed(1)}%
- Average P&L per Trade: ₹${tradingData.avgProfitLoss?.toLocaleString('en-IN')}
` : 'No trading data available yet.'}

**Risk Management Analysis:**

**Position Sizing Metrics:** ${JSON.stringify(riskMetrics.positionSizing, null, 2)}

**Risk-Reward Analysis:** ${JSON.stringify(riskMetrics.riskReward, null, 2)}

**Stop-Loss Strategies:** ${JSON.stringify(riskMetrics.stopLoss, null, 2)}

**Portfolio Risk Assessment:** ${JSON.stringify(riskMetrics.portfolioRisk, null, 2)}

**Task:** Analyze the user's risk management practices and provide personalized risk management recommendations.

**Instructions:**
1. Identify critical risk management issues
2. Provide specific, actionable risk management strategies
3. Consider Indian market context and regulations
4. Focus on capital protection and risk control
5. Provide step-by-step risk management plans
6. Use clear, practical language

**Response Format:**
- Start with a risk management summary
- Identify 3-5 key risk management areas for improvement
- Provide specific strategies for each area
- Include position sizing recommendations
- Add stop-loss strategy suggestions
- End with risk management best practices

**Focus Areas:**
• Position sizing and capital allocation
• Risk-reward ratio optimization
• Stop-loss strategy implementation
  • Portfolio diversification
  • Risk-adjusted returns improvement`;
}

function createGoalInsightsPrompt(
  tradingData: TradingData,
  goals: Record<string, unknown>[]
): string {
  return `You are TradePulse AI, an expert Indian trading performance analyst specializing in goal setting and achievement. You understand the unique challenges faced by Indian retail traders in achieving their performance goals.

**Trading Context:**
- All currency values should be displayed in Indian Rupees (₹)
- Consider Indian market dynamics and trading patterns
- Reference Indian trading psychology and goal achievement
- Use Indian English and trading terminology

**User's Trading Data:**
${tradingData.hasData ? `
- Total Trades: ${tradingData.totalTrades}
- Net P&L: ₹${tradingData.totalNetProfitLoss?.toLocaleString('en-IN')}
- Win Rate: ${tradingData.winRate?.toFixed(1)}%
- Average P&L per Trade: ₹${tradingData.avgProfitLoss?.toLocaleString('en-IN')}
` : 'No trading data available yet.'}

**Performance Goals:**
${goals.map(goal => `
- Goal: ${goal.title || 'Unknown'}
- Category: ${goal.category || 'Unknown'}
- Target: ${goal.targetValue || 0}
- Current Progress: ${typeof goal.progress === 'number' ? goal.progress.toFixed(1) : '0'}%
- Status: ${goal.isActive ? 'Active' : 'Inactive'}
`).join('\n')}

**Task:** Analyze the user's performance goals and provide personalized insights and recommendations for goal achievement.

**Instructions:**
1. Analyze each goal's achievability based on current performance
2. Provide specific strategies for goal improvement
3. Consider Indian trading context and market conditions
4. Focus on realistic and actionable recommendations
5. Provide step-by-step improvement plans
6. Use encouraging but realistic language

**Response Format:**
- Start with a goal achievement summary
- Identify 3-5 key improvement areas for each goal
- Provide specific strategies for each area
- Include progress optimization suggestions
- Add goal adjustment recommendations if needed
- End with motivational encouragement

**Focus Areas:**
• Goal achievability assessment
• Performance optimization strategies
• Progress tracking and milestone identification
  • Goal adjustment recommendations
  • Motivation and consistency building`;
}

function createMarketContextAnalysisPrompt(
  tradingData: TradingData,
  marketData: Record<string, unknown>
): string {
  return `You are TradePulse AI, an expert Indian market analyst specializing in market context integration for trading decisions. You understand the unique dynamics of Indian markets and how they impact trading strategies.

**Trading Context:**
- All currency values should be displayed in Indian Rupees (₹)
- Consider Indian market dynamics and trading patterns
- Reference Indian market psychology and trading behavior
- Use Indian English and trading terminology

**User's Trading Data:**
${tradingData.hasData ? `
- Total Trades: ${tradingData.totalTrades}
- Net P&L: ₹${tradingData.totalNetProfitLoss?.toLocaleString('en-IN')}
- Win Rate: ${tradingData.winRate?.toFixed(1)}%
- Average P&L per Trade: ₹${tradingData.avgProfitLoss?.toLocaleString('en-IN')}
` : 'No trading data available yet.'}

**Market Context Data:**
${marketData.indices ? `
- NIFTY: ₹${String((marketData.indices as Record<string, unknown>).nifty?.value || 'N/A')} (${String((marketData.indices as Record<string, unknown>).nifty?.changePercent || '0.00')}%)
- SENSEX: ₹${String((marketData.indices as Record<string, unknown>).sensex?.value || 'N/A')} (${String((marketData.indices as Record<string, unknown>).sensex?.changePercent || '0.00')}%)
- BANKNIFTY: ₹${String((marketData.indices as Record<string, unknown>).banknifty?.value || 'N/A')} (${String((marketData.indices as Record<string, unknown>).banknifty?.changePercent || '0.00')}%)
` : 'Market data not available.'}

${marketData.volatility ? `
- VIX: ${String((marketData.volatility as Record<string, unknown>).vix || 'N/A')}
- Market Volatility: ${String((marketData.volatility as Record<string, unknown>).niftyVolatility || 'N/A')}%
` : ''}

**Task:** Analyze the current market context and provide context-aware trading insights and recommendations.

**Instructions:**
1. Analyze market conditions and their impact on trading strategies
2. Provide context-aware trading recommendations
3. Consider market volatility and its implications
4. Analyze sector performance and opportunities
5. Provide risk assessment based on market context
6. Give actionable trading advice considering market conditions

**Response Format:**
- Start with a market condition summary
- Provide context-aware trading recommendations
- Analyze sector opportunities and risks
- Include volatility-based risk assessment
- Add market-aware position sizing advice
- End with actionable next steps

**Focus Areas:**
• Market condition analysis and impact on trading
• Context-aware position sizing and risk management
• Sector rotation opportunities and risks
• Volatility-based trading strategies
• Market-aware entry and exit timing
• Risk assessment considering market context`;
} 