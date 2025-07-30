import { NextRequest, NextResponse } from "next/server";
import { planManagementService } from "@/lib/services/plan-management-service";
import { logger } from "@/lib/logger";

/**
 * GET /api/plans/[id] - Get specific plan details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Get the plan
        const plan = await planManagementService.getPlanById(id);

        if (!plan) {
            return NextResponse.json(
                { error: "Plan not found" },
                { status: 404 }
            );
        }

        // Only return active plans for public access
        if (!plan.isActive) {
            return NextResponse.json(
                { error: "Plan not available" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: plan
        });
    } catch (error) {
        logger.error("Error fetching public plan", { planId: params.id, error: error instanceof Error ? error.message : "Unknown error" });
        return NextResponse.json(
            { error: "Failed to fetch plan" },
            { status: 500 }
        );
    }
} 