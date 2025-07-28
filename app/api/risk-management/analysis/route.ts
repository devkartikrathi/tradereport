import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { riskManagementService } from '@/lib/services/risk-management-service';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get risk assessments
        const assessments = await riskManagementService.getUserRiskAssessments(userId);

        return NextResponse.json({
            success: true,
            assessments
        });

    } catch (error) {
        logger.error('Error getting risk assessments', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { error: 'Failed to get risk assessments' },
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

        // Trigger risk analysis
        const analysis = await riskManagementService.analyzeUserRisk(userId);

        // Save assessment to database
        const savedAssessment = await riskManagementService.saveRiskAssessment(userId, {
            assessmentType: 'comprehensive',
            riskScore: analysis.overallRiskScore,
            recommendations: { recommendations: analysis.aiRecommendations },
            positionSizingAnalysis: analysis.metrics.positionSizing,
            riskRewardAnalysis: analysis.metrics.riskReward,
            stopLossStrategies: analysis.metrics.stopLoss
        });

        return NextResponse.json({
            success: true,
            analysis,
            assessment: savedAssessment
        });

    } catch (error) {
        logger.error('Error analyzing risk management', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { error: 'Failed to analyze risk management' },
            { status: 500 }
        );
    }
} 