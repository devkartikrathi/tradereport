import { NextRequest, NextResponse } from "next/server";
import { planManagementService } from "@/lib/services/plan-management-service";
import { logger } from "@/lib/logger";

/**
 * GET /api/plans - Get active plans for pricing page
 */
export async function GET(request: NextRequest) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get("includeInactive") === "true";

        // Get active plans by default, or all plans if includeInactive is true
        const options = {
            isActive: includeInactive ? undefined : true
        };

        const plans = await planManagementService.getPlans(options);

        return NextResponse.json({
            success: true,
            data: plans,
            count: plans.length
        });
    } catch (error) {
        logger.error("Error fetching public plans", { error: error instanceof Error ? error.message : "Unknown error" });
        return NextResponse.json(
            { error: "Failed to fetch plans" },
            { status: 500 }
        );
    }
} 