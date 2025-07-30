import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/lib/services/subscription-service";
import { logger } from "@/lib/logger";

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const { userId } = params;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Get subscription status
        const subscription = await subscriptionService.getSubscriptionStatus(userId);

        if (!subscription) {
            return NextResponse.json({
                success: true,
                subscription: null,
                isActive: false
            });
        }

        // Check if subscription is active
        const isActive = await subscriptionService.isSubscriptionActive(userId);

        // Get subscription features
        const features = await subscriptionService.getSubscriptionFeatures(userId);

        return NextResponse.json({
            success: true,
            subscription,
            isActive,
            features
        });

    } catch (error) {
        logger.error("Error getting subscription status", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: params.userId
        });

        return NextResponse.json(
            { error: "Failed to get subscription status" },
            { status: 500 }
        );
    }
} 