import { prisma } from '@/lib/prisma';
import { analyticsService } from './analytics-service';
import { generateBehavioralAnalysis } from '@/lib/gemini';
import { logger } from '@/lib/logger';

export interface BehavioralPattern {
    type: 'emotional' | 'risk_taking' | 'consistency' | 'discipline';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    evidence: Record<string, unknown>;
    confidence: number;
    frequency: number;
    impact: 'positive' | 'negative' | 'neutral';
}

export interface EmotionalPattern {
    type: 'fomo' | 'revenge_trading' | 'overconfidence' | 'panic_selling' | 'impulsive';
    severity: 'low' | 'medium' | 'high' | 'critical';
    evidence: {
        frequency: number;
        totalLoss: number;
        avgLoss: number;
        timePattern: string;
        triggerEvents: string[];
    };
    description: string;
}

export interface RiskTakingPattern {
    type: 'position_sizing' | 'risk_reward' | 'stop_loss' | 'leverage' | 'diversification';
    severity: 'low' | 'medium' | 'high' | 'critical';
    evidence: {
        avgPositionSize: number;
        maxPositionSize: number;
        riskRewardRatio: number;
        stopLossAdherence: number;
        diversificationScore: number;
    };
    description: string;
}

export interface ConsistencyPattern {
    type: 'trading_frequency' | 'time_based' | 'strategy_adherence' | 'goal_follow_through' | 'learning_progression';
    severity: 'low' | 'medium' | 'high' | 'critical';
    evidence: {
        tradingFrequency: number;
        timeConsistency: number;
        strategyAdherence: number;
        goalAchievement: number;
        learningProgress: number;
    };
    description: string;
}

export interface DisciplinePattern {
    type: 'rule_following' | 'emotional_control' | 'preparation' | 'post_trade_analysis' | 'continuous_improvement';
    severity: 'low' | 'medium' | 'high' | 'critical';
    evidence: {
        ruleAdherence: number;
        emotionalControl: number;
        preparationScore: number;
        analysisHabits: number;
        improvementRate: number;
    };
    description: string;
}

export interface BehavioralInsight {
    id: string;
    userId: string;
    patternType: string;
    severity: string;
    title: string;
    description: string;
    evidence: Record<string, unknown>;
    recommendations: Record<string, unknown>;
    isAcknowledged: boolean;
    createdAt: Date;
}

export interface BehavioralAnalysis {
    patterns: BehavioralPattern[];
    emotionalPatterns: EmotionalPattern[];
    riskTakingPatterns: RiskTakingPattern[];
    consistencyPatterns: ConsistencyPattern[];
    disciplinePatterns: DisciplinePattern[];
    overallScore: number;
    improvementAreas: string[];
    strengths: string[];
    recommendations: string[];
}

export class BehavioralAnalysisService {
    /**
     * Analyze user's trading behavior comprehensively
     */
    async analyzeUserBehavior(userId: string): Promise<BehavioralAnalysis> {
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
                throw new Error('No trading data available for analysis');
            }

            const trades = user.matchedTrades;
            const tradingRules = user.tradingRules;

            // Perform behavioral analysis
            const [
                emotionalPatterns,
                riskTakingPatterns,
                consistencyPatterns,
                disciplinePatterns
            ] = await Promise.all([
                this.analyzeEmotionalPatterns(trades, tradingRules),
                this.analyzeRiskTakingPatterns(trades, tradingRules),
                this.analyzeConsistencyPatterns(trades, tradingRules),
                this.analyzeDisciplinePatterns(trades, tradingRules)
            ]);

            // Generate AI-powered behavioral insights
            const aiInsights = await this.generateAIBehavioralInsights(
                trades,
                analyticsData,
                emotionalPatterns,
                riskTakingPatterns,
                consistencyPatterns,
                disciplinePatterns
            );

