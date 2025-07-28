import { prisma } from '@/lib/prisma';
import { behavioralAnalysisService } from './behavioral-analysis-service';
import { generateBehavioralAnalysis } from '@/lib/gemini';
import { logger } from '@/lib/logger';

export interface BehavioralGoal {
    id: string;
    userId: string;
    category: 'emotional' | 'risk_taking' | 'consistency' | 'discipline';
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

export interface CoachingRecommendation {
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

export interface ProgressTracking {
    userId: string;
    category: string;
    metric: string;
    currentValue: number;
    targetValue: number;
    progress: number;
    trend: 'improving' | 'declining' | 'stable';
    lastUpdated: Date;
}

export interface BehavioralCoachingPlan {
    userId: string;
    goals: BehavioralGoal[];
    recommendations: CoachingRecommendation[];
    progressTracking: ProgressTracking[];
    overallProgress: number;
    nextSteps: string[];
    estimatedTimeline: string;
}

export class BehavioralCoachingService {
    /**
     * Generate personalized coaching plan for user
     */
    async generateCoachingPlan(userId: string): Promise<BehavioralCoachingPlan> {
        try {
            // Get behavioral analysis
            const analysis = await behavioralAnalysisService.analyzeUserBehavior(userId);

            // Generate goals based on analysis
            const goals = await this.generateBehavioralGoals(userId, analysis);

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
            logger.error('Error generating coaching plan', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Generate behavioral goals based on analysis
     */
    private async generateBehavioralGoals(userId: string, analysis: any): Promise<BehavioralGoal[]> {
        const goals: BehavioralGoal[] = [];
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Emotional control goals
        if (analysis.emotionalPatterns.length > 0) {
            const emotionalGoal: BehavioralGoal = {
                id: `goal_${Date.now()}_1`,
                userId: user.id,
                category: 'emotional',
                title: 'Improve Emotional Control',
                description: 'Reduce FOMO and revenge trading by 50%',
                targetValue: 0.5,
                currentValue: analysis.emotionalPatterns.length / analysis.patterns.length,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                isCompleted: false,
                progress: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            goals.push(emotionalGoal);
        }

        // Risk management goals
        if (analysis.riskTakingPatterns.length > 0) {
            const riskGoal: BehavioralGoal = {
                id: `goal_${Date.now()}_2`,
                userId: user.id,
                category: 'risk_taking',
                title: 'Improve Risk Management',
                description: 'Maintain consistent position sizing and stop-loss adherence',
                targetValue: 0.8,
                currentValue: 0.6, // Placeholder
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
                isCompleted: false,
                progress: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            goals.push(riskGoal);
        }

        // Consistency goals
        if (analysis.consistencyPatterns.length > 0) {
            const consistencyGoal: BehavioralGoal = {
                id: `goal_${Date.now()}_3`,
                userId: user.id,
                category: 'consistency',
                title: 'Improve Trading Consistency',
                description: 'Maintain consistent trading frequency and strategy adherence',
                targetValue: 0.7,
                currentValue: 0.5, // Placeholder
                deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
                isCompleted: false,
                progress: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            goals.push(consistencyGoal);
        }

        // Discipline goals
        if (analysis.disciplinePatterns.length > 0) {
            const disciplineGoal: BehavioralGoal = {
                id: `goal_${Date.now()}_4`,
                userId: user.id,
                category: 'discipline',
                title: 'Improve Trading Discipline',
                description: 'Follow trading rules and maintain emotional control',
                targetValue: 0.9,
                currentValue: 0.7, // Placeholder
                deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                isCompleted: false,
                progress: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            goals.push(disciplineGoal);
        }

        return goals;
    }

    /**
     * Generate personalized recommendations
     */
    private async generateRecommendations(userId: string, analysis: any): Promise<CoachingRecommendation[]> {
        const recommendations: CoachingRecommendation[] = [];

        // Emotional control recommendations
        if (analysis.emotionalPatterns.length > 0) {
            const emotionalRec: CoachingRecommendation = {
                id: `rec_${Date.now()}_1`,
                userId,
                category: 'emotional',
                title: 'Implement FOMO Management Strategy',
                description: 'Develop a systematic approach to avoid FOMO trading',
                priority: 'high',
                actionSteps: [
                    'Set strict entry criteria before each trade',
                    'Wait 15 minutes before entering any trade',
                    'Use a trading journal to track emotional triggers',
                    'Practice meditation before trading sessions'
                ],
                expectedOutcome: 'Reduce FOMO trades by 50% within 30 days',
                timeframe: '30 days',
                isImplemented: false,
                createdAt: new Date()
            };
            recommendations.push(emotionalRec);
        }

        // Risk management recommendations
        if (analysis.riskTakingPatterns.length > 0) {
            const riskRec: CoachingRecommendation = {
                id: `rec_${Date.now()}_2`,
                userId,
                category: 'risk_taking',
                title: 'Implement Position Sizing Rules',
                description: 'Establish strict position sizing guidelines',
                priority: 'critical',
                actionSteps: [
                    'Never risk more than 2% of account on single trade',
                    'Use fixed position sizes based on account size',
                    'Implement proper stop-loss orders',
                    'Diversify across multiple symbols'
                ],
                expectedOutcome: 'Improve risk-reward ratio and reduce drawdowns',
                timeframe: '45 days',
                isImplemented: false,
                createdAt: new Date()
            };
            recommendations.push(riskRec);
        }

        // Consistency recommendations
        if (analysis.consistencyPatterns.length > 0) {
            const consistencyRec: CoachingRecommendation = {
                id: `rec_${Date.now()}_3`,
                userId,
                category: 'consistency',
                title: 'Establish Trading Routine',
                description: 'Create a consistent trading schedule and routine',
                priority: 'high',
                actionSteps: [
                    'Set specific trading hours each day',
                    'Prepare trading plan the night before',
                    'Review trades at the end of each day',
                    'Maintain trading journal with detailed notes'
                ],
                expectedOutcome: 'Improve trading consistency and performance',
                timeframe: '60 days',
                isImplemented: false,
                createdAt: new Date()
            };
            recommendations.push(consistencyRec);
        }

        // Discipline recommendations
        if (analysis.disciplinePatterns.length > 0) {
            const disciplineRec: CoachingRecommendation = {
                id: `rec_${Date.now()}_4`,
                userId,
                category: 'discipline',
                title: 'Strengthen Trading Discipline',
                description: 'Develop strong discipline and rule-following habits',
                priority: 'critical',
                actionSteps: [
                    'Create a comprehensive trading plan',
                    'Stick to predefined entry and exit rules',
                    'Avoid emotional decision-making',
                    'Regular self-assessment and reflection'
                ],
                expectedOutcome: 'Improve rule adherence and emotional control',
                timeframe: '90 days',
                isImplemented: false,
                createdAt: new Date()
            };
            recommendations.push(disciplineRec);
        }

        return recommendations;
    }

    /**
     * Set up progress tracking metrics
     */
    private async setupProgressTracking(userId: string, analysis: any): Promise<ProgressTracking[]> {
        const tracking: ProgressTracking[] = [];

        // Emotional control tracking
        tracking.push({
            userId,
            category: 'emotional',
            metric: 'FOMO Trade Frequency',
            currentValue: analysis.emotionalPatterns.filter((p: any) => p.type === 'fomo').length,
            targetValue: 0,
            progress: 0,
            trend: 'stable',
            lastUpdated: new Date()
        });

        // Risk management tracking
        tracking.push({
            userId,
            category: 'risk_taking',
            metric: 'Position Size Consistency',
            currentValue: 0.6, // Placeholder
            targetValue: 0.8,
            progress: 75,
            trend: 'improving',
            lastUpdated: new Date()
        });

        // Consistency tracking
        tracking.push({
            userId,
            category: 'consistency',
            metric: 'Trading Frequency Consistency',
            currentValue: 0.5, // Placeholder
            targetValue: 0.7,
            progress: 71,
            trend: 'improving',
            lastUpdated: new Date()
        });

        // Discipline tracking
        tracking.push({
            userId,
            category: 'discipline',
            metric: 'Rule Adherence Rate',
            currentValue: 0.7, // Placeholder
            targetValue: 0.9,
            progress: 78,
            trend: 'improving',
            lastUpdated: new Date()
        });

        return tracking;
    }

    /**
     * Calculate overall progress
     */
    private calculateOverallProgress(tracking: ProgressTracking[]): number {
        if (tracking.length === 0) return 0;

        const totalProgress = tracking.reduce((sum, item) => sum + item.progress, 0);
        return totalProgress / tracking.length;
    }

    /**
     * Generate next steps
     */
    private generateNextSteps(analysis: any, goals: BehavioralGoal[], recommendations: CoachingRecommendation[]): string[] {
        const nextSteps: string[] = [];

        // Prioritize based on severity
        const criticalPatterns = analysis.patterns.filter((p: any) => p.severity === 'critical');
        const highPatterns = analysis.patterns.filter((p: any) => p.severity === 'high');

        if (criticalPatterns.length > 0) {
            nextSteps.push('Address critical behavioral patterns immediately');
            nextSteps.push('Implement strict risk management rules');
            nextSteps.push('Consider reducing trading frequency temporarily');
        }

        if (highPatterns.length > 0) {
            nextSteps.push('Focus on high-priority improvement areas');
            nextSteps.push('Start implementing coaching recommendations');
            nextSteps.push('Begin tracking progress on key metrics');
        }

        if (goals.length > 0) {
            nextSteps.push('Set up goal tracking and monitoring');
            nextSteps.push('Create daily/weekly review routine');
        }

        if (recommendations.length > 0) {
            nextSteps.push('Prioritize and implement top recommendations');
            nextSteps.push('Schedule regular progress reviews');
        }

        return nextSteps;
    }

    /**
     * Estimate improvement timeline
     */
    private estimateTimeline(analysis: any, goals: BehavioralGoal[]): string {
        const criticalCount = analysis.patterns.filter((p: any) => p.severity === 'critical').length;
        const highCount = analysis.patterns.filter((p: any) => p.severity === 'high').length;

        if (criticalCount > 2) {
            return '6-12 months for significant improvement';
        } else if (criticalCount > 0 || highCount > 3) {
            return '3-6 months for noticeable improvement';
        } else if (highCount > 0) {
            return '2-3 months for improvement';
        } else {
            return '1-2 months for refinement';
        }
    }

    /**
     * Save behavioral goal
     */
    async saveBehavioralGoal(userId: string, goal: Omit<BehavioralGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<BehavioralGoal> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // In a real implementation, this would save to database
            // For now, we'll return the goal with generated ID
            const savedGoal: BehavioralGoal = {
                ...goal,
                id: `goal_${Date.now()}`,
                userId: user.id,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            logger.info('Behavioral goal saved', {
                userId,
                goalId: savedGoal.id,
                category: savedGoal.category
            });

            return savedGoal;
        } catch (error) {
            logger.error('Error saving behavioral goal', {
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
            logger.info('Goal progress updated', {
                goalId,
                userId,
                progress
            });

            return true;
        } catch (error) {
            logger.error('Error updating goal progress', {
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
            logger.info('Recommendation marked as implemented', {
                recommendationId,
                userId
            });

            return true;
        } catch (error) {
            logger.error('Error marking recommendation as implemented', {
                recommendationId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Get user's coaching progress
     */
    async getUserCoachingProgress(userId: string): Promise<{
        goals: BehavioralGoal[];
        recommendations: CoachingRecommendation[];
        progressTracking: ProgressTracking[];
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
            logger.error('Error getting user coaching progress', {
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
     * Generate weekly coaching report
     */
    async generateWeeklyReport(userId: string): Promise<{
        summary: string;
        progress: Record<string, number>;
        recommendations: string[];
        nextWeekGoals: string[];
    }> {
        try {
            const coachingProgress = await this.getUserCoachingProgress(userId);

            const summary = `Weekly coaching report for ${userId}. Overall progress: ${coachingProgress.overallProgress.toFixed(1)}%`;

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
            logger.error('Error generating weekly report', {
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

export const behavioralCoachingService = new BehavioralCoachingService(); 