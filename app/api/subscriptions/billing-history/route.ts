import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { billingHistoryService } from "@/lib/services/billing-history-service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        // Get authenticated user
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Get billing history
        const billingHistory = await billingHistoryService.getBillingHistory(userId, {
            page,
            limit,
            status,
            startDate,
            endDate
        });

        logger.info("Billing history retrieved", {
            userId,
            page,
            limit,
            totalRecords: billingHistory.totalRecords
        });

        return NextResponse.json({
            success: true,
            billingHistory: billingHistory.records,
            pagination: {
                page: billingHistory.page,
                limit: billingHistory.limit,
                totalRecords: billingHistory.totalRecords,
                totalPages: billingHistory.totalPages,
                hasNext: billingHistory.hasNext,
                hasPrev: billingHistory.hasPrev
            }
        });

    } catch (error) {
        logger.error("Error getting billing history", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Failed to get billing history" },
            { status: 500 }
        );
    }
} 