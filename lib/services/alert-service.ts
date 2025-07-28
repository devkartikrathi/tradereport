import { prisma } from '@/lib/prisma';
import { monitoringService } from './monitoring-service';
import { logger } from '@/lib/logger';

export interface Alert {
    id: string;
    userId: string;
    type: 'daily_limit' | 'risk_threshold' | 'position_alert' | 'market_alert' | 'connection_alert';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    isRead: boolean;
    isAcknowledged: boolean;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

export interface AlertRule {
    id: string;
    userId: string;
    type: string;
    condition: string;
    threshold: number;
    isActive: boolean;
    createdAt: Date;
}

export interface AlertSummary {
    totalAlerts: number;
    unreadAlerts: number;
    criticalAlerts: number;
    highAlerts: number;
    mediumAlerts: number;
    lowAlerts: number;
}

export class AlertService {
    /**
     * Generate alerts based on current trading activity
     */
    async generateAlerts(userId: string): Promise<Alert[]> {
        try {
            const [monitoringData, validation] = await Promise.all([
                monitoringService.getMonitoringData(userId),
                monitoringService.validateTradingActivity(userId)
            ]);

            const alerts: Alert[] = [];

            // Generate alerts for violations
            for (const violation of validation.violations) {
                alerts.push(await this.createAlert(userId, {
                    type: 'risk_threshold',
                    severity: 'critical',
                    title: 'Trading Rule Violation',
                    message: violation,
                    metadata: {
                        dailyPnL: monitoringData.dailyPnL,
                        dailyTradesCount: monitoringData.dailyTradesCount,
                        totalExposure: monitoringData.totalExposure
                    }
                }));
            }

            // Generate alerts for warnings
            for (const warning of validation.warnings) {
                alerts.push(await this.createAlert(userId, {
                    type: 'risk_threshold',
                    severity: 'high',
                    title: 'Trading Rule Warning',
                    message: warning,
                    metadata: {
                        dailyPnL: monitoringData.dailyPnL,
                        dailyTradesCount: monitoringData.dailyTradesCount,
                        totalExposure: monitoringData.totalExposure
                    }
                }));
            }

            // Generate position alerts
            const positionAlerts = await this.generatePositionAlerts(userId, monitoringData);
            alerts.push(...positionAlerts);

            // Generate market alerts
            const marketAlerts = await this.generateMarketAlerts(userId);
            alerts.push(...marketAlerts);

            logger.info('Generated alerts for user', {
                userId,
                totalAlerts: alerts.length,
                violations: validation.violations.length,
                warnings: validation.warnings.length
            });

            return alerts;
        } catch (error) {
            logger.error('Error generating alerts', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Generate position-specific alerts
     */
    private async generatePositionAlerts(userId: string, monitoringData: any): Promise<Alert[]> {
        const alerts: Alert[] = [];

        for (const position of monitoringData.positions) {
            // Large position alert
            if (Math.abs(position.value) > 100000) { // ₹1 lakh
                alerts.push(await this.createAlert(userId, {
                    type: 'position_alert',
                    severity: 'high',
                    title: 'Large Position Detected',
                    message: `Large position in ${position.tradingsymbol}: ₹${position.value.toLocaleString('en-IN')}`,
                    metadata: {
                        symbol: position.tradingsymbol,
                        value: position.value,
                        quantity: position.quantity
                    }
                }));
            }

            // High loss position alert
            if (position.pnl < -5000) { // ₹5k loss
                alerts.push(await this.createAlert(userId, {
                    type: 'position_alert',
                    severity: 'critical',
                    title: 'High Loss Position',
                    message: `High loss in ${position.tradingsymbol}: ₹${Math.abs(position.pnl).toLocaleString('en-IN')}`,
                    metadata: {
                        symbol: position.tradingsymbol,
                        pnl: position.pnl,
                        quantity: position.quantity
                    }
                }));
            }

            // High profit position alert
            if (position.pnl > 10000) { // ₹10k profit
                alerts.push(await this.createAlert(userId, {
                    type: 'position_alert',
                    severity: 'medium',
                    title: 'High Profit Position',
                    message: `High profit in ${position.tradingsymbol}: ₹${position.pnl.toLocaleString('en-IN')}`,
                    metadata: {
                        symbol: position.tradingsymbol,
                        pnl: position.pnl,
                        quantity: position.quantity
                    }
                }));
            }
        }

        return alerts;
    }

    /**
     * Generate market-related alerts
     */
    private async generateMarketAlerts(userId: string): Promise<Alert[]> {
        const alerts: Alert[] = [];
        const marketHours = monitoringService.isMarketOpen();

        // Market closed alert
        if (!marketHours.isMarketOpen) {
            alerts.push(await this.createAlert(userId, {
                type: 'market_alert',
                severity: 'low',
                title: 'Market Closed',
                message: 'Market is currently closed. Next open time: ' +
                    (marketHours.nextOpenTime?.toLocaleString('en-IN') || 'Unknown'),
                metadata: {
                    isMarketOpen: false,
                    nextOpenTime: marketHours.nextOpenTime
                }
            }));
        }

        // Market closing soon alert (if market is open)
        if (marketHours.isMarketOpen && marketHours.nextCloseTime) {
            const timeToClose = marketHours.nextCloseTime.getTime() - marketHours.currentTime.getTime();
            const minutesToClose = Math.floor(timeToClose / (1000 * 60));

            if (minutesToClose <= 30) {
                alerts.push(await this.createAlert(userId, {
                    type: 'market_alert',
                    severity: 'medium',
                    title: 'Market Closing Soon',
                    message: `Market closes in ${minutesToClose} minutes`,
                    metadata: {
                        minutesToClose,
                        nextCloseTime: marketHours.nextCloseTime
                    }
                }));
            }
        }

        return alerts;
    }

    /**
     * Create a new alert
     */
    async createAlert(userId: string, alertData: {
        type: Alert['type'];
        severity: Alert['severity'];
        title: string;
        message: string;
        metadata?: Record<string, unknown>;
    }): Promise<Alert> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            const alert = await prisma.alert.create({
                data: {
                    userId: user.id,
                    type: alertData.type,
                    severity: alertData.severity,
                    title: alertData.title,
                    message: alertData.message,
                    metadata: alertData.metadata ? JSON.stringify(alertData.metadata) : null,
                    isRead: false,
                    isAcknowledged: false
                }
            });

            logger.info('Alert created', {
                userId,
                alertId: alert.id,
                type: alert.type,
                severity: alert.severity
            });

            return {
                id: alert.id,
                userId: alert.userId,
                type: alert.type as Alert['type'],
                severity: alert.severity as Alert['severity'],
                title: alert.title,
                message: alert.message,
                isRead: alert.isRead,
                isAcknowledged: alert.isAcknowledged,
                metadata: alert.metadata ? JSON.parse(alert.metadata as string) : undefined,
                createdAt: alert.createdAt
            };
        } catch (error) {
            logger.error('Error creating alert', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Get user's alerts
     */
    async getUserAlerts(userId: string, options?: {
        limit?: number;
        offset?: number;
        severity?: Alert['severity'][];
        type?: Alert['type'][];
        isRead?: boolean;
        isAcknowledged?: boolean;
    }): Promise<Alert[]> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                return [];
            }

            const whereClause: any = { userId: user.id };

            if (options?.severity) {
                whereClause.severity = { in: options.severity };
            }

            if (options?.type) {
                whereClause.type = { in: options.type };
            }

            if (options?.isRead !== undefined) {
                whereClause.isRead = options.isRead;
            }

            if (options?.isAcknowledged !== undefined) {
                whereClause.isAcknowledged = options.isAcknowledged;
            }

            const alerts = await prisma.alert.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: options?.limit || 50,
                skip: options?.offset || 0
            });

            return alerts.map(alert => ({
                id: alert.id,
                userId: alert.userId,
                type: alert.type as Alert['type'],
                severity: alert.severity as Alert['severity'],
                title: alert.title,
                message: alert.message,
                isRead: alert.isRead,
                isAcknowledged: alert.isAcknowledged,
                metadata: alert.metadata ? JSON.parse(alert.metadata as string) : undefined,
                createdAt: alert.createdAt
            }));
        } catch (error) {
            logger.error('Error getting user alerts', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Get alert summary for user
     */
    async getAlertSummary(userId: string): Promise<AlertSummary> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                return {
                    totalAlerts: 0,
                    unreadAlerts: 0,
                    criticalAlerts: 0,
                    highAlerts: 0,
                    mediumAlerts: 0,
                    lowAlerts: 0
                };
            }

            const [totalAlerts, unreadAlerts, criticalAlerts, highAlerts, mediumAlerts, lowAlerts] = await Promise.all([
                prisma.alert.count({ where: { userId: user.id } }),
                prisma.alert.count({ where: { userId: user.id, isRead: false } }),
                prisma.alert.count({ where: { userId: user.id, severity: 'critical' } }),
                prisma.alert.count({ where: { userId: user.id, severity: 'high' } }),
                prisma.alert.count({ where: { userId: user.id, severity: 'medium' } }),
                prisma.alert.count({ where: { userId: user.id, severity: 'low' } })
            ]);

            return {
                totalAlerts,
                unreadAlerts,
                criticalAlerts,
                highAlerts,
                mediumAlerts,
                lowAlerts
            };
        } catch (error) {
            logger.error('Error getting alert summary', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                totalAlerts: 0,
                unreadAlerts: 0,
                criticalAlerts: 0,
                highAlerts: 0,
                mediumAlerts: 0,
                lowAlerts: 0
            };
        }
    }

