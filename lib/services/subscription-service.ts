import { PrismaClient, Subscription, SubscriptionStatus, Plan } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

export interface CreateSubscriptionData {
    userId: string;
    planId: string;
    paymentId: string;
}

export interface SubscriptionResult {
    success: boolean;
    subscription?: Subscription;
    error?: string;
}

export class SubscriptionService {
    /**
     * Activate subscription
     */
    async activateSubscription(userId: string, planId: string, paymentId: string): Promise<SubscriptionResult> {
        try {
            // Get plan details
            const plan = await prisma.plan.findUnique({
                where: { id: planId }
            });

            if (!plan) {
                throw new Error("Plan not found");
            }

            // Calculate subscription period
            const currentPeriodEnd = this.calculateSubscriptionEnd(plan.billingCycle);

            // Create or update subscription
            const subscription = await prisma.subscription.upsert({
                where: { userId },
                update: {
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodEnd,
                    planId
                },
                create: {
                    userId,
                    planId,
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodEnd
                }
            });

            // Update payment with subscription ID
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    subscriptionId: subscription.id
                }
            });

            logger.info("Subscription activated", {
                userId,
                planId,
                subscriptionId: subscription.id,
                currentPeriodEnd
            });

            return {
                success: true,
                subscription
            };

        } catch (error) {
            logger.error("Error activating subscription", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                planId,
                paymentId
            });

            return {
                success: false,
                error: "Failed to activate subscription"
            };
        }
    }

    /**
     * Get subscription status
     */
    async getSubscriptionStatus(userId: string): Promise<Subscription | null> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: {
                    plan: true,
                    user: true
                }
            });

            return subscription;
        } catch (error) {
            logger.error("Error getting subscription status", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }

    /**
     * Renew subscription
     */
    async renewSubscription(userId: string): Promise<SubscriptionResult> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: { plan: true }
            });

            if (!subscription) {
                return {
                    success: false,
                    error: "Subscription not found"
                };
            }

            // Calculate new subscription period
            const newPeriodEnd = this.calculateSubscriptionEnd(subscription.plan.billingCycle);

            // Update subscription
            const updatedSubscription = await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    currentPeriodEnd: newPeriodEnd,
                    status: SubscriptionStatus.ACTIVE
                }
            });

            logger.info("Subscription renewed", {
                userId,
                subscriptionId: subscription.id,
                newPeriodEnd
            });

            return {
                success: true,
                subscription: updatedSubscription
            };

        } catch (error) {
            logger.error("Error renewing subscription", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });

            return {
                success: false,
                error: "Failed to renew subscription"
            };
        }
    }

    /**
 * Upgrade subscription
 */
    async upgradeSubscription(userId: string, newPlanId: string): Promise<SubscriptionResult> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: { plan: true }
            });

            if (!subscription) {
                return {
                    success: false,
                    error: "Subscription not found"
                };
            }

            // Get new plan
            const newPlan = await prisma.plan.findUnique({
                where: { id: newPlanId }
            });

            if (!newPlan) {
                return {
                    success: false,
                    error: "New plan not found"
                };
            }

            // Validate upgrade (new plan should be more expensive)
            if (newPlan.price <= subscription.plan.price) {
                return {
                    success: false,
                    error: "New plan must be more expensive than current plan"
                };
            }

            // Update subscription
            const updatedSubscription = await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    planId: newPlanId,
                    status: SubscriptionStatus.ACTIVE
                }
            });

            logger.info("Subscription upgraded", {
                userId,
                oldPlanId: subscription.planId,
                newPlanId,
                subscriptionId: subscription.id
            });

            return {
                success: true,
                subscription: updatedSubscription
            };

        } catch (error) {
            logger.error("Error upgrading subscription", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                newPlanId
            });

            return {
                success: false,
                error: "Failed to upgrade subscription"
            };
        }
    }

    /**
     * Downgrade subscription
     */
    async downgradeSubscription(userId: string, newPlanId: string): Promise<SubscriptionResult> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: { plan: true }
            });

            if (!subscription) {
                return {
                    success: false,
                    error: "Subscription not found"
                };
            }

            // Get new plan
            const newPlan = await prisma.plan.findUnique({
                where: { id: newPlanId }
            });

            if (!newPlan) {
                return {
                    success: false,
                    error: "New plan not found"
                };
            }

            // Validate downgrade (new plan should be less expensive)
            if (newPlan.price >= subscription.plan.price) {
                return {
                    success: false,
                    error: "New plan must be less expensive than current plan"
                };
            }

            // Update subscription
            const updatedSubscription = await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    planId: newPlanId,
                    status: SubscriptionStatus.ACTIVE
                }
            });

            logger.info("Subscription downgraded", {
                userId,
                oldPlanId: subscription.planId,
                newPlanId,
                subscriptionId: subscription.id
            });

            return {
                success: true,
                subscription: updatedSubscription
            };

        } catch (error) {
            logger.error("Error downgrading subscription", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                newPlanId
            });

            return {
                success: false,
                error: "Failed to downgrade subscription"
            };
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(userId: string): Promise<SubscriptionResult> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId }
            });

            if (!subscription) {
                return {
                    success: false,
                    error: "Subscription not found"
                };
            }

            // Update subscription status
            const updatedSubscription = await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: SubscriptionStatus.CANCELED
                }
            });

            logger.info("Subscription cancelled", {
                userId,
                subscriptionId: subscription.id
            });

            return {
                success: true,
                subscription: updatedSubscription
            };

        } catch (error) {
            logger.error("Error cancelling subscription", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });

            return {
                success: false,
                error: "Failed to cancel subscription"
            };
        }
    }

    /**
     * Check if subscription is active
     */
    async isSubscriptionActive(userId: string): Promise<boolean> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId }
            });

            if (!subscription) {
                return false;
            }

            // Check if subscription is active and not expired
            const now = new Date();
            const isActive = subscription.status === SubscriptionStatus.ACTIVE;
            const isNotExpired = subscription.currentPeriodEnd ? subscription.currentPeriodEnd > now : false;

            return isActive && isNotExpired;

        } catch (error) {
            logger.error("Error checking subscription status", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            return false;
        }
    }

    /**
     * Get subscription features
     */
    async getSubscriptionFeatures(userId: string): Promise<string[]> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: { plan: true }
            });

            if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
                return [];
            }

            return subscription.plan.features;

        } catch (error) {
            logger.error("Error getting subscription features", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            return [];
        }
    }

    /**
     * Calculate subscription end date
     */
    private calculateSubscriptionEnd(billingCycle: string): Date {
        const now = new Date();

        switch (billingCycle.toLowerCase()) {
            case "monthly":
                return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            case "quarterly":
                return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
            case "yearly":
                return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
            default:
                // Default to monthly
                return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        }
    }

    /**
 * Get plan details
 */
    async getPlanDetails(planId: string): Promise<Plan | null> {
        try {
            const plan = await prisma.plan.findUnique({
                where: { id: planId }
            });

            return plan;
        } catch (error) {
            logger.error("Error getting plan details", {
                error: error instanceof Error ? error.message : "Unknown error",
                planId
            });
            return null;
        }
    }

    /**
     * Get subscription statistics
     */
    async getSubscriptionStatistics(): Promise<{
        totalSubscriptions: number;
        activeSubscriptions: number;
        cancelledSubscriptions: number;
        totalRevenue: number;
    }> {
        try {
            const [
                totalSubscriptions,
                activeSubscriptions,
                cancelledSubscriptions,
                revenueData
            ] = await Promise.all([
                prisma.subscription.count(),
                prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
                prisma.subscription.count({ where: { status: SubscriptionStatus.CANCELED } }),
                prisma.payment.aggregate({
                    where: {
                        status: "SUCCEEDED",
                        subscription: { status: SubscriptionStatus.ACTIVE }
                    },
                    _sum: { amount: true }
                })
            ]);

            return {
                totalSubscriptions,
                activeSubscriptions,
                cancelledSubscriptions,
                totalRevenue: revenueData._sum.amount || 0
            };

        } catch (error) {
            logger.error("Error getting subscription statistics", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService(); 