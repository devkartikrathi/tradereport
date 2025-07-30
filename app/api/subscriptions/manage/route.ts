import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { subscriptionService } from "@/lib/services/subscription-service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { action, planId } = await request.json();

        if (!action) {
            return NextResponse.json(
                { error: "Action is required" },
                { status: 400 }
            );
        }

        let result;

        switch (action) {
            case "cancel":
                result = await subscriptionService.cancelSubscription(userId);
                break;

            case "upgrade":
                if (!planId) {
                    return NextResponse.json(
                        { error: "Plan ID is required for upgrade" },
                        { status: 400 }
                    );
                }
                result = await subscriptionService.upgradeSubscription(userId, planId);
                break;

            case "downgrade":
                if (!planId) {
                    return NextResponse.json(
                        { error: "Plan ID is required for downgrade" },
                        { status: 400 }
                    );
                }
                result = await subscriptionService.downgradeSubscription(userId, planId);
                break;

            case "renew":
                result = await subscriptionService.renewSubscription(userId);
                break;

            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
        }

        if (result.success) {
            logger.info("Subscription management action completed", {
                userId,
                action,
                planId,
                subscriptionId: result.subscription?.id
            });

            return NextResponse.json({
                success: true,
                subscription: result.subscription,
                message: `Subscription ${action} successful`
            });
        } else {
            logger.error("Subscription management action failed", {
                userId,
                action,
                planId,
                error: result.error
            });

            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

    } catch (error) {
        logger.error("Error in subscription management", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Failed to manage subscription" },
            { status: 500 }
        );
    }
} 