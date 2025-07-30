import { NextRequest, NextResponse } from "next/server";
import { featureAccessService } from "@/lib/services/feature-access-service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        // Get all premium features
        const premiumFeatures = featureAccessService.getPremiumFeatures();

        logger.info("Premium features list retrieved", {
            featuresCount: premiumFeatures.length
        });

        return NextResponse.json({
            features: premiumFeatures,
            totalCount: premiumFeatures.length
        });

    } catch (error) {
        logger.error("Error getting premium features list", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Failed to get premium features list" },
            { status: 500 }
        );
    }
} 