import { prisma } from '@/lib/prisma';
import { analyticsService } from './analytics-service';
import { logger } from '@/lib/logger';

export interface PerformanceGoal {
    id: string;
    userId: string;
    title: string;
    description?: string;
    category: 'profit_target' | 'win_rate' | 'risk_management' | 'consistency';
    targetValue: number;
    currentValue: number;
    startDate: Date;
    targetDate?: Date;
    isActive: boolean;
    progress: number; // 0-100 percentage
    insights?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface GoalProgress {
    goalId: string;
    currentValue: number;
    targetValue: number;
    progress: number;
    trend: 'improving' | 'declining' | 'stable';
    estimatedCompletion?: Date;
    milestones: GoalMilestone[];
}

export interface GoalMilestone {
    id: string;
    goalId: string;
    milestone: number; // Percentage milestone (25, 50, 75, 100)
    achieved: boolean;
    achievedDate?: Date;
    description: string;
}

export interface GoalValidation {
    isValid: boolean;
    suggestions: string[];
    difficulty: 'easy' | 'moderate' | 'challenging' | 'very_challenging';
    estimatedAchievementProbability: number;
    recommendedAdjustments: string[];
}

export interface GoalRecommendation {
    category: string;
    title: string;
    description: string;
    suggestedTarget: number;
    reasoning: string;
    difficulty: 'easy' | 'moderate' | 'challenging' | 'very_challenging';
}

export class PerformanceGoalService {
    /**
     * Create a new performance goal
     */
    async createGoal(userId: string, goalData: Omit<PerformanceGoal, 'id' | 'userId' | 'currentValue' | 'progress' | 'createdAt' | 'updatedAt'>): Promise<PerformanceGoal> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Validate goal before creating
            const validation = await this.validateGoal(userId, goalData);
            if (!validation.isValid) {
                throw new Error(`Goal validation failed: ${validation.suggestions.join(', ')}`);
            }

            // Calculate initial progress
            const analyticsData = await analyticsService.getUserAnalytics(userId);
            const currentValue = this.calculateCurrentValue(goalData.category, analyticsData);
            const progress = this.calculateProgress(currentValue, goalData.targetValue);

            const savedGoal = await prisma.performanceGoal.create({
                data: {
                    userId: user.id,
                    title: goalData.title,
                    description: goalData.description,
                    category: goalData.category,
                    targetValue: goalData.targetValue,
                    currentValue,
                    startDate: goalData.startDate,
                    targetDate: goalData.targetDate,
                    isActive: goalData.isActive,
                    progress,
                    insights: goalData.insights
                }
            });

            logger.info('Performance goal created', {
                userId,
                goalId: savedGoal.id,
                category: savedGoal.category,
                targetValue: savedGoal.targetValue
            });

