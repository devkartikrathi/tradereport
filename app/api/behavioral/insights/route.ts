import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { behavioralAnalysisService } from '@/lib/services/behavioral-analysis-service';
import { subscriptionMiddleware } from '@/lib/middleware/subscription-middleware';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate subscription for behavioral analysis feature
        const validation = await subscriptionMiddleware.validateSubscription(userId);
        if (!validation.hasAccess) {
            return NextResponse.json(
                {
                    error: 'Premium subscription required for behavioral analysis',
                    details: validation.error,
                    upgradeRequired: true
                },
                { status: 403 }
            );
        }

        // Get behavioral insights
        const insights = await behavioralAnalysisService.getUserBehavioralInsights(userId);

        return NextResponse.json({
            success: true,
            insights
        });

    } catch (error) {
        logger.error('Error getting behavioral insights', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { error: 'Failed to get behavioral insights' },
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

        // Validate subscription for behavioral analysis feature
        const validation = await subscriptionMiddleware.validateSubscription(userId);
        if (!validation.hasAccess) {
            return NextResponse.json(
                {
                    error: 'Premium subscription required for behavioral analysis',
                    details: validation.error,
                    upgradeRequired: true
                },
                { status: 403 }
            );
        }

        // Trigger behavioral analysis
        const analysis = await behavioralAnalysisService.analyzeUserBehavior(userId);

        // Save insights to database
        const savedInsights = [];
        for (const pattern of analysis.patterns) {
            const insight = await behavioralAnalysisService.saveBehavioralInsight(userId, {
                patternType: pattern.type,
                severity: pattern.severity,
                title: pattern.title,
                description: pattern.description,
                evidence: pattern.evidence,
                recommendations: { recommendations: analysis.recommendations },
                isAcknowledged: false
            });
            savedInsights.push(insight);
        }

        return NextResponse.json({
            success: true,
            analysis,
            insights: savedInsights
        });

    } catch (error) {
        logger.error('Error analyzing behavioral patterns', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { error: 'Failed to analyze behavioral patterns' },
            { status: 500 }
        );
    }
} 