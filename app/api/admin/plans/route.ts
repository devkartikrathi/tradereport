import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { planManagementService, CreatePlanData } from "@/lib/services/plan-management-service";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/plans - Get all plans (admin only)
 */
export async function GET(request: NextRequest) {
    try {
        // Check admin authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin (you may need to implement admin role checking)
        const isAdmin = await checkAdminRole(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const isActive = searchParams.get("isActive");
        const includeInactive = searchParams.get("includeInactive") === "true";

        // Get plans with optional filtering
        const options: { isActive?: boolean; includeInactive?: boolean } = {};
        if (isActive !== null) {
            options.isActive = isActive === "true";
        }
        if (includeInactive) {
            options.includeInactive = true;
        }

        const plans = await planManagementService.getPlans(options);

        return NextResponse.json({
            success: true,
            data: plans,
            count: plans.length
        });
    } catch (error) {
        logger.error("Error fetching plans", { error: error instanceof Error ? error.message : "Unknown error" });
        return NextResponse.json(
            { error: "Failed to fetch plans" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/plans - Create new plan (admin only)
 */
export async function POST(request: NextRequest) {
    try {
        // Check admin authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const isAdmin = await checkAdminRole(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();
        const planData: CreatePlanData = {
            name: body.name,
            description: body.description,
            price: body.price,
            currency: body.currency || "INR",
            billingCycle: body.billingCycle,
            features: body.features,
            isActive: body.isActive !== undefined ? body.isActive : true,
            maxUsers: body.maxUsers
        };

        // Validate required fields
        if (!planData.name || !planData.billingCycle || !planData.features) {
            return NextResponse.json(
                { error: "Missing required fields: name, billingCycle, features" },
                { status: 400 }
            );
        }

        // Create the plan
        const plan = await planManagementService.createPlan(planData);

        return NextResponse.json({
            success: true,
            data: plan,
            message: "Plan created successfully"
        }, { status: 201 });
    } catch (error) {
        logger.error("Error creating plan", { error: error instanceof Error ? error.message : "Unknown error" });

        if (error instanceof Error) {
            if (error.message.includes("already exists")) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 409 }
                );
            }
            if (error.message.includes("Invalid plan data")) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            { error: "Failed to create plan" },
            { status: 500 }
        );
    }
}

/**
 * Helper function to check if user is admin
 * This is a placeholder - implement based on your admin role system
 */
async function checkAdminRole(userId: string): Promise<boolean> {
    try {
        // For development/testing, you might want to allow specific user IDs
        const adminUserIds = process.env.ADMIN_USER_IDS?.split(",") || [];
        const isAdminById = adminUserIds.includes(userId);

        // For now, we'll use a simple check based on user ID
        // In a real implementation, you might check against a database or Clerk metadata
        return isAdminById;
    } catch (error) {
        logger.error("Error checking admin role", { userId, error: error instanceof Error ? error.message : "Unknown error" });
        return false;
    }
} 