import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { goalInsightsService } from '@/lib/services/goal-insights-service';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get goal ID from query params
        const { searchParams } = new URL(request.url);
        const goalId = searchParams.get('goalId');

        if (!goalId) {
            return NextResponse.json(
                { error: 'Goal ID is required' },
                { status: 400 }
            );
        }

        // Get goal insights
        const insights = await goalInsightsService.generateGoalInsights(userId, goalId);

        return NextResponse.json({
            success: true,
            insights
        });

    } catch (error) {
        logger.error('Error getting goal insights', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { error: 'Failed to get goal insights' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { goalId } = body;

        if (!goalId) {
            return NextResponse.json(
                { error: 'Goal ID is required' },
                { status: 400 }
            );
        }

        // Analyze goal achievement
        const analysis = await goalInsightsService.analyzeGoalAchievement(goalId, userId);

        return NextResponse.json({
            success: true,
            analysis
        });

    } catch (error) {
        logger.error('Error analyzing goal achievement', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { error: 'Failed to analyze goal achievement' },
            { status: 500 }
        );
    }
} 