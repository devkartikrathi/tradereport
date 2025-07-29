import { prisma } from '@/lib/prisma';
import { analyticsService } from './analytics-service';
import { generateRiskAnalysis } from '@/lib/gemini';
import { logger } from '@/lib/logger';

export interface RiskMetrics {
    positionSizing: {
        avgPositionSize: number;
        maxPositionSize: number;
        positionSizeRatio: number; // Position size / Account size
        riskPerTrade: number;
        portfolioConcentration: number;
    };
    riskReward: {
        avgRiskRewardRatio: number;
        optimalRiskRewardRatio: number;
        riskAdjustedReturn: number;
        riskRewardTrend: 'improving' | 'declining' | 'stable';
    };
    stopLoss: {
        avgStopLossDistance: number;
        stopLossAdherence: number;
        volatilityAdjustedStopLoss: number;
        trailingStopLossEfficiency: number;
    };
    portfolioRisk: {
        concentrationScore: number;
        correlationRisk: number;
        sectorConcentration: number;
        overallRiskScore: number;
    };
}

export interface RiskAssessment {
    id: string;
    userId: string;
    assessmentType: string;
    riskScore: number;
    recommendations: Record<string, unknown>;
    positionSizingAnalysis: Record<string, unknown>;
    riskRewardAnalysis: Record<string, unknown>;
    stopLossStrategies: Record<string, unknown>;
    createdAt: Date;
}

export interface RiskAnalysis {
    metrics: RiskMetrics;
    positionSizingRecommendations: string[];
    riskRewardGuidance: string[];
    stopLossStrategies: string[];
    portfolioRiskInsights: string[];
    overallRiskScore: number;
    improvementAreas: string[];
    strengths: string[];
    aiRecommendations: string[];
}

