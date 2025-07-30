import { PrismaClient, SubscriptionStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

export interface SubscriptionStatusData {
    isActive: boolean;
    daysUntilExpiry: number;
    daysUntilRenewal: number;
    isExpired: boolean;
    isPastDue: boolean;
    canRenew: boolean;
    canUpgrade: boolean;
    canDowngrade: boolean;
    canCancel: boolean;
}

export interface BillingHistorySummary {
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    averagePaymentAmount: number;
    lastPaymentDate: Date | null;
    nextPaymentDate: Date | null;
}

export interface SubscriptionPeriodData {
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    nextPeriodStart: Date;
    nextPeriodEnd: Date;
    billingCycle: string;
    daysInCurrentPeriod: number;
    daysRemaining: number;
}

export class SubscriptionStatusService {
    /**
     * Calculate comprehensive subscription status
     */
    async calculateSubscriptionStatus(userId: string): Promise<SubscriptionStatusData> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: { plan: true }
            });

            if (!subscription) {
                return {
                    isActive: false,
                    daysUntilExpiry: 0,
                    daysUntilRenewal: 0,
                    isExpired: false,
                    isPastDue: false,
                    canRenew: false,
                    canUpgrade: false,
                    canDowngrade: false,
                    canCancel: false
                };
            }

            const now = new Date();
            const currentPeriodEnd = subscription.currentPeriodEnd;
            const daysUntilExpiry = currentPeriodEnd
                ? Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            const isActive = subscription.status === SubscriptionStatus.ACTIVE;
            const isExpired = currentPeriodEnd ? currentPeriodEnd < now : false;
            const isPastDue = subscription.status === SubscriptionStatus.PAST_DUE;
            const canRenew = isActive && daysUntilExpiry <= 7;
            const canUpgrade = isActive && !isExpired;
            const canDowngrade = isActive && !isExpired;
            const canCancel = isActive;

            return {
                isActive,
                daysUntilExpiry,
                daysUntilRenewal: daysUntilExpiry,
                isExpired,
                isPastDue,
                canRenew,
                canUpgrade,
                canDowngrade,
                canCancel
            };

        } catch (error) {
            logger.error("Error calculating subscription status", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }

    /**
     * Get billing history summary
     */
    async getBillingHistorySummary(userId: string): Promise<BillingHistorySummary> {
        try {
            const payments = await prisma.payment.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" }
            });

            const totalPayments = payments.length;
            const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
            const successfulPayments = payments.filter(p => p.status === "SUCCEEDED").length;
            const failedPayments = payments.filter(p => p.status === "FAILED").length;
            const averagePaymentAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;
            const lastPaymentDate = payments.length > 0 ? payments[0].createdAt : null;

            // Calculate next payment date based on subscription
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: { plan: true }
            });

            let nextPaymentDate: Date | null = null;
            if (subscription?.currentPeriodEnd) {
                nextPaymentDate = new Date(subscription.currentPeriodEnd);
            }

            return {
                totalPayments,
                totalAmount,
                successfulPayments,
                failedPayments,
                averagePaymentAmount,
                lastPaymentDate,
                nextPaymentDate
            };

        } catch (error) {
            logger.error("Error getting billing history summary", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }

    /**
     * Calculate subscription period data
     */
    async calculateSubscriptionPeriod(userId: string): Promise<SubscriptionPeriodData | null> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: { plan: true }
            });

            if (!subscription || !subscription.currentPeriodEnd) {
                return null;
            }

            const now = new Date();
            const currentPeriodEnd = subscription.currentPeriodEnd;

            // Calculate current period start (assuming it's 30 days before end for monthly)
            const billingCycleDays = this.getBillingCycleDays(subscription.plan.billingCycle);
            const currentPeriodStart = new Date(currentPeriodEnd.getTime() - (billingCycleDays * 24 * 60 * 60 * 1000));

            // Calculate next period
            const nextPeriodStart = new Date(currentPeriodEnd);
            const nextPeriodEnd = new Date(nextPeriodStart.getTime() + (billingCycleDays * 24 * 60 * 60 * 1000));

            const daysInCurrentPeriod = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
            const daysRemaining = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            return {
                currentPeriodStart,
                currentPeriodEnd,
                nextPeriodStart,
                nextPeriodEnd,
                billingCycle: subscription.plan.billingCycle,
                daysInCurrentPeriod,
                daysRemaining
            };

        } catch (error) {
            logger.error("Error calculating subscription period", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }

    /**
     * Validate subscription status
     */
    async validateSubscriptionStatus(userId: string): Promise<{
        isValid: boolean;
        issues: string[];
        recommendations: string[];
    }> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: { plan: true }
            });

            const issues: string[] = [];
            const recommendations: string[] = [];

            if (!subscription) {
                return {
                    isValid: false,
                    issues: ["No subscription found"],
                    recommendations: ["Subscribe to a plan to access premium features"]
                };
            }

            const status = await this.calculateSubscriptionStatus(userId);

            if (status.isExpired) {
                issues.push("Subscription has expired");
                recommendations.push("Renew your subscription to continue access");
            }

            if (status.isPastDue) {
                issues.push("Payment is past due");
                recommendations.push("Update your payment method to avoid service interruption");
            }

            if (status.daysUntilExpiry <= 7 && status.daysUntilExpiry > 0) {
                issues.push("Subscription expires soon");
                recommendations.push("Consider renewing your subscription to avoid interruption");
            }

            if (status.daysUntilExpiry <= 0) {
                issues.push("Subscription has expired");
                recommendations.push("Renew your subscription to restore access");
            }

            // Check for payment issues
            const recentPayments = await prisma.payment.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 3
            });

            const failedPayments = recentPayments.filter(p => p.status === "FAILED");
            if (failedPayments.length > 0) {
                issues.push("Recent payment failures detected");
                recommendations.push("Update your payment method to ensure uninterrupted service");
            }

            return {
                isValid: issues.length === 0,
                issues,
                recommendations
            };

        } catch (error) {
            logger.error("Error validating subscription status", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }

    /**
     * Get subscription health metrics
     */
    async getSubscriptionHealthMetrics(userId: string): Promise<{
        overallHealth: "excellent" | "good" | "fair" | "poor";
        score: number;
        metrics: {
            paymentSuccessRate: number;
            daysUntilExpiry: number;
            planUtilization: number;
            featureUsage: number;
        };
    }> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: { plan: true }
            });

            if (!subscription) {
                return {
                    overallHealth: "poor",
                    score: 0,
                    metrics: {
                        paymentSuccessRate: 0,
                        daysUntilExpiry: 0,
                        planUtilization: 0,
                        featureUsage: 0
                    }
                };
            }

            // Calculate payment success rate
            const payments = await prisma.payment.findMany({
                where: { userId }
            });

            const totalPayments = payments.length;
            const successfulPayments = payments.filter(p => p.status === "SUCCEEDED").length;
            const paymentSuccessRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

            // Calculate days until expiry
            const now = new Date();
            const daysUntilExpiry = subscription.currentPeriodEnd
                ? Math.ceil((subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            // Calculate plan utilization (placeholder - would need feature usage tracking)
            const planUtilization = 75; // Mock value

            // Calculate feature usage (placeholder - would need feature tracking)
            const featureUsage = 60; // Mock value

            // Calculate overall health score
            const score = Math.round(
                (paymentSuccessRate * 0.3) +
                (Math.max(0, Math.min(100, (daysUntilExpiry / 30) * 100)) * 0.3) +
                (planUtilization * 0.2) +
                (featureUsage * 0.2)
            );

            let overallHealth: "excellent" | "good" | "fair" | "poor";
            if (score >= 90) overallHealth = "excellent";
            else if (score >= 75) overallHealth = "good";
            else if (score >= 50) overallHealth = "fair";
            else overallHealth = "poor";

            return {
                overallHealth,
                score,
                metrics: {
                    paymentSuccessRate,
                    daysUntilExpiry,
                    planUtilization,
                    featureUsage
                }
            };

        } catch (error) {
            logger.error("Error getting subscription health metrics", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }

    /**
     * Get billing cycle days
     */
    private getBillingCycleDays(billingCycle: string): number {
        switch (billingCycle.toLowerCase()) {
            case "monthly":
                return 30;
            case "quarterly":
                return 90;
            case "yearly":
                return 365;
            default:
                return 30;
        }
    }

    /**
     * Get subscription analytics
     */
    async getSubscriptionAnalytics(userId: string): Promise<{
        totalRevenue: number;
        averageMonthlySpend: number;
        subscriptionDuration: number;
        planChanges: number;
        renewalRate: number;
    }> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: { plan: true }
            });

            const payments = await prisma.payment.findMany({
                where: { userId }
            });

            const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
            const averageMonthlySpend = totalRevenue / Math.max(1, payments.length);

            // Calculate subscription duration
            const subscriptionDuration = subscription?.createdAt
                ? Math.ceil((new Date().getTime() - subscription.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            // Count plan changes (would need to track plan history)
            const planChanges = 0; // Placeholder

            // Calculate renewal rate
            const renewalRate = payments.length > 1 ? 100 : 0; // Simplified calculation

            return {
                totalRevenue,
                averageMonthlySpend,
                subscriptionDuration,
                planChanges,
                renewalRate
            };

        } catch (error) {
            logger.error("Error getting subscription analytics", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }
}

// Export singleton instance
export const subscriptionStatusService = new SubscriptionStatusService(); 