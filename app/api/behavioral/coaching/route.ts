import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { behavioralCoachingService } from '@/lib/services/behavioral-coaching-service';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get coaching progress
        const coachingProgress = await behavioralCoachingService.getUserCoachingProgress(userId);

        return NextResponse.json({
            success: true,
            ...coachingProgress
        });

    } catch (error) {
        logger.error('Error getting coaching progress', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { error: 'Failed to get coaching progress' },
            { status: 500 }
        );
    }
}

export async function POST() {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Generate new coaching plan
        const coachingPlan = await behavioralCoachingService.generateCoachingPlan(userId);

        return NextResponse.json({
            success: true,
            coachingPlan
        });

    } catch (error) {
        logger.error('Error generating coaching plan', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { error: 'Failed to generate coaching plan' },
            { status: 500 }
        );
    }
} 