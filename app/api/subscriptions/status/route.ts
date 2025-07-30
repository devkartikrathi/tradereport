import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { subscriptionService } from "@/lib/services/subscription-service";
import { logger } from "@/lib/logger";

export async function GET() {
    try {
        // Get authenticated user
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get subscription status
        const subscription = await subscriptionService.getSubscriptionStatus(userId);

        if (!subscription) {
            return NextResponse.json({
                success: true,
                hasSubscription: false,
                subscription: null,
                isActive: false
            });
        }

        // Check if subscription is active
        const isActive = await subscriptionService.isSubscriptionActive(userId);

        // Get subscription features
        const features = await subscriptionService.getSubscriptionFeatures(userId);

        // Calculate days until renewal
        const daysUntilRenewal = subscription.currentPeriodEnd
            ? Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;

        // Get plan details
        const planDetails = await subscriptionService.getPlanDetails(subscription.planId);

        logger.info("Subscription status retrieved", {
            userId,
            subscriptionId: subscription.id,
            isActive,
            planName: planDetails?.name
        });

        return NextResponse.json({
            success: true,
            hasSubscription: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                planId: subscription.planId,
                plan: planDetails,
                features,
                daysUntilRenewal,
                isActive
            }
        });

    } catch (error) {
        logger.error("Error getting subscription status", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Failed to get subscription status" },
            { status: 500 }
        );
    }
} 