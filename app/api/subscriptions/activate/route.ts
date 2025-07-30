import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/lib/services/subscription-service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        const { userId, planId, paymentId } = await request.json();

        // Validate required fields
        if (!userId || !planId || !paymentId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Activate subscription
        const result = await subscriptionService.activateSubscription(userId, planId, paymentId);

        if (result.success) {
            logger.info("Subscription activated via API", {
                userId,
                planId,
                subscriptionId: result.subscription?.id
            });

            return NextResponse.json({
                success: true,
                subscription: result.subscription
            });
        } else {
            logger.error("Failed to activate subscription", {
                userId,
                planId,
                error: result.error
            });

            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

    } catch (error) {
        logger.error("Error activating subscription", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Failed to activate subscription" },
            { status: 500 }
        );
    }
} 