import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { analyticsService } from '@/lib/services/analytics-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '1y';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Use analytics service for optimized processing
    const analyticsData = await analyticsService.getUserAnalytics(userId, {
      period,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });

    return NextResponse.json(analyticsData);

  } catch (error) {
    logger.error('Analytics API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: await auth().then(auth => auth.userId).catch(() => 'unknown')
    });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 