    /**
     * Mark alert as read
     */
    async markAlertAsRead(alertId: string, userId: string): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                return false;
            }

            await prisma.alert.update({
                where: {
                    id: alertId,
                    userId: user.id
                },
                data: {
                    isRead: true
                }
            });

            logger.info('Alert marked as read', { alertId, userId });
            return true;
        } catch (error) {
            logger.error('Error marking alert as read', {
                alertId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Acknowledge alert
     */
    async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                return false;
            }

            await prisma.alert.update({
                where: {
                    id: alertId,
                    userId: user.id
                },
                data: {
                    isAcknowledged: true,
                    isRead: true
                }
            });

            logger.info('Alert acknowledged', { alertId, userId });
            return true;
        } catch (error) {
            logger.error('Error acknowledging alert', {
                alertId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Delete alert
     */
    async deleteAlert(alertId: string, userId: string): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                return false;
            }

            await prisma.alert.delete({
                where: {
                    id: alertId,
                    userId: user.id
                }
            });

            logger.info('Alert deleted', { alertId, userId });
            return true;
        } catch (error) {
            logger.error('Error deleting alert', {
                alertId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Mark all alerts as read
     */
    async markAllAlertsAsRead(userId: string): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                return false;
            }

            await prisma.alert.updateMany({
                where: {
                    userId: user.id,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });

            logger.info('All alerts marked as read', { userId });
            return true;
        } catch (error) {
            logger.error('Error marking all alerts as read', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Delete old alerts (older than 30 days)
     */
    async cleanupOldAlerts(): Promise<number> {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const result = await prisma.alert.deleteMany({
                where: {
                    createdAt: {
                        lt: thirtyDaysAgo
                    }
                }
            });

            logger.info('Cleaned up old alerts', { deletedCount: result.count });
            return result.count;
        } catch (error) {
            logger.error('Error cleaning up old alerts', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return 0;
        }
    }
}

export const alertService = new AlertService(); 