import { prisma } from '@/lib/prisma';
import { analyticsService } from './analytics-service';
import { performanceGoalService } from './performance-goal-service';
import { generateGoalInsights } from '@/lib/gemini';
import { logger } from '@/lib/logger';

export interface GoalInsight {
    id: string;
    goalId: string;
    insightType: 'achievement_probability' | 'optimization_suggestion' | 'adjustment_recommendation' | 'milestone_analysis';
    title: string;
    description: string;
    confidence: number; // 0-100
    priority: 'low' | 'medium' | 'high' | 'critical';
    actionableSteps: string[];
    expectedImpact: string;
    createdAt: Date;
}

export interface GoalAchievementAnalysis {
    goalId: string;
    currentProgress: number;
    achievementProbability: number;
    estimatedCompletionDate?: Date;
    keyFactors: string[];
    obstacles: string[];
    opportunities: string[];
    recommendations: string[];
    trendAnalysis: {
        direction: 'improving' | 'declining' | 'stable';
        velocity: number; // Progress per day
        acceleration: number; // Change in velocity
    };
}

export interface GoalOptimizationSuggestion {
    goalId: string;
    suggestionType: 'target_adjustment' | 'strategy_change' | 'timeline_modification' | 'milestone_revision';
    title: string;
    description: string;
    reasoning: string;
    expectedOutcome: string;
    implementationSteps: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface GoalPerformanceComparison {
    goalId: string;
    category: string;
    userPerformance: number;
    benchmarkPerformance: number;
    percentile: number; // User's performance percentile
    gap: number; // Gap to target
    gapAnalysis: string;
    improvementPotential: number;
}

export class GoalInsightsService {
    /**
     * Generate comprehensive goal insights
     */
    async generateGoalInsights(userId: string, goalId: string): Promise<GoalInsight[]> {
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

            // Get analytics data
            const analyticsData = await analyticsService.getUserAnalytics(userId);

            // Get goal progress
            const progress = await performanceGoalService.getGoalProgress(goalId, userId);

            // Generate AI insights
            // const aiInsights = await this.generateAIGoalInsights(goal, progress, analyticsData);

            // Create insight records
            const insights: GoalInsight[] = [];

            // Achievement probability insight
            const achievementProbability = this.calculateAchievementProbability(goal, progress);
            insights.push({
                id: `insight_${goalId}_achievement`,
                goalId,
                insightType: 'achievement_probability',
                title: 'Goal Achievement Probability',
                description: `Based on current progress and trends, you have a ${achievementProbability.toFixed(1)}% chance of achieving this goal.`,
                confidence: achievementProbability,
                priority: achievementProbability < 30 ? 'critical' : achievementProbability < 60 ? 'high' : 'medium',
                actionableSteps: this.generateAchievementSteps(goal, progress, achievementProbability),
                expectedImpact: `Improving your approach could increase success probability to ${Math.min(100, achievementProbability + 20).toFixed(1)}%`,
                createdAt: new Date()
            });

            // Optimization suggestions
            const optimizationSuggestions = this.generateOptimizationSuggestions(goal, progress, analyticsData);
            optimizationSuggestions.forEach((suggestion, index) => {
                insights.push({
                    id: `insight_${goalId}_optimization_${index}`,
                    goalId,
                    insightType: 'optimization_suggestion',
                    title: suggestion.title,
                    description: suggestion.description,
                    confidence: 75,
                    priority: suggestion.priority,
                    actionableSteps: suggestion.implementationSteps,
                    expectedImpact: suggestion.expectedOutcome,
                    createdAt: new Date()
                });
            });

            // Milestone analysis
            const milestoneInsights = this.analyzeMilestones(progress);
            milestoneInsights.forEach((milestone, index) => {
                insights.push({
                    id: `insight_${goalId}_milestone_${index}`,
                    goalId,
                    insightType: 'milestone_analysis',
                    title: `Milestone: ${milestone.milestone}%`,
                    description: milestone.description,
                    confidence: milestone.achieved ? 100 : 60,
                    priority: milestone.achieved ? 'low' : 'medium',
                    actionableSteps: milestone.actionableSteps,
                    expectedImpact: milestone.expectedImpact,
                    createdAt: new Date()
                });
            });

            return insights;
        } catch (error) {
            logger.error('Error generating goal insights', {
                userId,
                goalId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Analyze goal achievement probability
     */
    async analyzeGoalAchievement(goalId: string, userId: string): Promise<GoalAchievementAnalysis> {
        try {
            const progress = await performanceGoalService.getGoalProgress(goalId, userId);
            const goal = await prisma.performanceGoal.findUnique({
                where: { id: goalId }
            });

            if (!goal) {
                throw new Error('Goal not found');
            }

            const analyticsData = await analyticsService.getUserAnalytics(userId);
            const achievementProbability = this.calculateAchievementProbability(goal, progress);

            // Calculate trend analysis
            const trendAnalysis = this.calculateTrendAnalysis(goal, progress);

            // Identify key factors, obstacles, and opportunities
            const keyFactors = this.identifyKeyFactors(goal, progress, analyticsData);
            const obstacles = this.identifyObstacles(goal, progress, analyticsData);
            const opportunities = this.identifyOpportunities(goal, progress, analyticsData);
            const recommendations = this.generateRecommendations(goal, progress, analyticsData);

            return {
                goalId,
                currentProgress: progress.progress,
                achievementProbability,
                estimatedCompletionDate: progress.estimatedCompletion,
                keyFactors,
                obstacles,
                opportunities,
                recommendations,
                trendAnalysis
            };
        } catch (error) {
            logger.error('Error analyzing goal achievement', {
                goalId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Generate goal optimization suggestions
     */
    async generateOptimizationSuggestions(userId: string, goalId: string): Promise<GoalOptimizationSuggestion[]> {
        try {
            const progress = await performanceGoalService.getGoalProgress(goalId, userId);
            const goal = await prisma.performanceGoal.findUnique({
                where: { id: goalId }
            });

            if (!goal) {
                throw new Error('Goal not found');
            }

            const analyticsData = await analyticsService.getUserAnalytics(userId);
            return this.generateOptimizationSuggestions(goal, progress, analyticsData);
        } catch (error) {
            logger.error('Error generating optimization suggestions', {
                userId,
                goalId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Compare user performance with benchmarks
     */
    async compareWithBenchmarks(userId: string, goalId: string): Promise<GoalPerformanceComparison> {
        try {
            const progress = await performanceGoalService.getGoalProgress(goalId, userId);
            const goal = await prisma.performanceGoal.findUnique({
                where: { id: goalId }
            });

            if (!goal) {
                throw new Error('Goal not found');
            }

            // const analyticsData = await analyticsService.getUserAnalytics(userId);

            // Calculate benchmark performance (simplified)
            const benchmarkPerformance = this.calculateBenchmarkPerformance(goal.category);
            const userPerformance = progress.currentValue;
            const percentile = this.calculatePercentile(userPerformance, benchmarkPerformance);
            const gap = goal.targetValue - userPerformance;
            const improvementPotential = Math.max(0, goal.targetValue - benchmarkPerformance);

            return {
                goalId,
                category: goal.category,
                userPerformance,
                benchmarkPerformance,
                percentile,
                gap,
                gapAnalysis: this.analyzeGap(gap, goal.targetValue),
                improvementPotential
            };
        } catch (error) {
            logger.error('Error comparing with benchmarks', {
                userId,
                goalId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Generate AI-powered goal insights
     */
    private async generateAIGoalInsights(goal: any, progress: any, analyticsData: any): Promise<string> {
        try {
            const tradingData = {
                hasData: true,
                totalTrades: analyticsData.analytics.totalTrades,
                totalNetProfitLoss: analyticsData.analytics.totalNetProfitLoss,
                winRate: analyticsData.analytics.winRate,
                avgProfitLoss: analyticsData.analytics.avgProfitLossPerTrade
            };

            const aiResponse = await generateGoalInsights(tradingData, [goal]);

            return aiResponse;
        } catch (error) {
            logger.error('Error generating AI goal insights', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return '';
        }
    }

    /**
     * Calculate achievement probability
     */
    private calculateAchievementProbability(goal: any, progress: any): number {
        const timeRemaining = goal.targetDate ?
            (goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) : 30;

        const progressRate = progress.progress / Math.max(1, (Date.now() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const requiredRate = (100 - progress.progress) / Math.max(1, timeRemaining);

        if (progressRate >= requiredRate) {
            return Math.min(100, 80 + (progressRate - requiredRate) * 20);
        } else {
            return Math.max(0, 50 - (requiredRate - progressRate) * 30);
        }
    }

    /**
     * Generate achievement steps
     */
    private generateAchievementSteps(goal: any, progress: any, probability: number): string[] {
        const steps: string[] = [];

        if (probability < 30) {
            steps.push('Review and adjust your goal target to be more realistic');
            steps.push('Focus on building consistent trading habits first');
            steps.push('Consider extending the timeline for this goal');
        } else if (probability < 60) {
            steps.push('Increase your trading frequency or position sizes');
            steps.push('Focus on improving your win rate through better analysis');
            steps.push('Implement stricter risk management rules');
        } else {
            steps.push('Maintain your current approach and consistency');
            steps.push('Focus on small incremental improvements');
            steps.push('Monitor progress weekly and adjust as needed');
        }

        return steps;
    }

    /**
     * Generate optimization suggestions
     */
    private generateOptimizationSuggestions(goal: any, progress: any, analyticsData: any): GoalOptimizationSuggestion[] {
        const suggestions: GoalOptimizationSuggestion[] = [];

        // Target adjustment suggestion
        if (progress.progress < 30 && progress.trend === 'declining') {
            suggestions.push({
                goalId: goal.id,
                suggestionType: 'target_adjustment',
                title: 'Consider Adjusting Target',
                description: 'Your progress is below expectations. Consider adjusting the target to be more achievable.',
                reasoning: `Current progress: ${progress.progress.toFixed(1)}%. Target may be too ambitious.`,
                expectedOutcome: 'More realistic goal with higher achievement probability',
                implementationSteps: [
                    'Review your current performance baseline',
                    'Set a more conservative target',
                    'Focus on consistent progress rather than aggressive targets'
                ],
                priority: 'high'
            });
        }

        // Strategy change suggestion
        if (goal.category === 'profit_target' && analyticsData.analytics.winRate < 50) {
            suggestions.push({
                goalId: goal.id,
                suggestionType: 'strategy_change',
                title: 'Improve Trade Selection',
                description: 'Focus on improving your win rate before targeting higher profits.',
                reasoning: `Current win rate: ${analyticsData.analytics.winRate.toFixed(1)}%. Higher win rate will improve profit potential.`,
                expectedOutcome: 'Better win rate leading to more consistent profits',
                implementationSteps: [
                    'Analyze your losing trades for patterns',
                    'Implement stricter entry criteria',
                    'Focus on quality over quantity in trade selection'
                ],
                priority: 'medium'
            });
        }

        // Timeline modification suggestion
        if (goal.targetDate && progress.estimatedCompletion &&
            progress.estimatedCompletion > goal.targetDate) {
            suggestions.push({
                goalId: goal.id,
                suggestionType: 'timeline_modification',
                title: 'Extend Timeline',
                description: 'Consider extending the goal timeline to make it more achievable.',
                reasoning: `Estimated completion: ${progress.estimatedCompletion.toLocaleDateString()}. Target date: ${goal.targetDate.toLocaleDateString()}`,
                expectedOutcome: 'More realistic timeline with higher success probability',
                implementationSteps: [
                    'Review your current progress rate',
                    'Set a new realistic target date',
                    'Break down the goal into smaller milestones'
                ],
                priority: 'medium'
            });
        }

        return suggestions;
    }

    /**
     * Analyze milestones
     */
    private analyzeMilestones(_progress: any): Array<{
        milestone: number;
        description: string;
        actionableSteps: string[];
        expectedImpact: string;
    }> {
        const milestoneInsights = [];

        progress.milestones.forEach((milestone: any) => {
            if (milestone.achieved) {
                milestoneInsights.push({
                    milestone: milestone.milestone,
                    description: `Great progress! You've achieved ${milestone.milestone}% of your goal.`,
                    actionableSteps: [
                        'Maintain your current approach',
                        'Focus on the next milestone',
                        'Celebrate this achievement'
                    ],
                    expectedImpact: 'Continued progress toward goal completion'
                });
            } else {
                milestoneInsights.push({
                    milestone: milestone.milestone,
                    description: `Working toward ${milestone.milestone}% milestone. Current progress: ${progress.progress.toFixed(1)}%`,
                    actionableSteps: [
                        'Review your approach and identify improvements',
                        'Set smaller sub-goals to reach this milestone',
                        'Track daily progress toward this milestone'
                    ],
                    expectedImpact: 'Achieving this milestone will boost motivation and progress'
                });
            }
        });

        return milestoneInsights;
    }

    /**
     * Calculate trend analysis
     */
    private calculateTrendAnalysis(goal: any, progress: any): {
        direction: 'improving' | 'declining' | 'stable';
        velocity: number;
        acceleration: number;
    } {
        const daysSinceStart = Math.max(1, (Date.now() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const velocity = progress.progress / daysSinceStart;

        // Simplified acceleration calculation
        const acceleration = velocity > 2 ? 1 : velocity < 0.5 ? -1 : 0;

        return {
            direction: progress.trend,
            velocity,
            acceleration
        };
    }

    /**
     * Identify key factors
     */
    private identifyKeyFactors(goal: any, progress: any, analyticsData: any): string[] {
        const factors: string[] = [];

        if (goal.category === 'profit_target') {
            factors.push(`Current monthly profit: ₹${analyticsData.analytics.totalNetProfitLoss?.toLocaleString('en-IN') || 0}`);
            factors.push(`Win rate: ${analyticsData.analytics.winRate?.toFixed(1) || 0}%`);
            factors.push(`Average profit per trade: ₹${analyticsData.analytics.avgProfitLossPerTrade?.toLocaleString('en-IN') || 0}`);
        } else if (goal.category === 'win_rate') {
            factors.push(`Current win rate: ${analyticsData.analytics.winRate?.toFixed(1) || 0}%`);
            factors.push(`Total trades: ${analyticsData.analytics.totalTrades || 0}`);
        }

        return factors;
    }

    /**
     * Identify obstacles
     */
    private identifyObstacles(goal: any, progress: any, analyticsData: any): string[] {
        const obstacles: string[] = [];

        if (progress.progress < 50) {
            obstacles.push('Progress is slower than expected');
        }

        if (goal.category === 'profit_target' && analyticsData.analytics.winRate < 50) {
            obstacles.push('Low win rate affecting profit potential');
        }

        if (progress.trend === 'declining') {
            obstacles.push('Performance trend is declining');
        }

        return obstacles;
    }

    /**
     * Identify opportunities
     */
    private identifyOpportunities(goal: any, progress: any, analyticsData: any): string[] {
        const opportunities: string[] = [];

        if (progress.trend === 'improving') {
            opportunities.push('Positive momentum in progress');
        }

        // if (analyticsData.analytics.winRate > 60) {
        //     opportunities.push('Strong win rate provides good foundation');
        // }

        if (goal.targetDate && progress.estimatedCompletion &&
            progress.estimatedCompletion <= goal.targetDate) {
            opportunities.push('On track to meet target date');
        }

        return opportunities;
    }

    /**
     * Generate recommendations
     */
    private generateRecommendations(goal: any, progress: any, analyticsData: any): string[] {
        const recommendations: string[] = [];

        if (progress.progress < 30) {
            recommendations.push('Focus on building consistent trading habits');
            recommendations.push('Review and potentially adjust your goal target');
        } else if (progress.progress < 70) {
            recommendations.push('Maintain current approach and focus on incremental improvements');
            recommendations.push('Monitor progress weekly and adjust strategies as needed');
        } else {
            recommendations.push('Stay focused on the final stretch toward your goal');
            recommendations.push('Consider setting stretch goals once this goal is achieved');
        }

        return recommendations;
    }

    /**
     * Calculate benchmark performance
     */
    private calculateBenchmarkPerformance(category: string): number {
        switch (category) {
            case 'profit_target':
                return 5000; // ₹5000 monthly profit benchmark
            case 'win_rate':
                return 60; // 60% win rate benchmark
            case 'risk_management':
                return 10; // 10% max drawdown benchmark
            case 'consistency':
                return 50; // 50 trades per month benchmark
            default:
                return 0;
        }
    }

    /**
     * Calculate percentile
     */
    private calculatePercentile(userPerformance: number, benchmarkPerformance: number): number {
        return Math.min(100, Math.max(0, (userPerformance / benchmarkPerformance) * 100));
    }

    /**
     * Analyze gap
     */
    private analyzeGap(gap: number, targetValue: number): string {
        const gapPercentage = (gap / targetValue) * 100;

        if (gapPercentage <= 10) {
            return 'Very close to target';
        } else if (gapPercentage <= 25) {
            return 'Moderate gap to target';
        } else if (gapPercentage <= 50) {
            return 'Significant gap to target';
        } else {
            return 'Large gap to target - consider adjusting goal';
        }
    }
}

export const goalInsightsService = new GoalInsightsService(); 