            return {
                id: savedGoal.id,
                userId: savedGoal.userId,
                title: savedGoal.title,
                description: savedGoal.description,
                category: savedGoal.category as PerformanceGoal['category'],
                targetValue: savedGoal.targetValue,
                currentValue: savedGoal.currentValue,
                startDate: savedGoal.startDate,
                targetDate: savedGoal.targetDate,
                isActive: savedGoal.isActive,
                progress: savedGoal.progress,
                insights: savedGoal.insights as Record<string, unknown>,
                createdAt: savedGoal.createdAt,
                updatedAt: savedGoal.updatedAt
            };
        } catch (error) {
            logger.error('Error creating performance goal', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Get user's performance goals
     */
    async getUserGoals(userId: string): Promise<PerformanceGoal[]> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                return [];
            }

            const goals = await prisma.performanceGoal.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' }
            });

            return goals.map(goal => ({
                id: goal.id,
                userId: goal.userId,
                title: goal.title,
                description: goal.description,
                category: goal.category as PerformanceGoal['category'],
                targetValue: goal.targetValue,
                currentValue: goal.currentValue,
                startDate: goal.startDate,
                targetDate: goal.targetDate,
                isActive: goal.isActive,
                progress: goal.progress,
                insights: goal.insights as Record<string, unknown>,
                createdAt: goal.createdAt,
                updatedAt: goal.updatedAt
            }));
        } catch (error) {
            logger.error('Error getting user performance goals', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Update a performance goal
     */
    async updateGoal(goalId: string, userId: string, updates: Partial<Omit<PerformanceGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<PerformanceGoal> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Validate goal if target value is being updated
            if (updates.targetValue !== undefined) {
                const goal = await prisma.performanceGoal.findUnique({
                    where: { id: goalId }
                });

                if (goal) {
                    const validation = await this.validateGoal(userId, {
                        ...goal,
                        targetValue: updates.targetValue
                    });
                    if (!validation.isValid) {
                        throw new Error(`Goal validation failed: ${validation.suggestions.join(', ')}`);
                    }
                }
            }

            const updatedGoal = await prisma.performanceGoal.update({
                where: { id: goalId },
                data: updates
            });

            logger.info('Performance goal updated', {
                userId,
                goalId,
                updates: Object.keys(updates)
            });

            return {
                id: updatedGoal.id,
                userId: updatedGoal.userId,
                title: updatedGoal.title,
                description: updatedGoal.description,
                category: updatedGoal.category as PerformanceGoal['category'],
                targetValue: updatedGoal.targetValue,
                currentValue: updatedGoal.currentValue,
                startDate: updatedGoal.startDate,
                targetDate: updatedGoal.targetDate,
                isActive: updatedGoal.isActive,
                progress: updatedGoal.progress,
                insights: updatedGoal.insights as Record<string, unknown>,
                createdAt: updatedGoal.createdAt,
                updatedAt: updatedGoal.updatedAt
            };
        } catch (error) {
            logger.error('Error updating performance goal', {
                goalId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Delete a performance goal
     */
    async deleteGoal(goalId: string, userId: string): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            await prisma.performanceGoal.delete({
                where: { id: goalId }
            });

            logger.info('Performance goal deleted', {
                userId,
                goalId
            });

            return true;
        } catch (error) {
            logger.error('Error deleting performance goal', {
                goalId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Get goal progress
     */
    async getGoalProgress(goalId: string, userId: string): Promise<GoalProgress> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            const goal = await prisma.performanceGoal.findUnique({
                where: { id: goalId }
            });

            if (!goal) {
                throw new Error('Goal not found');
            }

            // Get current analytics data
            const analyticsData = await analyticsService.getUserAnalytics(userId);
            const currentValue = this.calculateCurrentValue(goal.category as PerformanceGoal['category'], analyticsData);
            const progress = this.calculateProgress(currentValue, goal.targetValue);

            // Calculate trend
            const trend = this.calculateTrend(goal.currentValue, currentValue);

            // Estimate completion date
            const estimatedCompletion = this.estimateCompletionDate(goal, currentValue, progress);

            // Generate milestones
            const milestones = this.generateMilestones(goalId, progress);

            return {
                goalId,
                currentValue,
                targetValue: goal.targetValue,
                progress,
                trend,
                estimatedCompletion,
                milestones
            };
        } catch (error) {
            logger.error('Error getting goal progress', {
                goalId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Update goal progress
     */
    async updateGoalProgress(goalId: string, userId: string): Promise<PerformanceGoal> {
        try {
            const progress = await this.getGoalProgress(goalId, userId);

            const updatedGoal = await this.updateGoal(goalId, userId, {
                currentValue: progress.currentValue,
                progress: progress.progress
            });

            logger.info('Goal progress updated', {
                goalId,
                userId,
                progress: progress.progress
            });

            return updatedGoal;
        } catch (error) {
            logger.error('Error updating goal progress', {
                goalId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Validate goal before creation/update
     */
    async validateGoal(userId: string, goalData: Partial<PerformanceGoal>): Promise<GoalValidation> {
        try {
            const analyticsData = await analyticsService.getUserAnalytics(userId);
            const suggestions: string[] = [];
            let isValid = true;

            // Get baseline values
            const baselineValue = this.calculateCurrentValue(goalData.category as PerformanceGoal['category'], analyticsData);

            // Validate target value
            if (goalData.targetValue !== undefined) {
                const targetValue = goalData.targetValue;
                const improvement = ((targetValue - baselineValue) / baselineValue) * 100;

                if (improvement > 200) {
                    suggestions.push('Target seems very ambitious. Consider a more gradual improvement.');
                    isValid = false;
                } else if (improvement > 100) {
                    suggestions.push('Target is challenging but achievable with focused effort.');
                } else if (improvement > 50) {
                    suggestions.push('Target is moderately challenging and realistic.');
                } else if (improvement > 20) {
                    suggestions.push('Target is easily achievable.');
                } else {
                    suggestions.push('Target might be too conservative. Consider a more ambitious goal.');
                }
            }

            // Validate target date
            if (goalData.targetDate && goalData.startDate) {
                const daysToTarget = Math.ceil((goalData.targetDate.getTime() - goalData.startDate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysToTarget < 7) {
                    suggestions.push('Target date is very soon. Consider extending the timeline.');
                    isValid = false;
                } else if (daysToTarget < 30) {
                    suggestions.push('Short timeline. Ensure the goal is realistic for this timeframe.');
                }
            }

            // Calculate difficulty and probability
            const difficulty = this.calculateDifficulty(goalData, baselineValue);
            const probability = this.calculateAchievementProbability(goalData, baselineValue);

            return {
                isValid,
                suggestions,
                difficulty,
                estimatedAchievementProbability: probability,
                recommendedAdjustments: suggestions
            };
        } catch (error) {
            logger.error('Error validating goal', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                isValid: false,
                suggestions: ['Unable to validate goal due to error'],
                difficulty: 'challenging',
                estimatedAchievementProbability: 0,
                recommendedAdjustments: []
            };
        }
    }

    /**
     * Generate goal recommendations based on user's performance
     */
    async generateGoalRecommendations(userId: string): Promise<GoalRecommendation[]> {
        try {
            const analyticsData = await analyticsService.getUserAnalytics(userId);
            const recommendations: GoalRecommendation[] = [];

            // Profit target recommendation
            const currentProfit = analyticsData.analytics.totalNetProfitLoss || 0;
            const suggestedProfitTarget = currentProfit > 0 ? currentProfit * 1.5 : 1000;

            recommendations.push({
                category: 'profit_target',
                title: 'Monthly Profit Target',
                description: 'Set a realistic monthly profit target based on your current performance',
                suggestedTarget: suggestedProfitTarget,
                reasoning: `Based on your current monthly profit of ₹${currentProfit.toLocaleString('en-IN')}`,
                difficulty: suggestedProfitTarget > currentProfit * 2 ? 'challenging' : 'moderate'
            });

            // Win rate recommendation
            const currentWinRate = analyticsData.analytics.winRate || 0;
            const suggestedWinRate = Math.min(100, currentWinRate + 5);

            recommendations.push({
                category: 'win_rate',
                title: 'Win Rate Improvement',
                description: 'Improve your win rate through better trade selection and risk management',
                suggestedTarget: suggestedWinRate,
                reasoning: `Current win rate: ${currentWinRate.toFixed(1)}%. Aim for ${suggestedWinRate.toFixed(1)}%`,
                difficulty: suggestedWinRate > currentWinRate + 10 ? 'challenging' : 'moderate'
            });

            // Risk management recommendation
            const maxDrawdown = analyticsData.analytics.maxDrawdown || 0;
            const suggestedMaxDrawdown = Math.max(5, maxDrawdown * 0.8);

            recommendations.push({
                category: 'risk_management',
                title: 'Reduce Maximum Drawdown',
                description: 'Improve risk management by reducing maximum drawdown',
                suggestedTarget: suggestedMaxDrawdown,
                reasoning: `Current max drawdown: ${maxDrawdown.toFixed(1)}%. Target: ${suggestedMaxDrawdown.toFixed(1)}%`,
                difficulty: suggestedMaxDrawdown < maxDrawdown * 0.7 ? 'challenging' : 'moderate'
            });

            // Consistency recommendation
            const totalTrades = analyticsData.analytics.totalTrades || 0;
            const suggestedTradeCount = Math.max(20, totalTrades * 1.2);

            recommendations.push({
                category: 'consistency',
                title: 'Trading Consistency',
                description: 'Maintain consistent trading activity and strategy adherence',
                suggestedTarget: suggestedTradeCount,
                reasoning: `Current monthly trades: ${totalTrades}. Target: ${suggestedTradeCount} trades`,
                difficulty: suggestedTradeCount > totalTrades * 1.5 ? 'challenging' : 'moderate'
            });

            return recommendations;
        } catch (error) {
            logger.error('Error generating goal recommendations', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Calculate current value based on category
     */
    private calculateCurrentValue(category: PerformanceGoal['category'], analyticsData: any): number {
        switch (category) {
            case 'profit_target':
                return analyticsData.analytics.totalNetProfitLoss || 0;
            case 'win_rate':
                return analyticsData.analytics.winRate || 0;
            case 'risk_management':
                return analyticsData.analytics.maxDrawdown || 0;
            case 'consistency':
                return analyticsData.analytics.totalTrades || 0;
            default:
                return 0;
        }
    }

    /**
     * Calculate progress percentage
     */
    private calculateProgress(currentValue: number, targetValue: number): number {
        if (targetValue === 0) return 0;
        return Math.min(100, Math.max(0, (currentValue / targetValue) * 100));
    }

    /**
     * Calculate trend
     */
    private calculateTrend(previousValue: number, currentValue: number): 'improving' | 'declining' | 'stable' {
        const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
        if (change > 5) return 'improving';
        if (change < -5) return 'declining';
        return 'stable';
    }

    /**
     * Estimate completion date
     */
    private estimateCompletionDate(goal: any, currentValue: number, progress: number): Date | undefined {
        if (progress >= 100) return undefined;
        if (progress === 0) return undefined;

        const remainingProgress = 100 - progress;
        const daysSinceStart = Math.ceil((Date.now() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const estimatedDaysRemaining = (remainingProgress / progress) * daysSinceStart;

        return new Date(Date.now() + estimatedDaysRemaining * 24 * 60 * 60 * 1000);
    }

    /**
     * Generate milestones
     */
    private generateMilestones(goalId: string, progress: number): GoalMilestone[] {
        const milestones = [25, 50, 75, 100];
        return milestones.map(milestone => ({
            id: `${goalId}_${milestone}`,
            goalId,
            milestone,
            achieved: progress >= milestone,
            achievedDate: progress >= milestone ? new Date() : undefined,
            description: `${milestone}% of goal achieved`
        }));
    }

    /**
     * Calculate goal difficulty
     */
    private calculateDifficulty(goalData: Partial<PerformanceGoal>, baselineValue: number): 'easy' | 'moderate' | 'challenging' | 'very_challenging' {
        if (!goalData.targetValue) return 'moderate';

        const improvement = ((goalData.targetValue - baselineValue) / baselineValue) * 100;

        if (improvement <= 20) return 'easy';
        if (improvement <= 50) return 'moderate';
        if (improvement <= 100) return 'challenging';
        return 'very_challenging';
    }

    /**
     * Calculate achievement probability
     */
    private calculateAchievementProbability(goalData: Partial<PerformanceGoal>, baselineValue: number): number {
        if (!goalData.targetValue) return 50;

        const improvement = ((goalData.targetValue - baselineValue) / baselineValue) * 100;

        if (improvement <= 20) return 90;
        if (improvement <= 50) return 75;
        if (improvement <= 100) return 50;
        if (improvement <= 200) return 25;
        return 10;
    }
}

export const performanceGoalService = new PerformanceGoalService(); 