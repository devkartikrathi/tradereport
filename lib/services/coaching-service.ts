import { PrismaClient } from "@prisma/client";
import { AnalyticsService } from "./analytics-service";
import { generateTradingInsights } from "@/lib/gemini";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();
const analyticsService = new AnalyticsService();

export interface CoachingInsight {
    id: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: string;
    actionable: boolean;
}

export interface CoachingData {
    strengths: CoachingInsight[];
    weaknesses: CoachingInsight[];
    recommendations: string[];
    lastUpdated: string;
    dataPoints: number;
}

export class CoachingService {
    private generateInsightId(): string {
        return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private categorizeInsight(title: string, description: string): string {
        const text = `${title} ${description}`.toLowerCase();

        if (text.includes('risk') || text.includes('stop loss') || text.includes('position size')) {
            return 'Risk Management';
        }
        if (text.includes('time') || text.includes('hour') || text.includes('day') || text.includes('timing')) {
            return 'Timing';
        }
        if (text.includes('emotion') || text.includes('psychology') || text.includes('fear') || text.includes('greed')) {
            return 'Psychology';
        }
        if (text.includes('strategy') || text.includes('pattern') || text.includes('approach')) {
            return 'Strategy';
        }

        return 'General';
    }

    private assessImpact(description: string): 'high' | 'medium' | 'low' {
        const text = description.toLowerCase();

        // High impact indicators
        if (text.includes('significant') || text.includes('major') || text.includes('critical') ||
            text.includes('substantial') || text.includes('considerable')) {
            return 'high';
        }

        // Medium impact indicators
        if (text.includes('moderate') || text.includes('noticeable') || text.includes('important') ||
            text.includes('valuable') || text.includes('beneficial')) {
            return 'medium';
        }

        return 'low';
    }

    private parseAIResponse(response: string): {
        strengths: CoachingInsight[];
        weaknesses: CoachingInsight[];
        recommendations: string[];
    } {
        const strengths: CoachingInsight[] = [];
        const weaknesses: CoachingInsight[] = [];
        const recommendations: string[] = [];

        try {
            // Split response into sections
            const sections = response.split(/(?:STRENGTHS|WEAKNESSES|RECOMMENDATIONS):/i);

            if (sections.length >= 4) {
                // Parse strengths
                const strengthsText = sections[1]?.trim();
                if (strengthsText) {
                    const strengthLines = strengthsText.split('\n').filter(line => line.trim());
                    strengthLines.forEach((line, index) => {
                        if (line.trim()) {
                            const title = line.split(':')[0]?.trim() || `Strength ${index + 1}`;
                            const description = line.split(':')[1]?.trim() || line.trim();

                            strengths.push({
                                id: this.generateInsightId(),
                                title,
                                description,
                                impact: this.assessImpact(description),
                                category: this.categorizeInsight(title, description),
                                actionable: true
                            });
                        }
                    });
                }

                // Parse weaknesses
                const weaknessesText = sections[2]?.trim();
                if (weaknessesText) {
                    const weaknessLines = weaknessesText.split('\n').filter(line => line.trim());
                    weaknessLines.forEach((line, index) => {
                        if (line.trim()) {
                            const title = line.split(':')[0]?.trim() || `Weakness ${index + 1}`;
                            const description = line.split(':')[1]?.trim() || line.trim();

                            weaknesses.push({
                                id: this.generateInsightId(),
                                title,
                                description,
                                impact: this.assessImpact(description),
                                category: this.categorizeInsight(title, description),
                                actionable: true
                            });
                        }
                    });
                }

                // Parse recommendations
                const recommendationsText = sections[3]?.trim();
                if (recommendationsText) {
                    const recommendationLines = recommendationsText.split('\n').filter(line => line.trim());
                    recommendationLines.forEach((line) => {
                        if (line.trim() && !line.startsWith('-') && !line.startsWith('•')) {
                            recommendations.push(line.trim());
                        }
                    });
                }
            }
        } catch (error) {
            logger.error("Error parsing AI response", { error });
        }

        return { strengths, weaknesses, recommendations };
    }

    async generateCoachingInsights(userId: string): Promise<CoachingData> {
        try {
            // Get user's analytics data
            const analyticsData = await analyticsService.getUserAnalytics(userId);

            if (!analyticsData || analyticsData.analytics.totalTrades === 0) {
                return {
                    strengths: [],
                    weaknesses: [],
                    recommendations: [
                        "Upload your first trading data to get personalized insights",
                        "Start with a small amount of data to establish baseline patterns",
                        "Focus on consistency in your trading approach"
                    ],
                    lastUpdated: new Date().toISOString(),
                    dataPoints: 0
                };
            }

            // Prepare trading data for AI analysis
            const tradingData = {
                hasData: true,
                totalTrades: analyticsData.analytics.totalTrades,
                totalNetProfitLoss: analyticsData.analytics.totalNetProfitLoss,
                winRate: analyticsData.analytics.winRate,
                avgProfitLoss: analyticsData.analytics.avgProfitLossPerTrade
            };

            // Generate AI insights
            const aiResponse = await generateTradingInsights(tradingData);

            // Parse AI response
            const { strengths, weaknesses, recommendations } = this.parseAIResponse(aiResponse);

            // Add fallback insights if AI didn't provide enough data
            if (strengths.length === 0 && weaknesses.length === 0) {
                // Generate basic insights based on analytics
                if (analyticsData.analytics.winRate > 0.6) {
                    strengths.push({
                        id: this.generateInsightId(),
                        title: "Strong Win Rate",
                        description: `Your win rate of ${(analyticsData.analytics.winRate * 100).toFixed(1)}% is above average, indicating good trade selection.`,
                        impact: 'medium',
                        category: 'Strategy',
                        actionable: true
                    });
                }

                if (analyticsData.analytics.profitFactor > 1.5) {
                    strengths.push({
                        id: this.generateInsightId(),
                        title: "Good Profit Factor",
                        description: `Your profit factor of ${analyticsData.analytics.profitFactor.toFixed(2)} shows you're making more on winning trades than losing on losing trades.`,
                        impact: 'medium',
                        category: 'Risk Management',
                        actionable: true
                    });
                }

                if (analyticsData.analytics.maxDrawdown > 20) {
                    weaknesses.push({
                        id: this.generateInsightId(),
                        title: "High Drawdown",
                        description: `Your maximum drawdown of ${analyticsData.analytics.maxDrawdown.toFixed(1)}% is quite high. Consider improving risk management.`,
                        impact: 'high',
                        category: 'Risk Management',
                        actionable: true
                    });
                }

                if (analyticsData.analytics.winRate < 0.4) {
                    weaknesses.push({
                        id: this.generateInsightId(),
                        title: "Low Win Rate",
                        description: `Your win rate of ${(analyticsData.analytics.winRate * 100).toFixed(1)}% suggests room for improvement in trade selection.`,
                        impact: 'high',
                        category: 'Strategy',
                        actionable: true
                    });
                }
            }

            // Add fallback recommendations if AI didn't provide enough
            if (recommendations.length === 0) {
                recommendations.push(
                    "Focus on maintaining a consistent risk-reward ratio",
                    "Consider reducing position sizes during losing streaks",
                    "Track your emotions during trades to identify patterns",
                    "Review your best trades to understand what worked well"
                );
            }

            logger.info("Generated coaching insights", {
                userId,
                strengthsCount: strengths.length,
                weaknessesCount: weaknesses.length,
                recommendationsCount: recommendations.length,
                dataPoints: analyticsData.analytics.totalTrades
            });

            return {
                strengths: strengths.slice(0, 5), // Limit to top 5
                weaknesses: weaknesses.slice(0, 5), // Limit to top 5
                recommendations: recommendations.slice(0, 5), // Limit to top 5
                lastUpdated: new Date().toISOString(),
                dataPoints: analyticsData.analytics.totalTrades
            };

        } catch (error) {
            logger.error("Error generating coaching insights", {
                userId,
                error: error instanceof Error ? error.message : "Unknown error"
            });

            // Return fallback data
            return {
                strengths: [],
                weaknesses: [],
                recommendations: [
                    "Unable to analyze trading data at this time",
                    "Please ensure your data is properly uploaded",
                    "Try refreshing the page or uploading more data"
                ],
                lastUpdated: new Date().toISOString(),
                dataPoints: 0
            };
        }
    }

    async getUserCoachingData(userId: string): Promise<CoachingData> {
        try {
            // Check if user has analytics data
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    analytics: true,
                    trades: {
                        take: 1 // Just check if trades exist
                    }
                }
            });

            if (!user || !user.analytics || user.trades.length === 0) {
                return {
                    strengths: [],
                    weaknesses: [],
                    recommendations: [
                        "Upload your trading data to get personalized coaching insights",
                        "Start with at least 10-20 trades for meaningful analysis",
                        "Include both winning and losing trades for balanced insights"
                    ],
                    lastUpdated: new Date().toISOString(),
                    dataPoints: 0
                };
            }

            return await this.generateCoachingInsights(userId);

        } catch (error) {
            logger.error("Error getting user coaching data", {
                userId,
                error: error instanceof Error ? error.message : "Unknown error"
            });

            return {
                strengths: [],
                weaknesses: [],
                recommendations: [
                    "Unable to load coaching insights",
                    "Please try again later",
                    "Contact support if the issue persists"
                ],
                lastUpdated: new Date().toISOString(),
                dataPoints: 0
            };
        }
    }
}

export const coachingService = new CoachingService(); 