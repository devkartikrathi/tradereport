import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { performanceGoalService } from '@/lib/services/performance-goal-service';
import { logger } from '@/lib/logger';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { title, description, category, targetValue, targetDate, isActive } = body;

        // Update goal
        const updatedGoal = await performanceGoalService.updateGoal(params.id, userId, {
            ...(title && { title }),
            ...(description !== undefined && { description }),
            ...(category && { category }),
            ...(targetValue !== undefined && { targetValue: parseFloat(targetValue) }),
            ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : undefined }),
            ...(isActive !== undefined && { isActive })
        });

        return NextResponse.json({
            success: true,
            goal: updatedGoal
        });

    } catch (error) {
        logger.error('Error updating performance goal', {
            goalId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { error: 'Failed to update performance goal' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete goal
        const success = await performanceGoalService.deleteGoal(params.id, userId);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to delete performance goal' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Performance goal deleted successfully'
        });

    } catch (error) {
        logger.error('Error deleting performance goal', {
            goalId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { error: 'Failed to delete performance goal' },
            { status: 500 }
        );
    }
} 