import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

        // Get user's feature status
        const featureStatus = await featureAccessService.getUserFeatureStatus(userId);

        logger.info("Feature status retrieved", {
            userId,
            accessibleFeaturesCount: featureStatus.accessibleFeatures.length,
            hasActiveSubscription: featureStatus.hasActiveSubscription
        });

        return NextResponse.json({
            accessibleFeatures: featureStatus.accessibleFeatures,
            premiumFeatures: featureStatus.premiumFeatures,
            subscriptionStatus: featureStatus.subscriptionStatus,
            planName: featureStatus.planName,
            hasActiveSubscription: featureStatus.hasActiveSubscription
        });

    } catch (error) {
        logger.error("Error getting feature status", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Failed to get feature status" },
            { status: 500 }
        );
    }
} 