import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { monitoringService } from '@/lib/services/monitoring-service';
import { alertService } from '@/lib/services/alert-service';
import { notificationService } from '@/lib/services/notification-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const dataType = searchParams.get('type') || 'all'; // 'positions', 'trades', 'alerts', 'all'
        const includeAlerts = searchParams.get('alerts') === 'true';

        // Check if user has active broker connections
        const hasConnections = await monitoringService.hasActiveConnections(userId);
        if (!hasConnections) {
            return NextResponse.json({
                error: 'No active broker connections found',
                message: 'Please connect your Zerodha account to enable real-time monitoring'
            }, { status: 400 });
        }

        const response: {
            timestamp: string;
            marketHours: ReturnType<typeof monitoringService.isMarketOpen>;
            hasConnections: boolean;
            positions?: unknown[];
            trades?: unknown[];
            monitoringData?: unknown;
            validation?: {
                isValid: boolean;
                violations: string[];
                warnings: string[];
            };
            alerts?: unknown[];
            alertSummary?: unknown;
        } = {
            timestamp: new Date().toISOString(),
            marketHours: monitoringService.isMarketOpen(),
            hasConnections
        };

        // Get requested data types
        if (dataType === 'all' || dataType === 'positions') {
            response.positions = await monitoringService.getLivePositions(userId);
        }

        if (dataType === 'all' || dataType === 'trades') {
            response.trades = await monitoringService.getTodayTrades(userId);
        }

        if (dataType === 'all' || dataType === 'monitoring') {
            response.monitoringData = await monitoringService.getMonitoringData(userId);
        }

        if (dataType === 'all' || dataType === 'validation') {
            response.validation = await monitoringService.validateTradingActivity(userId);
        }

        // Include alerts if requested
        if (includeAlerts) {
            const [alerts, alertSummary] = await Promise.all([
                alertService.getUserAlerts(userId, { limit: 10, isRead: false }),
                alertService.getAlertSummary(userId)
            ]);

            response.alerts = alerts;
            response.alertSummary = alertSummary;
        }

        // Generate new alerts if there are violations
        if (response.validation && !response.validation.isValid) {
            const newAlerts = await alertService.generateAlerts(userId);

            // Send notifications for critical alerts
            for (const alert of newAlerts) {
                if (alert.severity === 'critical') {
                    await notificationService.sendNotification(userId, {
                        type: 'alert',
                        title: alert.title,
                        message: alert.message,
                        severity: alert.severity,
                        metadata: alert.metadata
                    });
                }
            }
        }

        logger.info('Live monitoring data retrieved', {
            userId,
            dataType,
            includeAlerts,
            positionsCount: response.positions?.length || 0,
            tradesCount: response.trades?.length || 0,
            alertsCount: response.alerts?.length || 0
        });

        return NextResponse.json(response);

    } catch (error) {
        logger.error('Error in live monitoring API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json({
            error: 'Failed to fetch live monitoring data',
            message: 'Please try again later'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action } = await request.json();

        switch (action) {
            case 'clear_cache':
                monitoringService.clearUserCache(userId);
                return NextResponse.json({ message: 'Cache cleared successfully' });

            case 'generate_alerts':
                const alerts = await alertService.generateAlerts(userId);
                return NextResponse.json({
                    message: 'Alerts generated successfully',
                    alertsCount: alerts.length
                });

            case 'test_notification':
                const { channel } = await request.json();
                const success = await notificationService.testNotification(userId, channel);
                return NextResponse.json({
                    message: success ? 'Test notification sent' : 'Failed to send test notification',
                    success
                });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        logger.error('Error in live monitoring POST API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json({
            error: 'Failed to process request',
            message: 'Please try again later'
        }, { status: 500 });
    }
} 