import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const severity = searchParams.get('severity')?.split(',') as ('low' | 'medium' | 'high' | 'critical')[] | undefined;
        const type = searchParams.get('type')?.split(',') as ('daily_limit' | 'risk_threshold' | 'position_alert' | 'market_alert' | 'connection_alert')[] | undefined;
        const isRead = searchParams.get('isRead') === 'true' ? true :
            searchParams.get('isRead') === 'false' ? false : undefined;
        const isAcknowledged = searchParams.get('isAcknowledged') === 'true' ? true :
            searchParams.get('isAcknowledged') === 'false' ? false : undefined;

        // Get alerts
        const alerts = await alertService.getUserAlerts(userId, {
            limit,
            offset,
            severity,
            type,
            isRead,
            isAcknowledged
        });

        // Get alert summary
        const alertSummary = await alertService.getAlertSummary(userId);

        logger.info('Alerts retrieved', {
            userId,
            alertsCount: alerts.length,
            limit,
            offset,
            severity,
            type
        });

        return NextResponse.json({
            alerts,
            alertSummary,
            pagination: {
                limit,
                offset,
                total: alertSummary.totalAlerts
            }
        });

    } catch (error) {
        logger.error('Error getting alerts', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json({
            error: 'Failed to fetch alerts',
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

        const { action, alertId, ...data } = await request.json();

        switch (action) {
            case 'acknowledge':
                if (!alertId) {
                    return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
                }

                const acknowledged = await alertService.acknowledgeAlert(alertId, userId);
                return NextResponse.json({
                    message: acknowledged ? 'Alert acknowledged' : 'Failed to acknowledge alert',
                    success: acknowledged
                });

            case 'mark_read':
                if (!alertId) {
                    return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
                }

                const marked = await alertService.markAlertAsRead(alertId, userId);
                return NextResponse.json({
                    message: marked ? 'Alert marked as read' : 'Failed to mark alert as read',
                    success: marked
                });

            case 'mark_all_read':
                const allMarked = await alertService.markAllAlertsAsRead(userId);
                return NextResponse.json({
                    message: allMarked ? 'All alerts marked as read' : 'Failed to mark alerts as read',
                    success: allMarked
                });

            case 'generate_alerts':
                const alerts = await alertService.generateAlerts(userId);
                return NextResponse.json({
                    message: 'Alerts generated successfully',
                    alertsCount: alerts.length
                });

            case 'test_notification':
                const { channel } = data;
                const success = await notificationService.testNotification(userId, channel);
                return NextResponse.json({
                    message: success ? 'Test notification sent' : 'Failed to send test notification',
                    success
                });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        logger.error('Error in alerts POST API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json({
            error: 'Failed to process request',
            message: 'Please try again later'
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const alertId = searchParams.get('alertId');

        if (!alertId) {
            return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
        }

        const deleted = await alertService.deleteAlert(alertId, userId);

        return NextResponse.json({
            message: deleted ? 'Alert deleted successfully' : 'Failed to delete alert',
            success: deleted
        });

    } catch (error) {
        logger.error('Error deleting alert', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json({
            error: 'Failed to delete alert',
            message: 'Please try again later'
        }, { status: 500 });
    }
} 