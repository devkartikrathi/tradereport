import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/lib/services/subscription-service";
import { logger } from "@/lib/logger";

export async function POST(
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

        // Renew subscription
        const result = await subscriptionService.renewSubscription(userId);

        if (result.success) {
            logger.info("Subscription renewed via API", {
                userId,
                subscriptionId: result.subscription?.id
            });

            return NextResponse.json({
                success: true,
                subscription: result.subscription
            });
        } else {
            logger.error("Failed to renew subscription", {
                userId,
                error: result.error
            });

            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

    } catch (error) {
        logger.error("Error renewing subscription", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: params.userId
        });

        return NextResponse.json(
            { error: "Failed to renew subscription" },
            { status: 500 }
        );
    }
} 