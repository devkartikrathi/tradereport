import { PrismaClient, MatchedTrade } from "@prisma/client";
import { logger } from "@/lib/logger";
import { Analytics, Trade } from "@/lib/types";
import { TradingRules } from "./trading-rules-service";
import { AnalyticsService } from "./analytics-service";
import { generateBehavioralAnalysis } from "@/lib/gemini";

const prisma = new PrismaClient();
const analyticsService = new AnalyticsService();

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
    private async analyzeEmotionalPatterns(trades: MatchedTrade[]): Promise<EmotionalPattern[]> {
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
    private async analyzeRiskTakingPatterns(trades: MatchedTrade[], tradingRules: TradingRules | null): Promise<RiskTakingPattern[]> {
        const patterns: RiskTakingPattern[] = [];

        // Position sizing analysis
        const positionSizingPattern = tradingRules ? this.analyzePositionSizing(trades, tradingRules) : null;
        if (positionSizingPattern) patterns.push(positionSizingPattern);

        // Risk-reward ratio analysis
        const riskRewardPattern = tradingRules ? this.analyzeRiskRewardRatio(trades, tradingRules) : null;
        if (riskRewardPattern) patterns.push(riskRewardPattern);

        // Stop-loss adherence
        const stopLossPattern = tradingRules ? this.analyzeStopLossAdherence(trades, tradingRules) : null;
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
    private async analyzeConsistencyPatterns(trades: Trade[], tradingRules: TradingRules): Promise<ConsistencyPattern[]> {
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
    private async analyzeDisciplinePatterns(trades: Trade[], tradingRules: TradingRules): Promise<DisciplinePattern[]> {
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
    private detectFOMOPattern(trades: Trade[]): EmotionalPattern | null {
        // Analyze trades after significant market moves
        const fomoTrades = trades.filter(trade => {
            // Look for trades with high volume, quick entry/exit, and poor timing
            const duration = trade.duration || 0;
            const profit = trade.profitLoss || 0;
            return duration < 60 && profit < 0; // Quick trades with losses
        });

        if (fomoTrades.length > trades.length * 0.2) { // More than 20% of trades
            const totalLoss = fomoTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
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
    private detectRevengeTradingPattern(trades: Trade[]): EmotionalPattern | null {
        // Look for trades immediately after losses
        const revengeTrades: Trade[] = [];

        for (let i = 1; i < trades.length; i++) {
            const prevTrade = trades[i - 1];
            const currentTrade = trades[i];

            if (prevTrade.profitLoss < 0 && currentTrade.profitLoss < 0) {
                const timeDiff = new Date(currentTrade.date).getTime() - new Date(prevTrade.date).getTime();
                if (timeDiff < 24 * 60 * 60 * 1000) { // Within 24 hours
                    revengeTrades.push(currentTrade);
                }
            }
        }

        if (revengeTrades.length > 0) {
            const totalLoss = revengeTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
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
    private detectOverconfidencePattern(trades: Trade[]): EmotionalPattern | null {
        // Look for patterns of increasing position sizes after wins
        const overconfidentTrades: Trade[] = [];

        for (let i = 1; i < trades.length; i++) {
            const prevTrade = trades[i - 1];
            const currentTrade = trades[i];

            if (prevTrade.profitLoss > 0 && currentTrade.quantity > prevTrade.quantity * 1.5) {
                overconfidentTrades.push(currentTrade);
            }
        }

        if (overconfidentTrades.length > 0) {
            const totalLoss = overconfidentTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
            const avgLoss = totalLoss / overconfidentTrades.length;

            return {
                type: 'overconfidence',
                severity: this.calculateSeverity(overconfidentTrades.length / trades.length),
                evidence: {
                    frequency: overconfidentTrades.length,
                    totalLoss,
                    avgLoss,
                    timePattern: 'Increasing position sizes after wins',
                    triggerEvents: ['Previous wins', 'Overconfidence']
                },
                description: `Detected ${overconfidentTrades.length} overconfident trades with average loss of ₹${Math.abs(avgLoss).toFixed(2)}`
            };
        }

        return null;
    }

    /**
     * Detect panic selling pattern
     */
    private detectPanicSellingPattern(trades: Trade[]): EmotionalPattern | null {
        // Look for quick exits with large losses
        const panicTrades = trades.filter(trade => {
            const duration = trade.duration || 0;
            const profit = trade.profitLoss || 0;
            return duration < 30 && profit < -1000; // Quick trades with large losses
        });

        if (panicTrades.length > 0) {
            const totalLoss = panicTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
            const avgLoss = totalLoss / panicTrades.length;

            return {
                type: 'panic_selling',
                severity: this.calculateSeverity(panicTrades.length / trades.length),
                evidence: {
                    frequency: panicTrades.length,
                    totalLoss,
                    avgLoss,
                    timePattern: 'Quick exits with large losses',
                    triggerEvents: ['Market volatility', 'Fear', 'News events']
                },
                description: `Detected ${panicTrades.length} panic selling trades with average loss of ₹${Math.abs(avgLoss).toFixed(2)}`
            };
        }

        return null;
    }

    /**
     * Detect impulsive trading pattern
     */
    private detectImpulsiveTradingPattern(trades: Trade[]): EmotionalPattern | null {
        // Look for trades without proper analysis (quick entries)
        const impulsiveTrades = trades.filter(trade => {
            const duration = trade.duration || 0;
            return duration < 15; // Very quick trades
        });

        if (impulsiveTrades.length > trades.length * 0.3) { // More than 30% of trades
            const totalLoss = impulsiveTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
            const avgLoss = totalLoss / impulsiveTrades.length;

            return {
                type: 'impulsive',
                severity: this.calculateSeverity(impulsiveTrades.length / trades.length),
                evidence: {
                    frequency: impulsiveTrades.length,
                    totalLoss,
                    avgLoss,
                    timePattern: 'Very quick trades without analysis',
                    triggerEvents: ['Impulse', 'Lack of planning', 'Emotional decisions']
                },
                description: `Detected ${impulsiveTrades.length} impulsive trades with average loss of ₹${Math.abs(avgLoss).toFixed(2)}`
            };
        }

        return null;
    }

    /**
     * Analyze position sizing patterns
     */
    private analyzePositionSizing(trades: Trade[], tradingRules: TradingRules): RiskTakingPattern | null {
        const avgPositionSize = trades.reduce((sum, trade) => sum + trade.quantity, 0) / trades.length;
        const maxPositionSize = Math.max(...trades.map(trade => trade.quantity));

        // Check if position sizes are too large relative to account size
        const largePositionTrades = trades.filter(trade => trade.quantity > avgPositionSize * 2);

        if (largePositionTrades.length > 0) {
            return {
                type: 'position_sizing',
                severity: this.calculateSeverity(largePositionTrades.length / trades.length),
                evidence: {
                    avgPositionSize,
                    maxPositionSize,
                    riskRewardRatio: 0, // Will be calculated separately
                    stopLossAdherence: 0, // Will be calculated separately
                    diversificationScore: 0 // Will be calculated separately
                },
                description: `Large position sizes detected with average of ${avgPositionSize.toFixed(2)} and max of ${maxPositionSize}`
            };
        }

        return null;
    }

    /**
     * Analyze risk-reward ratio patterns
     */
    private analyzeRiskRewardRatio(trades: Trade[], tradingRules: TradingRules): RiskTakingPattern | null {
        const riskRewardRatios = trades.map(trade => {
            const profit = trade.profitLoss || 0;
            const entryPrice = trade.entryPrice;
            const exitPrice = trade.exitPrice;
            const risk = Math.abs(entryPrice - exitPrice) * trade.quantity;
            return risk > 0 ? Math.abs(profit) / risk : 0;
        });

        const avgRiskReward = riskRewardRatios.reduce((sum, ratio) => sum + ratio, 0) / riskRewardRatios.length;
        const poorRiskRewardTrades = riskRewardRatios.filter(ratio => ratio < 1);

        if (poorRiskRewardTrades.length > trades.length * 0.4) { // More than 40% of trades
            return {
                type: 'risk_reward',
                severity: this.calculateSeverity(poorRiskRewardTrades.length / trades.length),
                evidence: {
                    avgPositionSize: 0, // Will be calculated separately
                    maxPositionSize: 0, // Will be calculated separately
                    riskRewardRatio: avgRiskReward,
                    stopLossAdherence: 0, // Will be calculated separately
                    diversificationScore: 0 // Will be calculated separately
                },
                description: `Poor risk-reward ratios detected with average of ${avgRiskReward.toFixed(2)}`
            };
        }

        return null;
    }

    /**
     * Analyze stop-loss adherence
     */
    private analyzeStopLossAdherence(trades: Trade[], tradingRules: TradingRules): RiskTakingPattern | null {
        // This would require additional data about planned stop losses
        // For now, we'll analyze based on loss patterns
        const largeLossTrades = trades.filter(trade => (trade.profitLoss || 0) < -1000);
        const stopLossAdherence = 1 - (largeLossTrades.length / trades.length);

        if (stopLossAdherence < 0.7) { // Less than 70% adherence
            return {
                type: 'stop_loss',
                severity: this.calculateSeverity(1 - stopLossAdherence),
                evidence: {
                    avgPositionSize: 0, // Will be calculated separately
                    maxPositionSize: 0, // Will be calculated separately
                    riskRewardRatio: 0, // Will be calculated separately
                    stopLossAdherence,
                    diversificationScore: 0 // Will be calculated separately
                },
                description: `Poor stop-loss adherence detected with ${(stopLossAdherence * 100).toFixed(1)}% adherence`
            };
        }

        return null;
    }

    /**
     * Analyze leverage usage
     */
    private analyzeLeverageUsage(trades: Trade[]): RiskTakingPattern | null {
        // This would require leverage data from the broker
        // For now, we'll analyze based on position sizes relative to account size
        const avgPositionSize = trades.reduce((sum, trade) => sum + trade.quantity, 0) / trades.length;

        // Assuming high leverage if average position size is very large
        if (avgPositionSize > 1000) { // Arbitrary threshold
            return {
                type: 'leverage',
                severity: 'medium',
                evidence: {
                    avgPositionSize,
                    maxPositionSize: Math.max(...trades.map(trade => trade.quantity)),
                    riskRewardRatio: 0, // Will be calculated separately
                    stopLossAdherence: 0, // Will be calculated separately
                    diversificationScore: 0 // Will be calculated separately
                },
                description: `High leverage usage detected with average position size of ${avgPositionSize.toFixed(2)}`
            };
        }

        return null;
    }

    /**
     * Analyze diversification patterns
     */
    private analyzeDiversification(trades: Trade[]): RiskTakingPattern | null {
        const symbols = new Set(trades.map(trade => trade.symbol));
        const diversificationScore = symbols.size / trades.length;

        if (diversificationScore < 0.1) { // Less than 10% diversification
            return {
                type: 'diversification',
                severity: this.calculateSeverity(1 - diversificationScore),
                evidence: {
                    avgPositionSize: 0, // Will be calculated separately
                    maxPositionSize: 0, // Will be calculated separately
                    riskRewardRatio: 0, // Will be calculated separately
                    stopLossAdherence: 0, // Will be calculated separately
                    diversificationScore
                },
                description: `Low diversification detected with score of ${(diversificationScore * 100).toFixed(1)}%`
            };
        }

        return null;
    }

    /**
     * Analyze trading frequency patterns
     */
    private analyzeTradingFrequency(trades: Trade[]): ConsistencyPattern | null {
        const tradingFrequency = trades.length / 30; // Trades per day (assuming 30 days)

        if (tradingFrequency > 10) { // More than 10 trades per day
            return {
                type: 'trading_frequency',
                severity: this.calculateSeverity(tradingFrequency / 10),
                evidence: {
                    tradingFrequency,
                    timeConsistency: 0, // Will be calculated separately
                    strategyAdherence: 0, // Will be calculated separately
                    goalAchievement: 0, // Will be calculated separately
                    learningProgress: 0 // Will be calculated separately
                },
                description: `High trading frequency detected with ${tradingFrequency.toFixed(1)} trades per day`
            };
        }

        return null;
    }

    /**
     * Analyze time-based patterns
     */
    private analyzeTimeBasedPatterns(trades: Trade[]): ConsistencyPattern | null {
        // Analyze trading times to check for consistency
        const tradingTimes = trades.map(trade => new Date(trade.date).getHours());
        const timeConsistency = this.calculateTimeConsistency(tradingTimes);

        if (timeConsistency < 0.5) { // Less than 50% consistency
            return {
                type: 'time_based',
                severity: this.calculateSeverity(1 - timeConsistency),
                evidence: {
                    tradingFrequency: 0, // Will be calculated separately
                    timeConsistency,
                    strategyAdherence: 0, // Will be calculated separately
                    goalAchievement: 0, // Will be calculated separately
                    learningProgress: 0 // Will be calculated separately
                },
                description: `Inconsistent trading times detected with ${(timeConsistency * 100).toFixed(1)}% consistency`
            };
        }

        return null;
    }

    /**
     * Analyze strategy adherence
     */
    private analyzeStrategyAdherence(trades: Trade[], tradingRules: TradingRules): ConsistencyPattern | null {
        // This would require strategy definition data
        // For now, we'll analyze based on trading rules adherence
        const ruleViolations = trades.filter(trade => {
            // Check against trading rules
            return false; // Placeholder logic
        });

        const strategyAdherence = 1 - (ruleViolations.length / trades.length);

        if (strategyAdherence < 0.8) { // Less than 80% adherence
            return {
                type: 'strategy_adherence',
                severity: this.calculateSeverity(1 - strategyAdherence),
                evidence: {
                    tradingFrequency: 0, // Will be calculated separately
                    timeConsistency: 0, // Will be calculated separately
                    strategyAdherence,
                    goalAchievement: 0, // Will be calculated separately
                    learningProgress: 0 // Will be calculated separately
                },
                description: `Poor strategy adherence detected with ${(strategyAdherence * 100).toFixed(1)}% adherence`
            };
        }

        return null;
    }

    /**
     * Analyze goal follow-through
     */
    private analyzeGoalFollowThrough(trades: Trade[]): ConsistencyPattern | null {
        // This would require goal data
        // For now, we'll analyze based on profit consistency
        const profitableTrades = trades.filter(trade => (trade.profitLoss || 0) > 0);
        const goalAchievement = profitableTrades.length / trades.length;

        if (goalAchievement < 0.5) { // Less than 50% profitable trades
            return {
                type: 'goal_follow_through',
                severity: this.calculateSeverity(1 - goalAchievement),
                evidence: {
                    tradingFrequency: 0, // Will be calculated separately
                    timeConsistency: 0, // Will be calculated separately
                    strategyAdherence: 0, // Will be calculated separately
                    goalAchievement,
                    learningProgress: 0 // Will be calculated separately
                },
                description: `Poor goal achievement detected with ${(goalAchievement * 100).toFixed(1)}% success rate`
            };
        }

        return null;
    }

    /**
     * Analyze learning progression
     */
    private analyzeLearningProgression(trades: Trade[]): ConsistencyPattern | null {
        // Analyze if performance is improving over time
        const recentTrades = trades.slice(-10); // Last 10 trades
        const olderTrades = trades.slice(0, -10); // Earlier trades

        if (recentTrades.length === 0 || olderTrades.length === 0) {
            return null;
        }

        const recentPerformance = recentTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / recentTrades.length;
        const olderPerformance = olderTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / olderTrades.length;

        const learningProgress = recentPerformance > olderPerformance ? 1 : 0;

        if (learningProgress === 0) {
            return {
                type: 'learning_progression',
                severity: 'medium',
                evidence: {
                    tradingFrequency: 0, // Will be calculated separately
                    timeConsistency: 0, // Will be calculated separately
                    strategyAdherence: 0, // Will be calculated separately
                    goalAchievement: 0, // Will be calculated separately
                    learningProgress
                },
                description: `No learning progression detected - performance not improving over time`
            };
        }

        return null;
    }

    /**
     * Analyze rule following behavior
     */
    private analyzeRuleFollowing(trades: Trade[], tradingRules: TradingRules): DisciplinePattern | null {
        // Check adherence to trading rules
        const ruleViolations = trades.filter(trade => {
            // Check against trading rules
            return false; // Placeholder logic
        });

        const ruleAdherence = 1 - (ruleViolations.length / trades.length);

        if (ruleAdherence < 0.9) { // Less than 90% adherence
            return {
                type: 'rule_following',
                severity: this.calculateSeverity(1 - ruleAdherence),
                evidence: {
                    ruleAdherence,
                    emotionalControl: 0, // Will be calculated separately
                    preparationScore: 0, // Will be calculated separately
                    analysisHabits: 0, // Will be calculated separately
                    improvementRate: 0 // Will be calculated separately
                },
                description: `Poor rule adherence detected with ${(ruleAdherence * 100).toFixed(1)}% adherence`
            };
        }

        return null;
    }

    /**
     * Analyze emotional control
     */
    private analyzeEmotionalControl(trades: Trade[]): DisciplinePattern | null {
        // Analyze emotional patterns from trade data
        const emotionalTrades = trades.filter(trade => {
            const profit = trade.profitLoss || 0;
            const duration = trade.duration || 0;
            return profit < -500 || duration < 30; // Large losses or very quick trades
        });

        const emotionalControl = 1 - (emotionalTrades.length / trades.length);

        if (emotionalControl < 0.8) { // Less than 80% control
            return {
                type: 'emotional_control',
                severity: this.calculateSeverity(1 - emotionalControl),
                evidence: {
                    ruleAdherence: 0, // Will be calculated separately
                    emotionalControl,
                    preparationScore: 0, // Will be calculated separately
                    analysisHabits: 0, // Will be calculated separately
                    improvementRate: 0 // Will be calculated separately
                },
                description: `Poor emotional control detected with ${(emotionalControl * 100).toFixed(1)}% control`
            };
        }

        return null;
    }

    /**
     * Analyze preparation and planning
     */
    private analyzePreparation(trades: Trade[]): DisciplinePattern | null {
        // Analyze if trades show signs of preparation
        const unpreparedTrades = trades.filter(trade => {
            const duration = trade.duration || 0;
            return duration < 60; // Very quick trades might indicate lack of preparation
        });

        const preparationScore = 1 - (unpreparedTrades.length / trades.length);

        if (preparationScore < 0.7) { // Less than 70% preparation
            return {
                type: 'preparation',
                severity: this.calculateSeverity(1 - preparationScore),
                evidence: {
                    ruleAdherence: 0, // Will be calculated separately
                    emotionalControl: 0, // Will be calculated separately
                    preparationScore,
                    analysisHabits: 0, // Will be calculated separately
                    improvementRate: 0 // Will be calculated separately
                },
                description: `Poor preparation detected with ${(preparationScore * 100).toFixed(1)}% preparation score`
            };
        }

        return null;
    }

    /**
     * Analyze post-trade analysis habits
     */
    private analyzePostTradeAnalysis(trades: Trade[]): DisciplinePattern | null {
        // This would require additional data about analysis habits
        // For now, we'll assume good analysis if there's good performance
        const profitableTrades = trades.filter(trade => (trade.profitLoss || 0) > 0);
        const analysisHabits = profitableTrades.length / trades.length;

        if (analysisHabits < 0.6) { // Less than 60% profitable trades
            return {
                type: 'post_trade_analysis',
                severity: this.calculateSeverity(1 - analysisHabits),
                evidence: {
                    ruleAdherence: 0, // Will be calculated separately
                    emotionalControl: 0, // Will be calculated separately
                    preparationScore: 0, // Will be calculated separately
                    analysisHabits,
                    improvementRate: 0 // Will be calculated separately
                },
                description: `Poor post-trade analysis habits detected with ${(analysisHabits * 100).toFixed(1)}% success rate`
            };
        }

        return null;
    }

    /**
     * Analyze continuous improvement
     */
    private analyzeContinuousImprovement(trades: Trade[]): DisciplinePattern | null {
        // Analyze if performance is improving over time
        const recentTrades = trades.slice(-10); // Last 10 trades
        const olderTrades = trades.slice(0, -10); // Earlier trades

        if (recentTrades.length === 0 || olderTrades.length === 0) {
            return null;
        }

        const recentPerformance = recentTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / recentTrades.length;
        const olderPerformance = olderTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / olderTrades.length;

        const improvementRate = recentPerformance > olderPerformance ? 1 : 0;

        if (improvementRate === 0) {
            return {
                type: 'continuous_improvement',
                severity: 'medium',
                evidence: {
                    ruleAdherence: 0, // Will be calculated separately
                    emotionalControl: 0, // Will be calculated separately
                    preparationScore: 0, // Will be calculated separately
                    analysisHabits: 0, // Will be calculated separately
                    improvementRate
                },
                description: `No continuous improvement detected - performance not improving over time`
            };
        }

        return null;
    }

    /**
     * Generate AI-powered behavioral insights
     */
    private async generateAIBehavioralInsights(
        trades: Trade[],
        analyticsData: Analytics,
        emotionalPatterns: EmotionalPattern[],
        riskTakingPatterns: RiskTakingPattern[],
        consistencyPatterns: ConsistencyPattern[],
        disciplinePatterns: DisciplinePattern[]
    ): Promise<{ recommendations: string[] }> {
        try {
            // Prepare data for AI analysis
            const analysisData = {
                totalTrades: trades.length,
                winRate: analyticsData.winRate,
                avgProfitPerTrade: analyticsData.avgProfitLossPerTrade,
                maxDrawdown: analyticsData.maxDrawdown,
                emotionalPatterns: emotionalPatterns.length,
                riskTakingPatterns: riskTakingPatterns.length,
                consistencyPatterns: consistencyPatterns.length,
                disciplinePatterns: disciplinePatterns.length
            };

            // Generate AI insights
            const aiResponse = await generateBehavioralAnalysis(analysisData);

            // Parse and return recommendations
            const recommendations = aiResponse.split('\n').filter((line: string) => line.trim().length > 0);

            return { recommendations };
        } catch (error) {
            logger.error('Error generating AI behavioral insights', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            // Return default recommendations if AI fails
            return {
                recommendations: [
                    'Focus on emotional control during trading',
                    'Maintain consistent risk management',
                    'Follow your trading plan strictly',
                    'Review trades regularly for improvement'
                ]
            };
        }
    }

    /**
     * Convert pattern to BehavioralPattern format
     */
    private convertToBehavioralPattern(pattern: EmotionalPattern | RiskTakingPattern | ConsistencyPattern | DisciplinePattern, type: string): BehavioralPattern {
        // Extract frequency from pattern evidence
        let frequency = 0;
        if ('frequency' in pattern.evidence) {
            frequency = pattern.evidence.frequency;
        } else if ('tradingFrequency' in pattern.evidence) {
            frequency = pattern.evidence.tradingFrequency;
        }

        return {
            type: type as any,
            severity: pattern.severity,
            title: `${type.replace('_', ' ').toUpperCase()} Pattern`,
            description: pattern.description,
            evidence: pattern.evidence,
            confidence: 0.8, // Default confidence
            frequency,
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
     * Identify areas for improvement
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

    /**
     * Calculate time consistency score
     */
    private calculateTimeConsistency(tradingTimes: number[]): number {
        const hourDistribution = tradingTimes.reduce((acc, hour) => {
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const mostCommonHour = Object.entries(hourDistribution).sort((a, b) => b[1] - a[1])[0];
        return mostCommonHour[1] / tradingTimes.length;
    }
}

export const behavioralAnalysisService = new BehavioralAnalysisService(); 