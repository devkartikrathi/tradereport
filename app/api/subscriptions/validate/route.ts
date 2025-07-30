import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { subscriptionMiddleware } from "@/lib/middleware/subscription-middleware";
import { featureAccessService } from "@/lib/services/feature-access-service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const featureName = searchParams.get("feature");

        if (featureName) {
            // Check access to specific feature
            const accessResult = await featureAccessService.checkFeatureAccess(userId, featureName);

            logger.info("Feature access check", {
                userId,
                featureName,
                hasAccess: accessResult.hasAccess
            });

            return NextResponse.json({
                hasAccess: accessResult.hasAccess,
                featureName: accessResult.featureName,
                subscriptionStatus: accessResult.subscriptionStatus,
                planName: accessResult.planName,
                error: accessResult.error,
                upgradeRequired: accessResult.upgradeRequired
            });
        } else {
            // Get general subscription status
            const validation = await subscriptionMiddleware.validateSubscription(userId);
            const accessibleFeatures = await featureAccessService.getAccessibleFeatures(userId);

            logger.info("Subscription validation", {
                userId,
                hasAccess: validation.hasAccess,
                accessibleFeaturesCount: accessibleFeatures.length
            });

            return NextResponse.json({
                isValid: validation.isValid,
                hasAccess: validation.hasAccess,
                subscription: validation.subscription ? {
                    status: validation.subscription.status,
                    planName: validation.subscription.plan?.name,
                    currentPeriodEnd: validation.subscription.currentPeriodEnd
                } : null,
                accessibleFeatures,
                error: validation.error
            });
        }

    } catch (error) {
        logger.error("Error in subscription validation API", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Failed to validate subscription" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { featureName } = body;

        if (!featureName) {
            return NextResponse.json(
                { error: "Feature name is required" },
                { status: 400 }
            );
        }

        // Check access to specific feature
        const accessResult = await featureAccessService.checkFeatureAccess(userId, featureName);

        logger.info("Feature access validation", {
            userId,
            featureName,
            hasAccess: accessResult.hasAccess
        });

        return NextResponse.json({
            hasAccess: accessResult.hasAccess,
            featureName: accessResult.featureName,
            subscriptionStatus: accessResult.subscriptionStatus,
            planName: accessResult.planName,
            error: accessResult.error,
            upgradeRequired: accessResult.upgradeRequired
        });

    } catch (error) {
        logger.error("Error in feature access validation API", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Failed to validate feature access" },
            { status: 500 }
        );
    }
} 