export class RiskManagementService {
    /**
     * Analyze user's risk management comprehensively
     */
    async analyzeUserRisk(userId: string): Promise<RiskAnalysis> {
        try {
            // Get user's trading data
            const analyticsData = await analyticsService.getUserAnalytics(userId);
            const user = await prisma.user.findUnique({
                where: { clerkId: userId },
                include: {
                    matchedTrades: {
                        orderBy: { sellDate: 'desc' },
                        take: 1000 // Analyze last 1000 trades
                    },
                    tradingRules: true
                }
            });

            if (!user || user.matchedTrades.length === 0) {
                throw new Error('No trading data available for risk analysis');
            }

            const trades = user.matchedTrades;
            const tradingRules = user.tradingRules;

            // Perform risk analysis
            const [
                positionSizingMetrics,
                riskRewardMetrics,
                stopLossMetrics,
                portfolioRiskMetrics
            ] = await Promise.all([
                this.analyzePositionSizing(trades, tradingRules),
                this.analyzeRiskRewardRatios(trades, tradingRules),
                this.analyzeStopLossStrategies(trades, tradingRules),
                this.analyzePortfolioRisk(trades, tradingRules)
            ]);

            // Generate AI-powered risk insights
            const aiInsights = await this.generateAIRiskInsights(
                trades,
                analyticsData,
                positionSizingMetrics,
                riskRewardMetrics,
                stopLossMetrics,
                portfolioRiskMetrics
            );

            // Calculate overall risk score
            const overallRiskScore = this.calculateOverallRiskScore(
                positionSizingMetrics,
                riskRewardMetrics,
                stopLossMetrics,
                portfolioRiskMetrics
            );

            // Identify improvement areas and strengths
            const improvementAreas = this.identifyImprovementAreas(
                positionSizingMetrics,
                riskRewardMetrics,
                stopLossMetrics,
                portfolioRiskMetrics
            );
            const strengths = this.identifyStrengths(
                positionSizingMetrics,
                riskRewardMetrics,
                stopLossMetrics,
                portfolioRiskMetrics
            );

            return {
                metrics: {
                    positionSizing: positionSizingMetrics,
                    riskReward: riskRewardMetrics,
                    stopLoss: stopLossMetrics,
                    portfolioRisk: portfolioRiskMetrics
                },
                positionSizingRecommendations: this.generatePositionSizingRecommendations(positionSizingMetrics),
                riskRewardGuidance: this.generateRiskRewardGuidance(riskRewardMetrics),
                stopLossStrategies: this.generateStopLossStrategies(stopLossMetrics),
                portfolioRiskInsights: this.generatePortfolioRiskInsights(portfolioRiskMetrics),
                overallRiskScore,
                improvementAreas,
                strengths,
                aiRecommendations: aiInsights.recommendations
            };

        } catch (error) {
            logger.error('Error analyzing user risk', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Analyze position sizing patterns
     */
    private async analyzePositionSizing(trades: any[], tradingRules: any): Promise<RiskMetrics['positionSizing']> {
        const positionSizes = trades.map(trade => trade.quantity * trade.buyPrice);
        const avgPositionSize = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length;
        const maxPositionSize = Math.max(...positionSizes);

        // Calculate position size ratio (assuming account size from trading rules)
        const accountSize = tradingRules?.maxDailyLoss * 50 || 100000; // Estimate account size
        const positionSizeRatio = avgPositionSize / accountSize;

        // Calculate risk per trade (assuming 2% risk per trade)
        const riskPerTrade = avgPositionSize * 0.02;

        // Calculate portfolio concentration
        const symbolPositions = trades.reduce((acc, trade) => {
            acc[trade.symbol] = (acc[trade.symbol] || 0) + (trade.quantity * trade.buyPrice);
            return acc;
        }, {} as Record<string, number>);

        const totalPortfolioValue = Object.values(symbolPositions).reduce((sum, value) => sum + value, 0);
        const maxSymbolPosition = Math.max(...Object.values(symbolPositions));
        const portfolioConcentration = totalPortfolioValue > 0 ? maxSymbolPosition / totalPortfolioValue : 0;

        return {
            avgPositionSize,
            maxPositionSize,
            positionSizeRatio,
            riskPerTrade,
            portfolioConcentration
        };
    }

    /**
     * Analyze risk-reward ratios
     */
    private async analyzeRiskRewardRatios(trades: any[], tradingRules: any): Promise<RiskMetrics['riskReward']> {
        const riskRewardRatios = trades.map(trade => {
            const potentialLoss = trade.quantity * (trade.buyPrice - trade.buyPrice * 0.95); // 5% stop loss
            const potentialProfit = trade.profit || 0;
            return potentialProfit > 0 ? potentialProfit / potentialLoss : 0;
        }).filter(ratio => ratio > 0);

        const avgRiskRewardRatio = riskRewardRatios.length > 0
            ? riskRewardRatios.reduce((sum, ratio) => sum + ratio, 0) / riskRewardRatios.length
            : 0;

        const optimalRiskRewardRatio = tradingRules?.riskRewardRatio || 2.0;

        // Calculate risk-adjusted return
        const totalProfit = trades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
        const totalRisk = trades.reduce((sum, trade) => sum + (trade.quantity * trade.buyPrice * 0.05), 0);
        const riskAdjustedReturn = totalRisk > 0 ? totalProfit / totalRisk : 0;

        // Analyze risk-reward trend
        const recentTrades = trades.slice(0, Math.floor(trades.length * 0.3));
        const olderTrades = trades.slice(Math.floor(trades.length * 0.7));

        const recentAvgRatio = recentTrades.length > 0
            ? recentTrades.reduce((sum, trade) => {
                const potentialLoss = trade.quantity * (trade.buyPrice - trade.buyPrice * 0.95);
                const potentialProfit = trade.profit || 0;
                return sum + (potentialProfit > 0 ? potentialProfit / potentialLoss : 0);
            }, 0) / recentTrades.length
            : 0;

        const olderAvgRatio = olderTrades.length > 0
            ? olderTrades.reduce((sum, trade) => {
                const potentialLoss = trade.quantity * (trade.buyPrice - trade.buyPrice * 0.95);
                const potentialProfit = trade.profit || 0;
                return sum + (potentialProfit > 0 ? potentialProfit / potentialLoss : 0);
            }, 0) / olderTrades.length
            : 0;

        let riskRewardTrend: 'improving' | 'declining' | 'stable' = 'stable';
        if (recentAvgRatio > olderAvgRatio * 1.1) riskRewardTrend = 'improving';
        else if (recentAvgRatio < olderAvgRatio * 0.9) riskRewardTrend = 'declining';

        return {
            avgRiskRewardRatio,
            optimalRiskRewardRatio,
            riskAdjustedReturn,
            riskRewardTrend
        };
    }

    /**
     * Analyze stop-loss strategies
     */
    private async analyzeStopLossStrategies(trades: any[], _tradingRules: any): Promise<RiskMetrics['stopLoss']> {
        // Calculate average stop-loss distance
        const stopLossDistances = trades.map(trade => {
            const entryPrice = trade.buyPrice;
            const exitPrice = trade.sellPrice;
            const stopLossDistance = Math.abs(exitPrice - entryPrice) / entryPrice;
            return stopLossDistance;
        });

        const avgStopLossDistance = stopLossDistances.reduce((sum, distance) => sum + distance, 0) / stopLossDistances.length;

        // Calculate stop-loss adherence (trades that didn't exceed 5% loss)
        const stopLossTrades = trades.filter(trade => {
            const maxLoss = trade.quantity * trade.buyPrice * 0.05;
            return trade.profit > -maxLoss;
        });

        const stopLossAdherence = trades.length > 0 ? stopLossTrades.length / trades.length : 0;

        // Calculate volatility-adjusted stop-loss
        const priceChanges = trades.map(trade => {
            return Math.abs(trade.sellPrice - trade.buyPrice) / trade.buyPrice;
        });

        const volatility = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
        const volatilityAdjustedStopLoss = Math.max(0.02, volatility * 1.5); // At least 2%

        // Calculate trailing stop-loss efficiency
        const trailingStopTrades = trades.filter(trade => {
            const duration = trade.duration || 0;
            return duration > 60; // Trades longer than 1 hour
        });

        const trailingStopLossEfficiency = trailingStopTrades.length > 0
            ? trailingStopTrades.filter(trade => trade.profit > 0).length / trailingStopTrades.length
            : 0;

        return {
            avgStopLossDistance,
            stopLossAdherence,
            volatilityAdjustedStopLoss,
            trailingStopLossEfficiency
        };
    }

    /**
     * Analyze portfolio risk
     */
    private async analyzePortfolioRisk(trades: any[], _tradingRules: any): Promise<RiskMetrics['portfolioRisk']> {
        // Calculate portfolio concentration
        const symbolPositions = trades.reduce((acc, trade) => {
            acc[trade.symbol] = (acc[trade.symbol] || 0) + (trade.quantity * trade.buyPrice);
            return acc;
        }, {} as Record<string, number>);

        const totalPortfolioValue = Object.values(symbolPositions).reduce((sum, value) => sum + value, 0);
        const maxSymbolPosition = Math.max(...Object.values(symbolPositions));
        const concentrationScore = totalPortfolioValue > 0 ? maxSymbolPosition / totalPortfolioValue : 0;

        // Calculate correlation risk (simplified)
        const correlationRisk = 0.3; // Placeholder - would need more sophisticated analysis

        // Calculate sector concentration (simplified)
        const sectorConcentration = 0.4; // Placeholder - would need sector data

        // Calculate overall risk score
        const overallRiskScore = (
            concentrationScore * 0.3 +
            correlationRisk * 0.2 +
            sectorConcentration * 0.2 +
            (1 - stopLossAdherence) * 0.3
        ) * 100;

        return {
            concentrationScore,
            correlationRisk,
            sectorConcentration,
            overallRiskScore
        };
    }

    /**
     * Generate AI-powered risk insights
     */
    private async generateAIRiskInsights(
        trades: any[],
        analyticsData: any,
        positionSizingMetrics: RiskMetrics['positionSizing'],
        riskRewardMetrics: RiskMetrics['riskReward'],
        stopLossMetrics: RiskMetrics['stopLoss'],
        portfolioRiskMetrics: RiskMetrics['portfolioRisk']
    ): Promise<{ recommendations: string[] }> {
        try {
            const tradingData = {
                hasData: true,
                totalTrades: trades.length,
                totalNetProfitLoss: analyticsData.analytics.totalNetProfitLoss,
                winRate: analyticsData.analytics.winRate,
                avgProfitLoss: analyticsData.analytics.avgProfitLossPerTrade
            };

            const riskMetrics = {
                positionSizing: positionSizingMetrics,
                riskReward: riskRewardMetrics,
                stopLoss: stopLossMetrics,
                portfolioRisk: portfolioRiskMetrics
            };

            const aiResponse = await generateRiskAnalysis(tradingData, riskMetrics);

            // Parse AI response into recommendations
            const recommendations = aiResponse.split('\n').filter(line =>
                line.trim().length > 0 && line.includes('•')
            );

            return { recommendations };
        } catch (error) {
            logger.error('Error generating AI risk insights', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return { recommendations: [] };
        }
    }

    /**
     * Calculate overall risk score
     */
    private calculateOverallRiskScore(
        positionSizing: RiskMetrics['positionSizing'],
        riskReward: RiskMetrics['riskReward'],
        stopLoss: RiskMetrics['stopLoss'],
        portfolioRisk: RiskMetrics['portfolioRisk']
    ): number {
        const positionSizingScore = Math.min(100, positionSizing.positionSizeRatio * 100);
        const riskRewardScore = Math.min(100, (riskReward.avgRiskRewardRatio / riskReward.optimalRiskRewardRatio) * 100);
        const stopLossScore = stopLoss.stopLossAdherence * 100;
        const portfolioRiskScore = 100 - portfolioRisk.overallRiskScore;

        return (positionSizingScore + riskRewardScore + stopLossScore + portfolioRiskScore) / 4;
    }

    /**
     * Identify improvement areas
     */
    private identifyImprovementAreas(
        positionSizing: RiskMetrics['positionSizing'],
        riskReward: RiskMetrics['riskReward'],
        stopLoss: RiskMetrics['stopLoss'],
        portfolioRisk: RiskMetrics['portfolioRisk']
    ): string[] {
        const areas: string[] = [];

        if (positionSizing.positionSizeRatio > 0.1) {
            areas.push('Position sizing too large');
        }

        if (riskReward.avgRiskRewardRatio < riskReward.optimalRiskRewardRatio) {
            areas.push('Risk-reward ratio below optimal');
        }

        if (stopLoss.stopLossAdherence < 0.8) {
            areas.push('Stop-loss adherence needs improvement');
        }

        if (portfolioRisk.concentrationScore > 0.3) {
            areas.push('Portfolio concentration too high');
        }

        return areas;
    }

    /**
     * Identify strengths
     */
    private identifyStrengths(
        positionSizing: RiskMetrics['positionSizing'],
        riskReward: RiskMetrics['riskReward'],
        stopLoss: RiskMetrics['stopLoss'],
        portfolioRisk: RiskMetrics['portfolioRisk']
    ): string[] {
        const strengths: string[] = [];

        if (positionSizing.positionSizeRatio <= 0.05) {
            strengths.push('Conservative position sizing');
        }

        if (riskReward.avgRiskRewardRatio >= riskReward.optimalRiskRewardRatio) {
            strengths.push('Good risk-reward ratios');
        }

        if (stopLoss.stopLossAdherence >= 0.9) {
            strengths.push('Excellent stop-loss discipline');
        }

        if (portfolioRisk.concentrationScore <= 0.2) {
            strengths.push('Well-diversified portfolio');
        }

        return strengths;
    }

    /**
     * Generate position sizing recommendations
     */
    private generatePositionSizingRecommendations(metrics: RiskMetrics['positionSizing']): string[] {
        const recommendations: string[] = [];

        if (metrics.positionSizeRatio > 0.1) {
            recommendations.push('Reduce position sizes to maximum 5% of account per trade');
            recommendations.push('Consider scaling into positions rather than full size entry');
        }

        if (metrics.portfolioConcentration > 0.3) {
            recommendations.push('Diversify across more symbols to reduce concentration risk');
            recommendations.push('Limit single position to maximum 20% of portfolio');
        }

        if (metrics.riskPerTrade > 1000) {
            recommendations.push('Implement strict risk management with maximum ₹1000 risk per trade');
            recommendations.push('Use position sizing calculator before each trade');
        }

        return recommendations;
    }

    /**
     * Generate risk-reward guidance
     */
    private generateRiskRewardGuidance(metrics: RiskMetrics['riskReward']): string[] {
        const recommendations: string[] = [];

        if (metrics.avgRiskRewardRatio < metrics.optimalRiskRewardRatio) {
            recommendations.push('Aim for minimum 2:1 risk-reward ratio on all trades');
            recommendations.push('Wait for better entry points with higher reward potential');
        }

        if (metrics.riskRewardTrend === 'declining') {
            recommendations.push('Review recent trades to identify why risk-reward ratios are declining');
            recommendations.push('Focus on quality over quantity in trade selection');
        }

        if (metrics.riskAdjustedReturn < 1) {
            recommendations.push('Improve risk-adjusted returns by better trade management');
            recommendations.push('Consider reducing position sizes to improve risk management');
        }

        return recommendations;
    }

    /**
     * Generate stop-loss strategies
     */
    private generateStopLossStrategies(metrics: RiskMetrics['stopLoss']): string[] {
        const recommendations: string[] = [];

        if (metrics.stopLossAdherence < 0.8) {
            recommendations.push('Implement strict stop-loss discipline on all trades');
            recommendations.push('Use automated stop-loss orders when possible');
        }

        if (metrics.avgStopLossDistance > 0.05) {
            recommendations.push('Tighten stop-loss distances to reduce risk per trade');
            recommendations.push('Use technical levels for more precise stop-loss placement');
        }

        if (metrics.trailingStopLossEfficiency < 0.5) {
            recommendations.push('Implement trailing stop-loss strategies for winning trades');
            recommendations.push('Let profits run while protecting gains with trailing stops');
        }

        return recommendations;
    }

    /**
     * Generate portfolio risk insights
     */
    private generatePortfolioRiskInsights(metrics: RiskMetrics['portfolioRisk']): string[] {
        const recommendations: string[] = [];

        if (metrics.concentrationScore > 0.3) {
            recommendations.push('Reduce portfolio concentration by diversifying across more symbols');
            recommendations.push('Limit single position to maximum 20% of total portfolio');
        }

        if (metrics.overallRiskScore > 70) {
            recommendations.push('Overall portfolio risk is high - consider reducing position sizes');
            recommendations.push('Implement stricter risk management rules');
        }

        if (metrics.sectorConcentration > 0.5) {
            recommendations.push('Diversify across different sectors to reduce sector risk');
            recommendations.push('Avoid over-concentration in single sector');
        }

        return recommendations;
    }

    /**
     * Save risk assessment to database
     */
    async saveRiskAssessment(userId: string, assessment: Omit<RiskAssessment, 'id' | 'userId' | 'createdAt'>): Promise<RiskAssessment> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            const savedAssessment = await prisma.riskAssessment.create({
                data: {
                    userId: user.id,
                    assessmentType: assessment.assessmentType,
                    riskScore: assessment.riskScore,
                    recommendations: assessment.recommendations,
                    positionSizingAnalysis: assessment.positionSizingAnalysis,
                    riskRewardAnalysis: assessment.riskRewardAnalysis,
                    stopLossStrategies: assessment.stopLossStrategies
                }
            });

            return {
                id: savedAssessment.id,
                userId: savedAssessment.userId,
                assessmentType: savedAssessment.assessmentType,
                riskScore: savedAssessment.riskScore,
                recommendations: savedAssessment.recommendations as Record<string, unknown>,
                positionSizingAnalysis: savedAssessment.positionSizingAnalysis as Record<string, unknown>,
                riskRewardAnalysis: savedAssessment.riskRewardAnalysis as Record<string, unknown>,
                stopLossStrategies: savedAssessment.stopLossStrategies as Record<string, unknown>,
                createdAt: savedAssessment.createdAt
            };
        } catch (error) {
            logger.error('Error saving risk assessment', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Get user's risk assessments
     */
    async getUserRiskAssessments(userId: string): Promise<RiskAssessment[]> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                return [];
            }

            const assessments = await prisma.riskAssessment.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' }
            });

            return assessments.map(assessment => ({
                id: assessment.id,
                userId: assessment.userId,
                assessmentType: assessment.assessmentType,
                riskScore: assessment.riskScore,
                recommendations: assessment.recommendations as Record<string, unknown>,
                positionSizingAnalysis: assessment.positionSizingAnalysis as Record<string, unknown>,
                riskRewardAnalysis: assessment.riskRewardAnalysis as Record<string, unknown>,
                stopLossStrategies: assessment.stopLossStrategies as Record<string, unknown>,
                createdAt: assessment.createdAt
            }));
        } catch (error) {
            logger.error('Error getting user risk assessments', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }
}

export const riskManagementService = new RiskManagementService(); 