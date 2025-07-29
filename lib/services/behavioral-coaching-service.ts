import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

interface BehavioralAnalysis {
    emotionalPatterns: unknown[];
    riskTakingPatterns: unknown[];
    consistencyPatterns: unknown[];
    disciplinePatterns: unknown[];
    patterns: unknown[];
}

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
     * Generate a comprehensive behavioral coaching plan
     */
    async generateCoachingPlan(userId: string): Promise<BehavioralCoachingPlan> {
        try {
            // Get user's behavioral analysis
            const analysis: BehavioralAnalysis = {
                emotionalPatterns: [],
                riskTakingPatterns: [],
                consistencyPatterns: [],
                disciplinePatterns: [],
                patterns: []
            };

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
            const estimatedTimeline = this.estimateTimeline(goals);

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
            logger.error('Error generating coaching plan:', error);
            throw new Error('Failed to generate coaching plan');
        }
    }

    /**
     * Generate behavioral goals based on analysis
     */
    private async generateBehavioralGoals(userId: string, analysis: BehavioralAnalysis): Promise<BehavioralGoal[]> {
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
    private async generateRecommendations(userId: string, analysis: BehavioralAnalysis): Promise<CoachingRecommendation[]> {
        const recommendations: CoachingRecommendation[] = [];

        // Emotional control recommendations
        if (analysis.emotionalPatterns.length > 0) {
            const emotionalRec: CoachingRecommendation = {
                id: `rec_${Date.now()}_1`,
                userId,
                category: 'emotional',
                title: 'Practice Emotional Awareness',
                description: 'Track your emotional state before each trade',
                priority: 'high',
                actionSteps: [
                    'Keep an emotion journal',
                    'Take 5-minute breaks between trades',
                    'Practice deep breathing exercises'
                ],
                expectedOutcome: 'Reduced emotional trading decisions',
                timeframe: '2-4 weeks',
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
                description: 'Never risk more than 1-2% of your capital per trade',
                priority: 'critical',
                actionSteps: [
                    'Calculate position size before each trade',
                    'Set maximum daily loss limits',
                    'Use stop-loss orders consistently'
                ],
                expectedOutcome: 'Consistent risk management',
                timeframe: '1-2 weeks',
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
                title: 'Create a Trading Routine',
                description: 'Establish consistent trading hours and preparation',
                priority: 'medium',
                actionSteps: [
                    'Set specific trading hours',
                    'Prepare market analysis the night before',
                    'Review trades at the end of each day'
                ],
                expectedOutcome: 'More consistent trading performance',
                timeframe: '3-4 weeks',
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
                title: 'Follow Your Trading Plan',
                description: 'Stick to your predefined trading rules',
                priority: 'high',
                actionSteps: [
                    'Write down your trading rules',
                    'Review them before each trading session',
                    'Track rule violations'
                ],
                expectedOutcome: 'Improved trading discipline',
                timeframe: '2-3 weeks',
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
    private async setupProgressTracking(userId: string, analysis: BehavioralAnalysis): Promise<ProgressTracking[]> {
        const tracking: ProgressTracking[] = [];

        // Emotional control tracking
        if (analysis.emotionalPatterns.length > 0) {
            tracking.push({
                userId,
                category: 'emotional',
                metric: 'Emotional Trading Frequency',
                currentValue: analysis.emotionalPatterns.length,
                targetValue: 0,
                progress: 0,
                trend: 'stable',
                lastUpdated: new Date()
            });
        }

        // Risk management tracking
        if (analysis.riskTakingPatterns.length > 0) {
            tracking.push({
                userId,
                category: 'risk_taking',
                metric: 'Risk Management Score',
                currentValue: 0.6,
                targetValue: 0.8,
                progress: 75,
                trend: 'improving',
                lastUpdated: new Date()
            });
        }

        // Consistency tracking
        if (analysis.consistencyPatterns.length > 0) {
            tracking.push({
                userId,
                category: 'consistency',
                metric: 'Trading Consistency',
                currentValue: 0.5,
                targetValue: 0.7,
                progress: 71,
                trend: 'stable',
                lastUpdated: new Date()
            });
        }

        // Discipline tracking
        if (analysis.disciplinePatterns.length > 0) {
            tracking.push({
                userId,
                category: 'discipline',
                metric: 'Rule Adherence',
                currentValue: 0.7,
                targetValue: 0.9,
                progress: 78,
                trend: 'improving',
                lastUpdated: new Date()
            });
        }

        return tracking;
    }

    /**
     * Calculate overall progress across all metrics
     */
    private calculateOverallProgress(tracking: ProgressTracking[]): number {
        if (tracking.length === 0) return 0;

        const totalProgress = tracking.reduce((sum, metric) => sum + metric.progress, 0);
        return Math.round(totalProgress / tracking.length);
    }

    /**
     * Generate next steps based on current progress
     */
    private generateNextSteps(analysis: BehavioralAnalysis, goals: BehavioralGoal[], recommendations: CoachingRecommendation[]): string[] {
        const nextSteps: string[] = [];

        // Add immediate actions
        if (recommendations.length > 0) {
            nextSteps.push(`Implement: ${recommendations[0].title}`);
        }

        if (goals.length > 0) {
            nextSteps.push(`Focus on: ${goals[0].title}`);
        }

        // Add general improvements
        if (analysis.emotionalPatterns.length > 0) {
            nextSteps.push('Practice emotional awareness exercises daily');
        }

        if (analysis.riskTakingPatterns.length > 0) {
            nextSteps.push('Review and adjust position sizing rules');
        }

        return nextSteps;
    }

    /**
     * Estimate timeline for achieving goals
     */
    private estimateTimeline(goals: BehavioralGoal[]): string {
        if (goals.length === 0) return 'No specific timeline';

        const maxDays = Math.max(...goals.map(goal => {
            const daysUntilDeadline = Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return Math.max(daysUntilDeadline, 0);
        }));

        if (maxDays <= 30) return '1 month';
        if (maxDays <= 60) return '2 months';
        if (maxDays <= 90) return '3 months';
        return '3+ months';
    }

    /**
     * Save a behavioral goal to the database
     */
    async saveBehavioralGoal(userId: string, goal: Omit<BehavioralGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<BehavioralGoal> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            const savedGoal: BehavioralGoal = {
                ...goal,
                id: `goal_${Date.now()}`,
                userId: user.id,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // In a real implementation, save to database
            logger.info('Saving behavioral goal', { goalId: savedGoal.id, category: savedGoal.category });

            return savedGoal;
        } catch (error) {
            logger.error('Error saving behavioral goal:', error);
            throw new Error('Failed to save behavioral goal');
        }
    }

    /**
     * Update goal progress
     */
    async updateGoalProgress(goalId: string, _userId: string, progress: number): Promise<boolean> {
        try {
            // In a real implementation, update in database
            logger.info('Updating goal progress', { goalId, progress });

            return true;
        } catch (error) {
            logger.error('Error updating goal progress', { error: error instanceof Error ? error.message : 'Unknown error' });
            return false;
        }
    }

    /**
     * Mark a recommendation as implemented
     */
    async markRecommendationImplemented(recommendationId: string): Promise<boolean> {
        try {
            // In a real implementation, update in database
            logger.info('Marking recommendation as implemented', { recommendationId });

            return true;
        } catch (error) {
            logger.error('Error marking recommendation implemented:', error);
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
            // In a real implementation, fetch from database
            const goals: BehavioralGoal[] = [];
            const recommendations: CoachingRecommendation[] = [];
            const progressTracking: ProgressTracking[] = [];

            return {
                goals,
                recommendations,
                progressTracking,
                overallProgress: this.calculateOverallProgress(progressTracking)
            };
        } catch (error) {
            logger.error('Error getting user coaching progress:', error);
            throw new Error('Failed to get coaching progress');
        }
    }

    /**
     * Generate weekly progress report
     */
    async generateWeeklyReport(userId: string): Promise<{
        summary: string;
        progress: Record<string, number>;
        recommendations: string[];
        nextWeekGoals: string[];
    }> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            return {
                summary: 'Weekly progress report generated successfully',
                progress: {
                    emotional: 75,
                    risk_taking: 80,
                    consistency: 65,
                    discipline: 70
                },
                recommendations: [
                    'Continue practicing emotional awareness',
                    'Review position sizing rules',
                    'Maintain trading routine'
                ],
                nextWeekGoals: [
                    'Reduce emotional trading by 10%',
                    'Improve risk management score to 85%',
                    'Increase trading consistency'
                ]
            };
        } catch (error) {
            logger.error('Error generating weekly report:', error);
            throw new Error('Failed to generate weekly report');
        }
    }
}

export const behavioralCoachingService = new BehavioralCoachingService(); 