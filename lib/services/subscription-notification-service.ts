import { PrismaClient, Subscription, SubscriptionStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

export interface NotificationData {
    userId: string;
    type: "subscription_status" | "billing_reminder" | "expiration_warning" | "payment_success" | "payment_failure";
    title: string;
    message: string;
    priority: "low" | "medium" | "high" | "critical";
    metadata?: Record<string, any>;
}

export interface NotificationTemplate {
    title: string;
    message: string;
    priority: "low" | "medium" | "high" | "critical";
}

export class SubscriptionNotificationService {
    /**
     * Send subscription status change notification
     */
    async sendSubscriptionStatusNotification(
        userId: string,
        status: string,
        planName?: string
    ): Promise<void> {
        try {
            const template = this.getStatusChangeTemplate(status, planName);

            await this.createNotification({
                userId,
                type: "subscription_status",
                title: template.title,
                message: template.message,
                priority: template.priority,
                metadata: {
                    status,
                    planName,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info("Subscription status notification sent", {
                userId,
                status,
                planName
            });

        } catch (error) {
            logger.error("Error sending subscription status notification", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                status
            });
        }
    }

    /**
     * Send billing reminder notification
     */
    async sendBillingReminderNotification(
        userId: string,
        dueDate: Date,
        amount?: number
    ): Promise<void> {
        try {
            const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            const template = this.getBillingReminderTemplate(daysUntilDue, amount);

            await this.createNotification({
                userId,
                type: "billing_reminder",
                title: template.title,
                message: template.message,
                priority: template.priority,
                metadata: {
                    dueDate: dueDate.toISOString(),
                    daysUntilDue,
                    amount
                }
            });

            logger.info("Billing reminder notification sent", {
                userId,
                dueDate,
                daysUntilDue
            });

        } catch (error) {
            logger.error("Error sending billing reminder notification", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                dueDate
            });
        }
    }

    /**
     * Send subscription expiration warning
     */
    async sendSubscriptionExpirationWarning(
        userId: string,
        daysLeft: number
    ): Promise<void> {
        try {
            const template = this.getExpirationWarningTemplate(daysLeft);

            await this.createNotification({
                userId,
                type: "expiration_warning",
                title: template.title,
                message: template.message,
                priority: template.priority,
                metadata: {
                    daysLeft,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info("Subscription expiration warning sent", {
                userId,
                daysLeft
            });

        } catch (error) {
            logger.error("Error sending subscription expiration warning", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                daysLeft
            });
        }
    }

    /**
     * Send payment success notification
     */
    async sendPaymentSuccessNotification(
        userId: string,
        amount: number,
        planName: string
    ): Promise<void> {
        try {
            const template = this.getPaymentSuccessTemplate(amount, planName);

            await this.createNotification({
                userId,
                type: "payment_success",
                title: template.title,
                message: template.message,
                priority: template.priority,
                metadata: {
                    amount,
                    planName,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info("Payment success notification sent", {
                userId,
                amount,
                planName
            });

        } catch (error) {
            logger.error("Error sending payment success notification", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                amount
            });
        }
    }

    /**
     * Send payment failure notification
     */
    async sendPaymentFailureNotification(
        userId: string,
        amount: number,
        planName: string,
        reason?: string
    ): Promise<void> {
        try {
            const template = this.getPaymentFailureTemplate(amount, planName, reason);

            await this.createNotification({
                userId,
                type: "payment_failure",
                title: template.title,
                message: template.message,
                priority: template.priority,
                metadata: {
                    amount,
                    planName,
                    reason,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info("Payment failure notification sent", {
                userId,
                amount,
                planName,
                reason
            });

        } catch (error) {
            logger.error("Error sending payment failure notification", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                amount
            });
        }
    }

    /**
     * Get status change notification template
     */
    private getStatusChangeTemplate(status: string, planName?: string): NotificationTemplate {
        switch (status) {
            case "ACTIVE":
                return {
                    title: "Subscription Activated",
                    message: `Your subscription to ${planName || "Premium Plan"} has been successfully activated. You now have access to all premium features.`,
                    priority: "medium"
                };
            case "CANCELED":
                return {
                    title: "Subscription Canceled",
                    message: `Your subscription has been canceled. You'll continue to have access until the end of your current billing period.`,
                    priority: "high"
                };
            case "PAST_DUE":
                return {
                    title: "Payment Past Due",
                    message: "Your payment is past due. Please update your payment method to avoid service interruption.",
                    priority: "critical"
                };
            case "EXPIRED":
                return {
                    title: "Subscription Expired",
                    message: "Your subscription has expired. Renew now to restore access to premium features.",
                    priority: "critical"
                };
            default:
                return {
                    title: "Subscription Status Updated",
                    message: `Your subscription status has been updated to ${status}.`,
                    priority: "medium"
                };
        }
    }

    /**
     * Get billing reminder notification template
     */
    private getBillingReminderTemplate(daysUntilDue: number, amount?: number): NotificationTemplate {
        if (daysUntilDue <= 0) {
            return {
                title: "Payment Due Today",
                message: `Your payment of ₹${amount || "0"} is due today. Please complete your payment to avoid service interruption.`,
                priority: "critical"
            };
        } else if (daysUntilDue <= 3) {
            return {
                title: "Payment Due Soon",
                message: `Your payment of ₹${amount || "0"} is due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}. Please ensure your payment method is up to date.`,
                priority: "high"
            };
        } else if (daysUntilDue <= 7) {
            return {
                title: "Upcoming Payment",
                message: `Your payment of ₹${amount || "0"} will be due in ${daysUntilDue} days. Please verify your payment method is current.`,
                priority: "medium"
            };
        } else {
            return {
                title: "Payment Reminder",
                message: `Your payment of ₹${amount || "0"} will be due in ${daysUntilDue} days.`,
                priority: "low"
            };
        }
    }

    /**
     * Get expiration warning notification template
     */
    private getExpirationWarningTemplate(daysLeft: number): NotificationTemplate {
        if (daysLeft <= 1) {
            return {
                title: "Subscription Expires Tomorrow",
                message: "Your subscription expires tomorrow. Renew now to continue enjoying premium features without interruption.",
                priority: "critical"
            };
        } else if (daysLeft <= 3) {
            return {
                title: "Subscription Expires Soon",
                message: `Your subscription expires in ${daysLeft} days. Renew now to maintain uninterrupted access.`,
                priority: "high"
            };
        } else if (daysLeft <= 7) {
            return {
                title: "Subscription Expiration Warning",
                message: `Your subscription will expire in ${daysLeft} days. Consider renewing to avoid service interruption.`,
                priority: "medium"
            };
        } else {
            return {
                title: "Subscription Expiration Notice",
                message: `Your subscription will expire in ${daysLeft} days.`,
                priority: "low"
            };
        }
    }

    /**
     * Get payment success notification template
     */
    private getPaymentSuccessTemplate(amount: number, planName: string): NotificationTemplate {
        return {
            title: "Payment Successful",
            message: `Your payment of ₹${amount} for ${planName} has been processed successfully. Thank you for your subscription!`,
            priority: "medium"
        };
    }

    /**
     * Get payment failure notification template
     */
    private getPaymentFailureTemplate(amount: number, planName: string, reason?: string): NotificationTemplate {
        const reasonText = reason ? ` Reason: ${reason}` : "";
        return {
            title: "Payment Failed",
            message: `Your payment of ₹${amount} for ${planName} could not be processed.${reasonText} Please update your payment method and try again.`,
            priority: "high"
        };
    }

    /**
     * Create notification record
     */
    private async createNotification(notificationData: NotificationData): Promise<void> {
        try {
            // This would typically save to a notifications table
            // For now, we'll just log the notification
            logger.info("Notification created", {
                userId: notificationData.userId,
                type: notificationData.type,
                title: notificationData.title,
                priority: notificationData.priority
            });

            // In a real implementation, you would:
            // 1. Save to database
            // 2. Send email/SMS/push notification
            // 3. Update user notification preferences

        } catch (error) {
            logger.error("Error creating notification", {
                error: error instanceof Error ? error.message : "Unknown error",
                notificationData
            });
            throw error;
        }
    }

    /**
     * Get user notification preferences
     */
    async getUserNotificationPreferences(userId: string): Promise<{
        email: boolean;
        sms: boolean;
        push: boolean;
        billingReminders: boolean;
        statusUpdates: boolean;
        expirationWarnings: boolean;
    }> {
        try {
            // This would typically fetch from a user preferences table
            // For now, return default preferences
            return {
                email: true,
                sms: false,
                push: true,
                billingReminders: true,
                statusUpdates: true,
                expirationWarnings: true
            };
        } catch (error) {
            logger.error("Error getting user notification preferences", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }

    /**
     * Update user notification preferences
     */
    async updateUserNotificationPreferences(
        userId: string,
        preferences: {
            email?: boolean;
            sms?: boolean;
            push?: boolean;
            billingReminders?: boolean;
            statusUpdates?: boolean;
            expirationWarnings?: boolean;
        }
    ): Promise<void> {
        try {
            // This would typically update a user preferences table
            logger.info("User notification preferences updated", {
                userId,
                preferences
            });
        } catch (error) {
            logger.error("Error updating user notification preferences", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                preferences
            });
            throw error;
        }
    }

    /**
     * Get notification history for user
     */
    async getNotificationHistory(
        userId: string,
        limit: number = 50
    ): Promise<NotificationData[]> {
        try {
            // This would typically fetch from a notifications table
            // For now, return empty array
            return [];
        } catch (error) {
            logger.error("Error getting notification history", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationAsRead(notificationId: string): Promise<void> {
        try {
            // This would typically update a notifications table
            logger.info("Notification marked as read", {
                notificationId
            });
        } catch (error) {
            logger.error("Error marking notification as read", {
                error: error instanceof Error ? error.message : "Unknown error",
                notificationId
            });
            throw error;
        }
    }
}

// Export singleton instance
export const subscriptionNotificationService = new SubscriptionNotificationService(); 