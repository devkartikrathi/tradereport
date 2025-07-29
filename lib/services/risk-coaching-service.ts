import { prisma } from '@/lib/prisma';
import { riskManagementService } from './risk-management-service';
// import { generateRiskAnalysis } from '@/lib/gemini';
import { logger } from '@/lib/logger';

export interface RiskGoal {
    id: string;
    userId: string;
    category: 'position_sizing' | 'risk_reward' | 'stop_loss' | 'portfolio_diversification';
    title: string;
    description: string;
    targetValue: number;
    currentValue: number;
    deadline: Date;
    isCompleted: boolean;
    progress: number; // 0-100
    createdAt: Date;
    updatedAt: Date;
}

export interface RiskCoachingRecommendation {
    id: string;
    userId: string;
    category: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    actionSteps: string[];
    expectedOutcome: string;
    timeframe: string;
    isImplemented: boolean;
    createdAt: Date;
}

export interface RiskProgressTracking {
    userId: string;
    category: string;
    metric: string;
    currentValue: number;
    targetValue: number;
    progress: number;
    trend: 'improving' | 'declining' | 'stable';
    lastUpdated: Date;
}

export interface RiskCoachingPlan {
    userId: string;
    goals: RiskGoal[];
    recommendations: RiskCoachingRecommendation[];
    progressTracking: RiskProgressTracking[];
    overallProgress: number;
    nextSteps: string[];
    estimatedTimeline: string;
}

