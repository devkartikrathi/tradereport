import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { performanceGoalService } from '@/lib/services/performance-goal-service';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's performance goals
        const goals = await performanceGoalService.getUserGoals(userId);

        return NextResponse.json({
            success: true,
            goals
        });

    } catch (error) {
        logger.error('Error getting performance goals', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { error: 'Failed to get performance goals' },
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
        const { title, description, category, targetValue, targetDate, isActive } = body;

        // Validate required fields
        if (!title || !category || targetValue === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: title, category, targetValue' },
                { status: 400 }
            );
        }

        // Create goal
        const goal = await performanceGoalService.createGoal(userId, {
            title,
            description,
            category,
            targetValue: parseFloat(targetValue),
            startDate: new Date(),
            targetDate: targetDate ? new Date(targetDate) : undefined,
            isActive: isActive !== undefined ? isActive : true,
            insights: {}
        });

        return NextResponse.json({
            success: true,
            goal
        });

    } catch (error) {
        logger.error('Error creating performance goal', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { error: 'Failed to create performance goal' },
            { status: 500 }
        );
    }
} 