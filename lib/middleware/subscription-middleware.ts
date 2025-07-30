import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient, SubscriptionStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

export interface SubscriptionValidationResult {
    isValid: boolean;
    hasAccess: boolean;
    subscription?: any;
    plan?: any;
    error?: string;
}

export interface FeatureAccessResult {
    hasAccess: boolean;
    featureName: string;
    subscriptionStatus?: string;
    planName?: string;
    error?: string;
}

export class SubscriptionMiddleware {
    /**
     * Validate subscription status for a user
     */
    async validateSubscription(userId: string): Promise<SubscriptionValidationResult> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: {
                    plan: true,
                    user: true
                }
            });

            if (!subscription) {
                return {
                    isValid: false,
                    hasAccess: false,
                    error: "No subscription found"
                };
            }

            // Check if subscription is active
            const isActive = subscription.status === SubscriptionStatus.ACTIVE;
            const isExpired = subscription.currentPeriodEnd
                ? subscription.currentPeriodEnd < new Date()
                : false;

            const hasAccess = isActive && !isExpired;

            return {
                isValid: true,
                hasAccess,
                subscription,
                plan: subscription.plan,
                error: hasAccess ? undefined : "Subscription is not active or has expired"
            };

        } catch (error) {
            logger.error("Error validating subscription", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });

            return {
                isValid: false,
                hasAccess: false,
                error: "Failed to validate subscription"
            };
        }
    }

    /**
     * Check if user has access to a specific feature
     */
    async checkFeatureAccess(userId: string, featureName: string): Promise<FeatureAccessResult> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: {
                    plan: true
                }
            });

            if (!subscription) {
                return {
                    hasAccess: false,
                    featureName,
                    error: "No subscription found"
                };
            }

            // Check if subscription is active
            const isActive = subscription.status === SubscriptionStatus.ACTIVE;
            const isExpired = subscription.currentPeriodEnd
                ? subscription.currentPeriodEnd < new Date()
                : false;

            if (!isActive || isExpired) {
                return {
                    hasAccess: false,
                    featureName,
                    subscriptionStatus: subscription.status,
                    planName: subscription.plan.name,
                    error: "Subscription is not active or has expired"
                };
            }

            // Check if feature is included in the plan
            const hasFeature = subscription.plan.features.includes(featureName);

            return {
                hasAccess: hasFeature,
                featureName,
                subscriptionStatus: subscription.status,
                planName: subscription.plan.name,
                error: hasFeature ? undefined : "Feature not included in current plan"
            };

        } catch (error) {
            logger.error("Error checking feature access", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                featureName
            });

            return {
                hasAccess: false,
                featureName,
                error: "Failed to check feature access"
            };
        }
    }

    /**
     * Middleware function for API routes that require subscription
     */
    async validateSubscriptionMiddleware(request: NextRequest): Promise<NextResponse | null> {
        try {
            const { userId } = await auth();

            if (!userId) {
                return NextResponse.json(
                    { error: "Authentication required" },
                    { status: 401 }
                );
            }

            const validation = await this.validateSubscription(userId);

            if (!validation.hasAccess) {
                return NextResponse.json(
                    {
                        error: "Subscription required",
                        details: validation.error,
                        subscription: validation.subscription ? {
                            status: validation.subscription.status,
                            planName: validation.subscription.plan?.name
                        } : null
                    },
                    { status: 403 }
                );
            }

            return null; // Continue to the next middleware/handler

        } catch (error) {
            logger.error("Error in subscription middleware", {
                error: error instanceof Error ? error.message : "Unknown error"
            });

            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            );
        }
    }

    /**
     * Middleware function for API routes that require specific feature access
     */
    async validateFeatureAccessMiddleware(featureName: string) {
        return async (request: NextRequest): Promise<NextResponse | null> => {
            try {
                const { userId } = await auth();

                if (!userId) {
                    return NextResponse.json(
                        { error: "Authentication required" },
                        { status: 401 }
                    );
                }

                const accessCheck = await this.checkFeatureAccess(userId, featureName);

                if (!accessCheck.hasAccess) {
                    return NextResponse.json(
                        {
                            error: "Feature access required",
                            details: accessCheck.error,
                            featureName,
                            subscriptionStatus: accessCheck.subscriptionStatus,
                            planName: accessCheck.planName
                        },
                        { status: 403 }
                    );
                }

                return null; // Continue to the next middleware/handler

            } catch (error) {
                logger.error("Error in feature access middleware", {
                    error: error instanceof Error ? error.message : "Unknown error",
                    featureName
                });

                return NextResponse.json(
                    { error: "Internal server error" },
                    { status: 500 }
                );
            }
        };
    }

    /**
     * Middleware function for premium API endpoints
     */
    async validatePremiumAccessMiddleware(request: NextRequest): Promise<NextResponse | null> {
        try {
            const { userId } = await auth();

            if (!userId) {
                return NextResponse.json(
                    { error: "Authentication required" },
                    { status: 401 }
                );
            }

            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: {
                    plan: true
                }
            });

            if (!subscription) {
                return NextResponse.json(
                    {
                        error: "Premium subscription required",
                        details: "No subscription found"
                    },
                    { status: 403 }
                );
            }

            // Check if subscription is active and not expired
            const isActive = subscription.status === SubscriptionStatus.ACTIVE;
            const isExpired = subscription.currentPeriodEnd
                ? subscription.currentPeriodEnd < new Date()
                : false;

            if (!isActive || isExpired) {
                return NextResponse.json(
                    {
                        error: "Premium subscription required",
                        details: "Subscription is not active or has expired",
                        subscription: {
                            status: subscription.status,
                            planName: subscription.plan.name,
                            currentPeriodEnd: subscription.currentPeriodEnd
                        }
                    },
                    { status: 403 }
                );
            }

            return null; // Continue to the next middleware/handler

        } catch (error) {
            logger.error("Error in premium access middleware", {
                error: error instanceof Error ? error.message : "Unknown error"
            });

            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            );
        }
    }

    /**
     * Get user's accessible features
     */
    async getAccessibleFeatures(userId: string): Promise<string[]> {
        try {
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
                include: {
                    plan: true
                }
            });

            if (!subscription) {
                return [];
            }

            // Check if subscription is active
            const isActive = subscription.status === SubscriptionStatus.ACTIVE;
            const isExpired = subscription.currentPeriodEnd
                ? subscription.currentPeriodEnd < new Date()
                : false;

            if (!isActive || isExpired) {
                return [];
            }

            return subscription.plan.features;

        } catch (error) {
            logger.error("Error getting accessible features", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });

            return [];
        }
    }

    /**
     * Log feature access attempt
     */
    async logFeatureAccess(userId: string, featureName: string, accessed: boolean): Promise<void> {
        try {
            // This would typically save to a feature access log table
            logger.info("Feature access attempt", {
                userId,
                featureName,
                accessed,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error("Error logging feature access", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                featureName
            });
        }
    }
}

// Export singleton instance
export const subscriptionMiddleware = new SubscriptionMiddleware(); 