export class RiskCoachingService {
    /**
     * Generate personalized risk coaching plan for user
     */
    async generateCoachingPlan(userId: string): Promise<RiskCoachingPlan> {
        try {
            // Get risk analysis
            const analysis = await riskManagementService.analyzeUserRisk(userId);

            // Generate goals based on analysis
            const goals = await this.generateRiskGoals(userId, analysis);

            // Generate recommendations
            const recommendations = await this.generateRecommendations(userId, analysis);

            // Set up progress tracking
            const progressTracking = await this.setupProgressTracking(userId, analysis);

            // Calculate overall progress
            const overallProgress = this.calculateOverallProgress(progressTracking);

            // Generate next steps
            const nextSteps = this.generateNextSteps(analysis, goals, recommendations);

            // Estimate timeline
            const estimatedTimeline = this.estimateTimeline(analysis, goals);

            return {
                userId,
                goals,
                recommendations,
                progressTracking,
                overallProgress,
                nextSteps,
                estimatedTimeline
            };
        } catch (error) {
            logger.error('Error generating risk coaching plan', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Generate risk management goals based on analysis
     */
    private async generateRiskGoals(userId: string, analysis: any): Promise<RiskGoal[]> {
        const goals: RiskGoal[] = [];
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Position sizing goals
        if (analysis.metrics.positionSizing.positionSizeRatio > 0.1) {
            const positionSizingGoal: RiskGoal = {
                id: `goal_${Date.now()}_1`,
                userId: user.id,
                category: 'position_sizing',
                title: 'Improve Position Sizing',
                description: 'Reduce position sizes to maximum 5% of account per trade',
                targetValue: 0.05,
                currentValue: analysis.metrics.positionSizing.positionSizeRatio,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                isCompleted: false,
                progress: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            goals.push(positionSizingGoal);
        }

        // Risk-reward goals
        if (analysis.metrics.riskReward.avgRiskRewardRatio < analysis.metrics.riskReward.optimalRiskRewardRatio) {
            const riskRewardGoal: RiskGoal = {
                id: `goal_${Date.now()}_2`,
                userId: user.id,
                category: 'risk_reward',
                title: 'Improve Risk-Reward Ratio',
                description: 'Achieve minimum 2:1 risk-reward ratio on all trades',
                targetValue: 2.0,
                currentValue: analysis.metrics.riskReward.avgRiskRewardRatio,
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
                isCompleted: false,
                progress: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            goals.push(riskRewardGoal);
        }

        // Stop-loss goals
        if (analysis.metrics.stopLoss.stopLossAdherence < 0.8) {
            const stopLossGoal: RiskGoal = {
                id: `goal_${Date.now()}_3`,
                userId: user.id,
                category: 'stop_loss',
                title: 'Improve Stop-Loss Discipline',
                description: 'Maintain 90% stop-loss adherence rate',
                targetValue: 0.9,
                currentValue: analysis.metrics.stopLoss.stopLossAdherence,
                deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
                isCompleted: false,
                progress: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            goals.push(stopLossGoal);
        }

        // Portfolio diversification goals
        if (analysis.metrics.portfolioRisk.concentrationScore > 0.3) {
            const diversificationGoal: RiskGoal = {
                id: `goal_${Date.now()}_4`,
                userId: user.id,
                category: 'portfolio_diversification',
                title: 'Improve Portfolio Diversification',
                description: 'Reduce portfolio concentration to maximum 20% per position',
                targetValue: 0.2,
                currentValue: analysis.metrics.portfolioRisk.concentrationScore,
                deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                isCompleted: false,
                progress: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            goals.push(diversificationGoal);
        }

        return goals;
    }

    /**
     * Generate personalized risk management recommendations
     */
    private async generateRecommendations(userId: string, analysis: any): Promise<RiskCoachingRecommendation[]> {
        const recommendations: RiskCoachingRecommendation[] = [];

        // Position sizing recommendations
        if (analysis.metrics.positionSizing.positionSizeRatio > 0.1) {
            const positionSizingRec: RiskCoachingRecommendation = {
                id: `rec_${Date.now()}_1`,
                userId,
                category: 'position_sizing',
                title: 'Implement Conservative Position Sizing',
                description: 'Reduce position sizes to protect capital',
                priority: 'critical',
                actionSteps: [
                    'Never risk more than 2% of account on single trade',
                    'Use position sizing calculator before each trade',
                    'Scale into positions rather than full size entry',
                    'Set maximum position size limits'
                ],
                expectedOutcome: 'Reduce position size ratio to 5% or less',
                timeframe: '30 days',
                isImplemented: false,
                createdAt: new Date()
            };
            recommendations.push(positionSizingRec);
        }

        // Risk-reward recommendations
        if (analysis.metrics.riskReward.avgRiskRewardRatio < analysis.metrics.riskReward.optimalRiskRewardRatio) {
            const riskRewardRec: RiskCoachingRecommendation = {
                id: `rec_${Date.now()}_2`,
                userId,
                category: 'risk_reward',
                title: 'Optimize Risk-Reward Ratios',
                description: 'Improve risk-reward ratios for better profitability',
                priority: 'high',
                actionSteps: [
                    'Wait for better entry points with higher reward potential',
                    'Set minimum 2:1 risk-reward ratio requirement',
                    'Use technical analysis to identify optimal entry/exit points',
                    'Avoid low probability setups'
                ],
                expectedOutcome: 'Achieve average risk-reward ratio of 2:1 or higher',
                timeframe: '45 days',
                isImplemented: false,
                createdAt: new Date()
            };
            recommendations.push(riskRewardRec);
        }

        // Stop-loss recommendations
        if (analysis.metrics.stopLoss.stopLossAdherence < 0.8) {
            const stopLossRec: RiskCoachingRecommendation = {
                id: `rec_${Date.now()}_3`,
                userId,
                category: 'stop_loss',
                title: 'Implement Strict Stop-Loss Discipline',
                description: 'Improve stop-loss adherence for better risk management',
                priority: 'critical',
                actionSteps: [
                    'Set stop-loss orders before entering trades',
                    'Use automated stop-loss orders when possible',
                    'Never move stop-loss in the wrong direction',
                    'Review stop-loss placement regularly'
                ],
                expectedOutcome: 'Achieve 90% stop-loss adherence rate',
                timeframe: '60 days',
                isImplemented: false,
                createdAt: new Date()
            };
            recommendations.push(stopLossRec);
        }

        // Portfolio diversification recommendations
        if (analysis.metrics.portfolioRisk.concentrationScore > 0.3) {
            const diversificationRec: RiskCoachingRecommendation = {
                id: `rec_${Date.now()}_4`,
                userId,
                category: 'portfolio_diversification',
                title: 'Improve Portfolio Diversification',
                description: 'Reduce portfolio concentration risk',
                priority: 'high',
                actionSteps: [
                    'Limit single position to maximum 20% of portfolio',
                    'Diversify across different sectors and symbols',
                    'Avoid over-concentration in single stock/sector',
                    'Regularly review portfolio allocation'
                ],
                expectedOutcome: 'Reduce portfolio concentration to 20% or less',
                timeframe: '90 days',
                isImplemented: false,
                createdAt: new Date()
            };
            recommendations.push(diversificationRec);
        }

        return recommendations;
    }

    /**
     * Set up progress tracking metrics
     */
    private async setupProgressTracking(userId: string, analysis: any): Promise<RiskProgressTracking[]> {
        const tracking: RiskProgressTracking[] = [];

        // Position sizing tracking
        tracking.push({
            userId,
            category: 'position_sizing',
            metric: 'Position Size Ratio',
            currentValue: analysis.metrics.positionSizing.positionSizeRatio,
            targetValue: 0.05,
            progress: Math.max(0, (1 - analysis.metrics.positionSizing.positionSizeRatio / 0.05) * 100),
            trend: 'stable',
            lastUpdated: new Date()
        });

        // Risk-reward tracking
        tracking.push({
            userId,
            category: 'risk_reward',
            metric: 'Risk-Reward Ratio',
            currentValue: analysis.metrics.riskReward.avgRiskRewardRatio,
            targetValue: 2.0,
            progress: Math.min(100, (analysis.metrics.riskReward.avgRiskRewardRatio / 2.0) * 100),
            trend: analysis.metrics.riskReward.riskRewardTrend,
            lastUpdated: new Date()
        });

        // Stop-loss tracking
        tracking.push({
            userId,
            category: 'stop_loss',
            metric: 'Stop-Loss Adherence',
            currentValue: analysis.metrics.stopLoss.stopLossAdherence,
            targetValue: 0.9,
            progress: (analysis.metrics.stopLoss.stopLossAdherence / 0.9) * 100,
            trend: 'stable',
            lastUpdated: new Date()
        });

        // Portfolio diversification tracking
        tracking.push({
            userId,
            category: 'portfolio_diversification',
            metric: 'Portfolio Concentration',
            currentValue: analysis.metrics.portfolioRisk.concentrationScore,
            targetValue: 0.2,
            progress: Math.max(0, (1 - analysis.metrics.portfolioRisk.concentrationScore / 0.2) * 100),
            trend: 'stable',
            lastUpdated: new Date()
        });

        return tracking;
    }

    /**
     * Calculate overall progress
     */
    private calculateOverallProgress(tracking: RiskProgressTracking[]): number {
        if (tracking.length === 0) return 0;

        const totalProgress = tracking.reduce((sum, item) => sum + item.progress, 0);
        return totalProgress / tracking.length;
    }

    /**
     * Generate next steps
     */
    private generateNextSteps(analysis: any, goals: RiskGoal[], recommendations: RiskCoachingRecommendation[]): string[] {
        const nextSteps: string[] = [];

        // Prioritize based on risk score
        if (analysis.overallRiskScore < 50) {
            nextSteps.push('Address critical risk management issues immediately');
            nextSteps.push('Implement strict position sizing rules');
            nextSteps.push('Focus on stop-loss discipline');
        }

        if (analysis.overallRiskScore < 70) {
            nextSteps.push('Focus on high-priority risk management areas');
            nextSteps.push('Start implementing coaching recommendations');
            nextSteps.push('Begin tracking progress on key metrics');
        }

        if (goals.length > 0) {
            nextSteps.push('Set up risk management goal tracking');
            nextSteps.push('Create daily/weekly risk review routine');
        }

        if (recommendations.length > 0) {
            nextSteps.push('Prioritize and implement top risk management recommendations');
            nextSteps.push('Schedule regular risk management reviews');
        }

        return nextSteps;
    }

    /**
     * Estimate improvement timeline
     */
    private estimateTimeline(_analysis: any, goals: RiskGoal[]): string {
        const criticalGoals = goals.filter(goal => goal.category === 'position_sizing' || goal.category === 'stop_loss');
        const highPriorityGoals = goals.filter(goal => goal.category === 'risk_reward' || goal.category === 'portfolio_diversification');

        if (criticalGoals.length > 0) {
            return '3-6 months for significant risk management improvement';
        } else if (highPriorityGoals.length > 0) {
            return '2-3 months for noticeable risk management improvement';
        } else {
            return '1-2 months for risk management refinement';
        }
    }

    /**
     * Save risk management goal
     */
    async saveRiskGoal(userId: string, goal: Omit<RiskGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<RiskGoal> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // In a real implementation, this would save to database
            // For now, we'll return the goal with generated ID
            const savedGoal: RiskGoal = {
                ...goal,
                id: `goal_${Date.now()}`,
                userId: user.id,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            logger.info('Risk management goal saved', {
                userId,
                goalId: savedGoal.id,
                category: savedGoal.category
            });

            return savedGoal;
        } catch (error) {
            logger.error('Error saving risk management goal', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Update goal progress
     */
    async updateGoalProgress(goalId: string, userId: string, progress: number): Promise<boolean> {
        try {
            // In a real implementation, this would update the database
            logger.info('Risk management goal progress updated', {
                goalId,
                userId,
                progress
            });

            return true;
        } catch (error) {
            logger.error('Error updating risk management goal progress', {
                goalId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Mark recommendation as implemented
     */
    async markRecommendationImplemented(recommendationId: string, userId: string): Promise<boolean> {
        try {
            // In a real implementation, this would update the database
            logger.info('Risk management recommendation marked as implemented', {
                recommendationId,
                userId
            });

            return true;
        } catch (error) {
            logger.error('Error marking risk management recommendation as implemented', {
                recommendationId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Get user's risk coaching progress
     */
    async getUserRiskCoachingProgress(userId: string): Promise<{
        goals: RiskGoal[];
        recommendations: RiskCoachingRecommendation[];
        progressTracking: RiskProgressTracking[];
        overallProgress: number;
    }> {
        try {
            // In a real implementation, this would fetch from database
            // For now, we'll generate a new coaching plan
            const coachingPlan = await this.generateCoachingPlan(userId);

            return {
                goals: coachingPlan.goals,
                recommendations: coachingPlan.recommendations,
                progressTracking: coachingPlan.progressTracking,
                overallProgress: coachingPlan.overallProgress
            };
        } catch (error) {
            logger.error('Error getting user risk coaching progress', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            return {
                goals: [],
                recommendations: [],
                progressTracking: [],
                overallProgress: 0
            };
        }
    }

    /**
     * Generate weekly risk management report
     */
    async generateWeeklyReport(userId: string): Promise<{
        summary: string;
        progress: Record<string, number>;
        recommendations: string[];
        nextWeekGoals: string[];
    }> {
        try {
            const coachingProgress = await this.getUserRiskCoachingProgress(userId);

            const summary = `Weekly risk management report for ${userId}. Overall progress: ${coachingProgress.overallProgress.toFixed(1)}%`;

            const progress = coachingProgress.progressTracking.reduce((acc, item) => {
                acc[item.metric] = item.progress;
                return acc;
            }, {} as Record<string, number>);

            const recommendations = coachingProgress.recommendations
                .filter(rec => !rec.isImplemented)
                .map(rec => rec.title);

            const nextWeekGoals = coachingProgress.goals
                .filter(goal => !goal.isCompleted)
                .map(goal => goal.title);

            return {
                summary,
                progress,
                recommendations,
                nextWeekGoals
            };
        } catch (error) {
            logger.error('Error generating weekly risk management report', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            return {
                summary: 'Unable to generate report',
                progress: {},
                recommendations: [],
                nextWeekGoals: []
            };
        }
    }
}

export const riskCoachingService = new RiskCoachingService(); 