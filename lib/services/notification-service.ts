import { logger } from '@/lib/logger';

export interface NotificationPreferences {
    inAppNotifications: boolean;
    browserNotifications: boolean;
    emailNotifications: boolean;
    criticalAlertsOnly: boolean;
    quietHours: {
        enabled: boolean;
        startTime: string; // HH:MM format
        endTime: string; // HH:MM format
    };
}

export interface Notification {
    id: string;
    type: 'alert' | 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    isRead: boolean;
    metadata?: Record<string, unknown>;
}

export interface NotificationChannel {
    id: string;
    name: string;
    type: 'in_app' | 'browser' | 'email';
    isEnabled: boolean;
    settings?: Record<string, unknown>;
}

export class NotificationService {
    private defaultPreferences: NotificationPreferences = {
        inAppNotifications: true,
        browserNotifications: true,
        emailNotifications: false,
        criticalAlertsOnly: false,
        quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00'
        }
    };

    /**
     * Send notification through appropriate channels
     */
    async sendNotification(
        userId: string,
        notification: {
            type: Notification['type'];
            title: string;
            message: string;
            severity: Notification['severity'];
            metadata?: Record<string, unknown>;
        },
        preferences?: NotificationPreferences
    ): Promise<boolean> {
        try {
            const userPreferences = preferences || this.defaultPreferences;
            const isQuietHours = this.isQuietHours(userPreferences.quietHours);

            // Skip notifications during quiet hours unless critical
            if (isQuietHours && notification.severity !== 'critical') {
                logger.info('Skipping notification during quiet hours', {
                    userId,
                    notificationType: notification.type,
                    severity: notification.severity
                });
                return true;
            }

            // Skip non-critical notifications if user prefers critical only
            if (userPreferences.criticalAlertsOnly && notification.severity !== 'critical') {
                logger.info('Skipping non-critical notification', {
                    userId,
                    notificationType: notification.type,
                    severity: notification.severity
                });
                return true;
            }

            const promises: Promise<boolean>[] = [];

            // In-app notifications
            if (userPreferences.inAppNotifications) {
                promises.push(this.sendInAppNotification(userId, notification));
            }

            // Browser notifications
            if (userPreferences.browserNotifications) {
                promises.push(this.sendBrowserNotification(userId, notification));
            }

            // Email notifications
            if (userPreferences.emailNotifications) {
                promises.push(this.sendEmailNotification(userId, notification));
            }

            const results = await Promise.allSettled(promises);
            const successCount = results.filter(result =>
                result.status === 'fulfilled' && result.value === true
            ).length;

            logger.info('Notification sent', {
                userId,
                notificationType: notification.type,
                severity: notification.severity,
                channelsAttempted: promises.length,
                channelsSuccessful: successCount
            });

            return successCount > 0;
        } catch (error) {
            logger.error('Error sending notification', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Send in-app notification (toast)
     */
    private async sendInAppNotification(
        userId: string,
        notification: {
            type: Notification['type'];
            title: string;
            message: string;
            severity: Notification['severity'];
            metadata?: Record<string, unknown>;
        }
    ): Promise<boolean> {
        try {
            // In a real implementation, this would send to a WebSocket or SSE
            // For now, we'll just log it
            logger.info('In-app notification sent', {
                userId,
                title: notification.title,
                message: notification.message,
                severity: notification.severity
            });

            return true;
        } catch (error) {
            logger.error('Error sending in-app notification', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Send browser notification
     */
    private async sendBrowserNotification(
        userId: string,
        notification: {
            type: Notification['type'];
            title: string;
            message: string;
            severity: Notification['severity'];
            metadata?: Record<string, unknown>;
        }
    ): Promise<boolean> {
        try {
            // In a real implementation, this would use the Web Push API
            // For now, we'll just log it
            logger.info('Browser notification sent', {
                userId,
                title: notification.title,
                message: notification.message,
                severity: notification.severity
            });

            return true;
        } catch (error) {
            logger.error('Error sending browser notification', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Send email notification
     */
    private async sendEmailNotification(
        userId: string,
        notification: {
            type: Notification['type'];
            title: string;
            message: string;
            severity: Notification['severity'];
            metadata?: Record<string, unknown>;
        }
    ): Promise<boolean> {
        try {
            // In a real implementation, this would use an email service like SendGrid
            // For now, we'll just log it
            logger.info('Email notification sent', {
                userId,
                title: notification.title,
                message: notification.message,
                severity: notification.severity
            });

            return true;
        } catch (error) {
            logger.error('Error sending email notification', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Check if current time is within quiet hours
     */
    private isQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
        if (!quietHours.enabled) {
            return false;
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes

        const [startHour, startMinute] = quietHours.startTime.split(':').map(Number);
        const [endHour, endMinute] = quietHours.endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        // Handle quiet hours that span midnight
        if (startMinutes > endMinutes) {
            return currentTime >= startMinutes || currentTime <= endMinutes;
        } else {
            return currentTime >= startMinutes && currentTime <= endMinutes;
        }
    }

    /**
     * Get notification channels for a user
     */
    async getNotificationChannels(userId: string): Promise<NotificationChannel[]> {
        try {
            // In a real implementation, this would fetch from database
            // For now, return default channels
            return [
                {
                    id: 'in_app',
                    name: 'In-App Notifications',
                    type: 'in_app',
                    isEnabled: true,
                    settings: {
                        position: 'top-right',
                        duration: 5000
                    }
                },
                {
                    id: 'browser',
                    name: 'Browser Notifications',
                    type: 'browser',
                    isEnabled: true,
                    settings: {
                        requirePermission: true
                    }
                },
                {
                    id: 'email',
                    name: 'Email Notifications',
                    type: 'email',
                    isEnabled: false,
                    settings: {
                        emailAddress: ''
                    }
                }
            ];
        } catch (error) {
            logger.error('Error getting notification channels', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Update notification channel settings
     */
    async updateNotificationChannel(
        userId: string,
        channelId: string,
        settings: {
            isEnabled: boolean;
            settings?: Record<string, unknown>;
        }
    ): Promise<boolean> {
        try {
            // In a real implementation, this would update database
            logger.info('Notification channel updated', {
                userId,
                channelId,
                isEnabled: settings.isEnabled
            });

            return true;
        } catch (error) {
            logger.error('Error updating notification channel', {
                userId,
                channelId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Request browser notification permission
     */
    async requestBrowserNotificationPermission(): Promise<boolean> {
        try {
            // In a real implementation, this would use the Notification API
            // For now, we'll just log it
            logger.info('Browser notification permission requested');
            return true;
        } catch (error) {
            logger.error('Error requesting browser notification permission', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Check if browser notifications are supported
     */
    isBrowserNotificationSupported(): boolean {
        return typeof window !== 'undefined' && 'Notification' in window;
    }

    /**
     * Check if browser notification permission is granted
     */
    async getBrowserNotificationPermission(): Promise<NotificationPermission> {
        try {
            if (!this.isBrowserNotificationSupported()) {
                return 'denied';
            }

            return window.Notification.permission;
        } catch (error) {
            logger.error('Error getting browser notification permission', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return 'denied';
        }
    }

    /**
     * Create toast notification for immediate display
     */
    createToastNotification(notification: {
        type: Notification['type'];
        title: string;
        message: string;
        severity: Notification['severity'];
        duration?: number;
    }): {
        id: string;
        type: Notification['type'];
        title: string;
        message: string;
        severity: Notification['severity'];
        duration: number;
        timestamp: Date;
    } {
        return {
            id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            severity: notification.severity,
            duration: notification.duration || 5000,
            timestamp: new Date()
        };
    }

    /**
     * Get notification preferences for a user
     */
    async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
        try {
            // In a real implementation, this would fetch from database
            // For now, return default preferences
            return this.defaultPreferences;
        } catch (error) {
            logger.error('Error getting notification preferences', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return this.defaultPreferences;
        }
    }

    /**
     * Update notification preferences for a user
     */
    async updateNotificationPreferences(
        userId: string,
        preferences: Partial<NotificationPreferences>
    ): Promise<boolean> {
        try {
            // In a real implementation, this would update database
            logger.info('Notification preferences updated', {
                userId,
                preferences
            });

            return true;
        } catch (error) {
            logger.error('Error updating notification preferences', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Test notification system
     */
    async testNotification(userId: string, channel: 'in_app' | 'browser' | 'email'): Promise<boolean> {
        try {
            const testNotification = {
                type: 'info' as Notification['type'],
                title: 'Test Notification',
                message: 'This is a test notification to verify the system is working correctly.',
                severity: 'medium' as Notification['severity']
            };

            switch (channel) {
                case 'in_app':
                    return await this.sendInAppNotification(userId, testNotification);
                case 'browser':
                    return await this.sendBrowserNotification(userId, testNotification);
                case 'email':
                    return await this.sendEmailNotification(userId, testNotification);
                default:
                    return false;
            }
        } catch (error) {
            logger.error('Error testing notification', {
                userId,
                channel,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
}

export const notificationService = new NotificationService(); 