            // Combine all patterns
            const patterns: BehavioralPattern[] = [
                ...emotionalPatterns.map(p => this.convertToBehavioralPattern(p, 'emotional')),
                ...riskTakingPatterns.map(p => this.convertToBehavioralPattern(p, 'risk_taking')),
                ...consistencyPatterns.map(p => this.convertToBehavioralPattern(p, 'consistency')),
                ...disciplinePatterns.map(p => this.convertToBehavioralPattern(p, 'discipline'))
            ];

            // Calculate overall behavioral score
            const overallScore = this.calculateOverallScore(patterns);

            // Identify improvement areas and strengths
            const improvementAreas = this.identifyImprovementAreas(patterns);
            const strengths = this.identifyStrengths(patterns);

            return {
                patterns,
                emotionalPatterns,
                riskTakingPatterns,
                consistencyPatterns,
                disciplinePatterns,
                overallScore,
                improvementAreas,
                strengths,
                recommendations: aiInsights.recommendations
            };

        } catch (error) {
            logger.error('Error analyzing user behavior', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Analyze emotional trading patterns
     */
    private async analyzeEmotionalPatterns(trades: any[], tradingRules: any): Promise<EmotionalPattern[]> {
        const patterns: EmotionalPattern[] = [];

        // FOMO (Fear of Missing Out) trading detection
        const fomoPattern = this.detectFOMOPattern(trades);
        if (fomoPattern) patterns.push(fomoPattern);

        // Revenge trading detection
        const revengePattern = this.detectRevengeTradingPattern(trades);
        if (revengePattern) patterns.push(revengePattern);

        // Overconfidence after wins
        const overconfidencePattern = this.detectOverconfidencePattern(trades);
        if (overconfidencePattern) patterns.push(overconfidencePattern);

        // Panic selling during drawdowns
        const panicPattern = this.detectPanicSellingPattern(trades);
        if (panicPattern) patterns.push(panicPattern);

        // Impulsive trading decisions
        const impulsivePattern = this.detectImpulsiveTradingPattern(trades);
        if (impulsivePattern) patterns.push(impulsivePattern);

        return patterns;
    }

    /**
     * Analyze risk-taking behavior patterns
     */
    private async analyzeRiskTakingPatterns(trades: any[], tradingRules: any): Promise<RiskTakingPattern[]> {
        const patterns: RiskTakingPattern[] = [];

        // Position sizing analysis
        const positionSizingPattern = this.analyzePositionSizing(trades, tradingRules);
        if (positionSizingPattern) patterns.push(positionSizingPattern);

        // Risk-reward ratio analysis
        const riskRewardPattern = this.analyzeRiskRewardRatio(trades, tradingRules);
        if (riskRewardPattern) patterns.push(riskRewardPattern);

        // Stop-loss adherence
        const stopLossPattern = this.analyzeStopLossAdherence(trades, tradingRules);
        if (stopLossPattern) patterns.push(stopLossPattern);

        // Leverage usage
        const leveragePattern = this.analyzeLeverageUsage(trades);
        if (leveragePattern) patterns.push(leveragePattern);

        // Diversification behavior
        const diversificationPattern = this.analyzeDiversification(trades);
        if (diversificationPattern) patterns.push(diversificationPattern);

        return patterns;
    }

    /**
     * Analyze consistency patterns
     */
    private async analyzeConsistencyPatterns(trades: any[], tradingRules: any): Promise<ConsistencyPattern[]> {
        const patterns: ConsistencyPattern[] = [];

        // Trading frequency consistency
        const frequencyPattern = this.analyzeTradingFrequency(trades);
        if (frequencyPattern) patterns.push(frequencyPattern);

        // Time-based trading patterns
        const timePattern = this.analyzeTimeBasedPatterns(trades);
        if (timePattern) patterns.push(timePattern);

        // Strategy adherence
        const strategyPattern = this.analyzeStrategyAdherence(trades, tradingRules);
        if (strategyPattern) patterns.push(strategyPattern);

        // Goal follow-through
        const goalPattern = this.analyzeGoalFollowThrough(trades);
        if (goalPattern) patterns.push(goalPattern);

        // Learning progression
        const learningPattern = this.analyzeLearningProgression(trades);
        if (learningPattern) patterns.push(learningPattern);

        return patterns;
    }

    /**
     * Analyze discipline patterns
     */
    private async analyzeDisciplinePatterns(trades: any[], tradingRules: any): Promise<DisciplinePattern[]> {
        const patterns: DisciplinePattern[] = [];

        // Rule following behavior
        const rulePattern = this.analyzeRuleFollowing(trades, tradingRules);
        if (rulePattern) patterns.push(rulePattern);

        // Emotional control
        const emotionalControlPattern = this.analyzeEmotionalControl(trades);
        if (emotionalControlPattern) patterns.push(emotionalControlPattern);

        // Preparation and planning
        const preparationPattern = this.analyzePreparation(trades);
        if (preparationPattern) patterns.push(preparationPattern);

        // Post-trade analysis habits
        const analysisPattern = this.analyzePostTradeAnalysis(trades);
        if (analysisPattern) patterns.push(analysisPattern);

        // Continuous improvement
        const improvementPattern = this.analyzeContinuousImprovement(trades);
        if (improvementPattern) patterns.push(improvementPattern);

        return patterns;
    }

    /**
     * Detect FOMO trading pattern
     */
    private detectFOMOPattern(trades: any[]): EmotionalPattern | null {
        // Analyze trades after significant market moves
        const fomoTrades = trades.filter(trade => {
            // Look for trades with high volume, quick entry/exit, and poor timing
            const duration = trade.duration || 0;
            const profit = trade.profit || 0;
            return duration < 60 && profit < 0; // Quick trades with losses
        });

        if (fomoTrades.length > trades.length * 0.2) { // More than 20% of trades
            const totalLoss = fomoTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
            const avgLoss = totalLoss / fomoTrades.length;

            return {
                type: 'fomo',
                severity: this.calculateSeverity(fomoTrades.length / trades.length),
                evidence: {
                    frequency: fomoTrades.length,
                    totalLoss,
                    avgLoss,
                    timePattern: 'Quick trades after market moves',
                    triggerEvents: ['Market gaps', 'News events', 'Social media hype']
                },
                description: `Detected ${fomoTrades.length} FOMO trades with average loss of ₹${Math.abs(avgLoss).toFixed(2)}`
            };
        }

        return null;
    }

    /**
     * Detect revenge trading pattern
     */
    private detectRevengeTradingPattern(trades: any[]): EmotionalPattern | null {
        // Look for trades immediately after losses
        const revengeTrades = [];

        for (let i = 1; i < trades.length; i++) {
            const prevTrade = trades[i - 1];
            const currentTrade = trades[i];

            if (prevTrade.profit < 0 && currentTrade.profit < 0) {
                const timeDiff = new Date(currentTrade.sellDate).getTime() - new Date(prevTrade.sellDate).getTime();
                if (timeDiff < 24 * 60 * 60 * 1000) { // Within 24 hours
                    revengeTrades.push(currentTrade);
                }
            }
        }

        if (revengeTrades.length > 0) {
            const totalLoss = revengeTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
            const avgLoss = totalLoss / revengeTrades.length;

            return {
                type: 'revenge_trading',
                severity: this.calculateSeverity(revengeTrades.length / trades.length),
                evidence: {
                    frequency: revengeTrades.length,
                    totalLoss,
                    avgLoss,
                    timePattern: 'Trades within 24 hours of losses',
                    triggerEvents: ['Previous losses', 'Emotional reactions']
                },
                description: `Detected ${revengeTrades.length} revenge trades with average loss of ₹${Math.abs(avgLoss).toFixed(2)}`
            };
        }

        return null;
    }

    /**
     * Detect overconfidence pattern
     */
    private detectOverconfidencePattern(trades: any[]): EmotionalPattern | null {
        // Look for increased position sizes after wins
        const overconfidenceTrades = [];

        for (let i = 1; i < trades.length; i++) {
            const prevTrade = trades[i - 1];
            const currentTrade = trades[i];

            if (prevTrade.profit > 0 && currentTrade.quantity > prevTrade.quantity * 1.5) {
                overconfidenceTrades.push(currentTrade);
            }
        }

        if (overconfidenceTrades.length > 0) {
            const totalLoss = overconfidenceTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
            const avgLoss = totalLoss / overconfidenceTrades.length;

            return {
                type: 'overconfidence',
                severity: this.calculateSeverity(overconfidenceTrades.length / trades.length),
                evidence: {
                    frequency: overconfidenceTrades.length,
                    totalLoss,
                    avgLoss,
                    timePattern: 'Increased position sizes after wins',
                    triggerEvents: ['Previous wins', 'Overconfidence']
                },
                description: `Detected ${overconfidenceTrades.length} overconfidence trades with average loss of ₹${Math.abs(avgLoss).toFixed(2)}`
            };
        }

        return null;
    }

    /**
     * Detect panic selling pattern
     */
    private detectPanicSellingPattern(trades: any[]): EmotionalPattern | null {
        // Look for quick exits during drawdowns
        const panicTrades = trades.filter(trade => {
            const duration = trade.duration || 0;
            const profit = trade.profit || 0;
            return duration < 30 && profit < 0; // Very quick trades with losses
        });

        if (panicTrades.length > trades.length * 0.15) { // More than 15% of trades
            const totalLoss = panicTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
            const avgLoss = totalLoss / panicTrades.length;

            return {
                type: 'panic_selling',
                severity: this.calculateSeverity(panicTrades.length / trades.length),
                evidence: {
                    frequency: panicTrades.length,
                    totalLoss,
                    avgLoss,
                    timePattern: 'Very quick exits during losses',
                    triggerEvents: ['Market volatility', 'Fear', 'Loss aversion']
                },
                description: `Detected ${panicTrades.length} panic selling trades with average loss of ₹${Math.abs(avgLoss).toFixed(2)}`
            };
        }

        return null;
    }

    /**
     * Detect impulsive trading pattern
     */
    private detectImpulsiveTradingPattern(trades: any[]): EmotionalPattern | null {
        // Look for trades without proper analysis (quick entries)
        const impulsiveTrades = trades.filter(trade => {
            const duration = trade.duration || 0;
            return duration < 15; // Very quick trades
        });

        if (impulsiveTrades.length > trades.length * 0.25) { // More than 25% of trades
            const totalLoss = impulsiveTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
            const avgLoss = totalLoss / impulsiveTrades.length;

            return {
                type: 'impulsive',
                severity: this.calculateSeverity(impulsiveTrades.length / trades.length),
                evidence: {
                    frequency: impulsiveTrades.length,
                    totalLoss,
                    avgLoss,
                    timePattern: 'Very quick trades without analysis',
                    triggerEvents: ['Emotional impulses', 'Lack of planning']
                },
                description: `Detected ${impulsiveTrades.length} impulsive trades with average loss of ₹${Math.abs(avgLoss).toFixed(2)}`
            };
        }

        return null;
    }

    /**
     * Analyze position sizing patterns
     */
    private analyzePositionSizing(trades: any[], tradingRules: any): RiskTakingPattern | null {
        const positionSizes = trades.map(trade => trade.quantity * trade.buyPrice);
        const avgPositionSize = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length;
        const maxPositionSize = Math.max(...positionSizes);

        // Check against trading rules
        const maxAllowedSize = tradingRules?.maxDailyLoss * 2 || 10000; // 2x daily loss limit

        if (avgPositionSize > maxAllowedSize * 0.8) {
            return {
                type: 'position_sizing',
                severity: avgPositionSize > maxAllowedSize ? 'critical' : 'high',
                evidence: {
                    avgPositionSize,
                    maxPositionSize,
                    riskRewardRatio: 0,
                    stopLossAdherence: 0,
                    diversificationScore: 0
                },
                description: `Average position size (₹${avgPositionSize.toFixed(2)}) is approaching risk limits`
            };
        }

        return null;
    }

    /**
     * Analyze risk-reward ratio patterns
     */
    private analyzeRiskRewardRatio(trades: any[], tradingRules: any): RiskTakingPattern | null {
        const riskRewardRatios = trades.map(trade => {
            const potentialLoss = trade.quantity * (trade.buyPrice - trade.buyPrice * 0.95); // 5% stop loss
            const potentialProfit = trade.profit || 0;
            return potentialProfit > 0 ? potentialProfit / potentialLoss : 0;
        });

        const avgRiskReward = riskRewardRatios.reduce((sum, ratio) => sum + ratio, 0) / riskRewardRatios.length;
        const minRequiredRatio = tradingRules?.riskRewardRatio || 2.0;

        if (avgRiskReward < minRequiredRatio) {
            return {
                type: 'risk_reward',
                severity: avgRiskReward < minRequiredRatio * 0.5 ? 'critical' : 'high',
                evidence: {
                    avgPositionSize: 0,
                    maxPositionSize: 0,
                    riskRewardRatio: avgRiskReward,
                    stopLossAdherence: 0,
                    diversificationScore: 0
                },
                description: `Average risk-reward ratio (${avgRiskReward.toFixed(2)}) is below recommended minimum (${minRequiredRatio})`
            };
        }

        return null;
    }

    /**
     * Analyze stop-loss adherence
     */
    private analyzeStopLossAdherence(trades: any[], tradingRules: any): RiskTakingPattern | null {
        // Calculate how often trades hit stop-loss levels
        const stopLossTrades = trades.filter(trade => {
            const maxLoss = trade.quantity * trade.buyPrice * 0.05; // 5% stop loss
            return trade.profit < -maxLoss;
        });

        const adherenceRate = (trades.length - stopLossTrades.length) / trades.length;

        if (adherenceRate < 0.7) { // Less than 70% adherence
            return {
                type: 'stop_loss',
                severity: adherenceRate < 0.5 ? 'critical' : 'high',
                evidence: {
                    avgPositionSize: 0,
                    maxPositionSize: 0,
                    riskRewardRatio: 0,
                    stopLossAdherence: adherenceRate,
                    diversificationScore: 0
                },
                description: `Stop-loss adherence rate (${(adherenceRate * 100).toFixed(1)}%) is below recommended level`
            };
        }

        return null;
    }

    /**
     * Analyze leverage usage
     */
    private analyzeLeverageUsage(trades: any[]): RiskTakingPattern | null {
        // This would require leverage data from broker
        // For now, we'll analyze position sizes relative to account size
        return null;
    }

    /**
     * Analyze diversification
     */
    private analyzeDiversification(trades: any[]): RiskTakingPattern | null {
        const symbols = [...new Set(trades.map(trade => trade.symbol))];
        const diversificationScore = symbols.length / Math.min(trades.length, 20); // Normalize by trade count

        if (diversificationScore < 0.3) { // Less than 30% diversification
            return {
                type: 'diversification',
                severity: diversificationScore < 0.1 ? 'critical' : 'high',
                evidence: {
                    avgPositionSize: 0,
                    maxPositionSize: 0,
                    riskRewardRatio: 0,
                    stopLossAdherence: 0,
                    diversificationScore
                },
                description: `Low diversification with only ${symbols.length} different symbols traded`
            };
        }

        return null;
    }

    /**
     * Analyze trading frequency consistency
     */
    private analyzeTradingFrequency(trades: any[]): ConsistencyPattern | null {
        // Group trades by day and analyze frequency consistency
        const tradesByDay = trades.reduce((acc, trade) => {
            const day = new Date(trade.sellDate).toDateString();
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const frequencies = Object.values(tradesByDay);
        const avgFrequency = frequencies.reduce((sum: number, freq: number) => sum + freq, 0) / frequencies.length;
        const frequencyVariance = frequencies.reduce((sum: number, freq: number) => sum + Math.pow(freq - avgFrequency, 2), 0) / frequencies.length;

        if (frequencyVariance > avgFrequency * 2) { // High variance
            return {
                type: 'trading_frequency',
                severity: 'medium',
                evidence: {
                    tradingFrequency: avgFrequency,
                    timeConsistency: 0,
                    strategyAdherence: 0,
                    goalAchievement: 0,
                    learningProgress: 0
                },
                description: `Inconsistent trading frequency with high variance`
            };
        }

        return null;
    }

    /**
     * Analyze time-based patterns
     */
    private analyzeTimeBasedPatterns(trades: any[]): ConsistencyPattern | null {
        // Analyze trading times for consistency
        const tradingHours = trades.map(trade => new Date(trade.sellDate).getHours());
        const hourDistribution = tradingHours.reduce((acc, hour) => {
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const mostCommonHour = Object.entries(hourDistribution).sort((a, b) => b[1] - a[1])[0];
        const timeConsistency = mostCommonHour[1] / trades.length;

        if (timeConsistency < 0.3) { // Less than 30% consistency
            return {
                type: 'time_based',
                severity: 'medium',
                evidence: {
                    tradingFrequency: 0,
                    timeConsistency,
                    strategyAdherence: 0,
                    goalAchievement: 0,
                    learningProgress: 0
                },
                description: `Low time-based consistency in trading patterns`
            };
        }

        return null;
    }

    /**
     * Analyze strategy adherence
     */
    private analyzeStrategyAdherence(trades: any[], tradingRules: any): ConsistencyPattern | null {
        // This would require more detailed strategy data
        // For now, we'll analyze basic rule adherence
        if (!tradingRules) return null;

        const ruleViolations = trades.filter(trade => {
            // Check against basic rules
            return false; // Placeholder
        });

        const adherenceRate = (trades.length - ruleViolations.length) / trades.length;

        if (adherenceRate < 0.8) { // Less than 80% adherence
            return {
                type: 'strategy_adherence',
                severity: adherenceRate < 0.6 ? 'critical' : 'high',
                evidence: {
                    tradingFrequency: 0,
                    timeConsistency: 0,
                    strategyAdherence: adherenceRate,
                    goalAchievement: 0,
                    learningProgress: 0
                },
                description: `Strategy adherence rate (${(adherenceRate * 100).toFixed(1)}%) is below target`
            };
        }

        return null;
    }

    /**
     * Analyze goal follow-through
     */
    private analyzeGoalFollowThrough(trades: any[]): ConsistencyPattern | null {
        // This would require goal data
        return null;
    }

    /**
     * Analyze learning progression
     */
    private analyzeLearningProgression(trades: any[]): ConsistencyPattern | null {
        // Analyze if performance is improving over time
        const recentTrades = trades.slice(0, Math.floor(trades.length * 0.3));
        const olderTrades = trades.slice(Math.floor(trades.length * 0.7));

        const recentAvgProfit = recentTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0) / recentTrades.length;
        const olderAvgProfit = olderTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0) / olderTrades.length;

        const improvement = recentAvgProfit - olderAvgProfit;

        if (improvement < 0) {
            return {
                type: 'learning_progression',
                severity: improvement < -100 ? 'critical' : 'high',
                evidence: {
                    tradingFrequency: 0,
                    timeConsistency: 0,
                    strategyAdherence: 0,
                    goalAchievement: 0,
                    learningProgress: improvement
                },
                description: `Performance has declined by ₹${Math.abs(improvement).toFixed(2)} per trade`
            };
        }

        return null;
    }

    /**
     * Analyze rule following behavior
     */
    private analyzeRuleFollowing(trades: any[], tradingRules: any): DisciplinePattern | null {
        if (!tradingRules) return null;

        const ruleViolations = trades.filter(trade => {
            // Check against trading rules
            return false; // Placeholder
        });

        const adherenceRate = (trades.length - ruleViolations.length) / trades.length;

        if (adherenceRate < 0.9) { // Less than 90% adherence
            return {
                type: 'rule_following',
                severity: adherenceRate < 0.7 ? 'critical' : 'high',
                evidence: {
                    ruleAdherence: adherenceRate,
                    emotionalControl: 0,
                    preparationScore: 0,
                    analysisHabits: 0,
                    improvementRate: 0
                },
                description: `Rule adherence rate (${(adherenceRate * 100).toFixed(1)}%) needs improvement`
            };
        }

        return null;
    }

    /**
     * Analyze emotional control
     */
    private analyzeEmotionalControl(trades: any[]): DisciplinePattern | null {
        // Analyze emotional patterns from earlier analysis
        const emotionalTrades = trades.filter(trade => {
            const duration = trade.duration || 0;
            return duration < 30; // Quick emotional trades
        });

        const emotionalControl = (trades.length - emotionalTrades.length) / trades.length;

        if (emotionalControl < 0.8) { // Less than 80% control
            return {
                type: 'emotional_control',
                severity: emotionalControl < 0.6 ? 'critical' : 'high',
                evidence: {
                    ruleAdherence: 0,
                    emotionalControl,
                    preparationScore: 0,
                    analysisHabits: 0,
                    improvementRate: 0
                },
                description: `Emotional control rate (${(emotionalControl * 100).toFixed(1)}%) needs improvement`
            };
        }

        return null;
    }

    /**
     * Analyze preparation and planning
     */
    private analyzePreparation(trades: any[]): DisciplinePattern | null {
        // Analyze trade duration as proxy for preparation
        const avgDuration = trades.reduce((sum, trade) => sum + (trade.duration || 0), 0) / trades.length;

        if (avgDuration < 60) { // Less than 1 hour average
            return {
                type: 'preparation',
                severity: avgDuration < 30 ? 'critical' : 'high',
                evidence: {
                    ruleAdherence: 0,
                    emotionalControl: 0,
                    preparationScore: avgDuration / 120, // Normalize to 2 hours
                    analysisHabits: 0,
                    improvementRate: 0
                },
                description: `Average trade duration (${avgDuration.toFixed(1)} minutes) suggests insufficient preparation`
            };
        }

        return null;
    }

    /**
     * Analyze post-trade analysis habits
     */
    private analyzePostTradeAnalysis(trades: any[]): DisciplinePattern | null {
        // This would require additional data about analysis habits
        return null;
    }

    /**
     * Analyze continuous improvement
     */
    private analyzeContinuousImprovement(trades: any[]): DisciplinePattern | null {
        // Analyze if the trader is learning from mistakes
        const losingTrades = trades.filter(trade => trade.profit < 0);
        const repeatMistakes = losingTrades.filter(trade => {
            // Look for similar losing patterns
            return false; // Placeholder
        });

        const improvementRate = (losingTrades.length - repeatMistakes.length) / losingTrades.length;

        if (improvementRate < 0.5) { // Less than 50% improvement
            return {
                type: 'continuous_improvement',
                severity: improvementRate < 0.3 ? 'critical' : 'high',
                evidence: {
                    ruleAdherence: 0,
                    emotionalControl: 0,
                    preparationScore: 0,
                    analysisHabits: 0,
                    improvementRate
                },
                description: `Continuous improvement rate (${(improvementRate * 100).toFixed(1)}%) needs attention`
            };
        }

        return null;
    }

    /**
     * Generate AI-powered behavioral insights
     */
    private async generateAIBehavioralInsights(
        trades: any[],
        analyticsData: any,
        emotionalPatterns: EmotionalPattern[],
        riskTakingPatterns: RiskTakingPattern[],
        consistencyPatterns: ConsistencyPattern[],
        disciplinePatterns: DisciplinePattern[]
    ): Promise<{ recommendations: string[] }> {
        try {
            const tradingData = {
                hasData: true,
                totalTrades: trades.length,
                totalNetProfitLoss: analyticsData.analytics.totalNetProfitLoss,
                winRate: analyticsData.analytics.winRate,
                avgProfitLoss: analyticsData.analytics.avgProfitLossPerTrade
            };

            const patterns = {
                emotional: emotionalPatterns,
                riskTaking: riskTakingPatterns,
                consistency: consistencyPatterns,
                discipline: disciplinePatterns
            };

            const aiResponse = await generateBehavioralAnalysis(tradingData, patterns);

            // Parse AI response into recommendations
            const recommendations = aiResponse.split('\n').filter(line =>
                line.trim().length > 0 && line.includes('•')
            );

            return { recommendations };
        } catch (error) {
            logger.error('Error generating AI behavioral insights', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return { recommendations: [] };
        }
    }

    /**
     * Convert pattern to behavioral pattern
     */
    private convertToBehavioralPattern(pattern: any, type: string): BehavioralPattern {
        return {
            type: type as any,
            severity: pattern.severity,
            title: pattern.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: pattern.description,
            evidence: pattern.evidence,
            confidence: 0.8, // Default confidence
            frequency: pattern.evidence.frequency || 0,
            impact: 'negative' // Most behavioral patterns are negative
        };
    }

    /**
     * Calculate severity based on frequency
     */
    private calculateSeverity(frequency: number): 'low' | 'medium' | 'high' | 'critical' {
        if (frequency > 0.5) return 'critical';
        if (frequency > 0.3) return 'high';
        if (frequency > 0.1) return 'medium';
        return 'low';
    }

    /**
     * Calculate overall behavioral score
     */
    private calculateOverallScore(patterns: BehavioralPattern[]): number {
        const severityScores = { low: 0.8, medium: 0.6, high: 0.4, critical: 0.2 };
        const totalScore = patterns.reduce((sum, pattern) => {
            return sum + severityScores[pattern.severity];
        }, 0);

        return patterns.length > 0 ? totalScore / patterns.length : 1.0;
    }

    /**
     * Identify improvement areas
     */
    private identifyImprovementAreas(patterns: BehavioralPattern[]): string[] {
        return patterns
            .filter(pattern => pattern.severity === 'critical' || pattern.severity === 'high')
            .map(pattern => pattern.title);
    }

    /**
     * Identify strengths
     */
    private identifyStrengths(patterns: BehavioralPattern[]): string[] {
        const positivePatterns = patterns.filter(pattern => pattern.impact === 'positive');
        return positivePatterns.map(pattern => pattern.title);
    }

    /**
     * Save behavioral insight to database
     */
    async saveBehavioralInsight(userId: string, insight: Omit<BehavioralInsight, 'id' | 'userId' | 'createdAt'>): Promise<BehavioralInsight> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            const savedInsight = await prisma.behavioralInsight.create({
                data: {
                    userId: user.id,
                    patternType: insight.patternType,
                    severity: insight.severity,
                    title: insight.title,
                    description: insight.description,
                    evidence: JSON.stringify(insight.evidence),
                    recommendations: JSON.stringify(insight.recommendations),
                    isAcknowledged: insight.isAcknowledged
                }
            });

            return {
                id: savedInsight.id,
                userId: savedInsight.userId,
                patternType: savedInsight.patternType,
                severity: savedInsight.severity,
                title: savedInsight.title,
                description: savedInsight.description,
                evidence: savedInsight.evidence as Record<string, unknown>,
                recommendations: savedInsight.recommendations as Record<string, unknown>,
                isAcknowledged: savedInsight.isAcknowledged,
                createdAt: savedInsight.createdAt
            };
        } catch (error) {
            logger.error('Error saving behavioral insight', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Get user's behavioral insights
     */
    async getUserBehavioralInsights(userId: string): Promise<BehavioralInsight[]> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                return [];
            }

            const insights = await prisma.behavioralInsight.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' }
            });

            return insights.map(insight => ({
                id: insight.id,
                userId: insight.userId,
                patternType: insight.patternType,
                severity: insight.severity,
                title: insight.title,
                description: insight.description,
                evidence: insight.evidence as Record<string, unknown>,
                recommendations: insight.recommendations as Record<string, unknown>,
                isAcknowledged: insight.isAcknowledged,
                createdAt: insight.createdAt
            }));
        } catch (error) {
            logger.error('Error getting user behavioral insights', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }
}

export const behavioralAnalysisService = new BehavioralAnalysisService(); 