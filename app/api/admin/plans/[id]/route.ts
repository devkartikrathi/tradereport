import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { planManagementService, UpdatePlanData } from "@/lib/services/plan-management-service";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/plans/[id] - Get specific plan (admin only)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { id } = params;

        // Get the plan
        const plan = await planManagementService.getPlanById(id);

        if (!plan) {
            return NextResponse.json(
                { error: "Plan not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: plan
        });
    } catch (error) {
        logger.error("Error fetching plan", { planId: params.id, error: error instanceof Error ? error.message : "Unknown error" });
        return NextResponse.json(
            { error: "Failed to fetch plan" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/plans/[id] - Update plan (admin only)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { id } = params;

        // Parse request body
        const body = await request.json();
        const updateData: UpdatePlanData = {
            name: body.name,
            description: body.description,
            price: body.price,
            currency: body.currency,
            billingCycle: body.billingCycle,
            features: body.features,
            isActive: body.isActive,
            maxUsers: body.maxUsers
        };

        // Update the plan
        const updatedPlan = await planManagementService.updatePlan(id, updateData);

        return NextResponse.json({
            success: true,
            data: updatedPlan,
            message: "Plan updated successfully"
        });
    } catch (error) {
        logger.error("Error updating plan", { planId: params.id, error: error instanceof Error ? error.message : "Unknown error" });

        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 404 }
                );
            }
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
            { error: "Failed to update plan" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/plans/[id] - Delete plan (admin only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { id } = params;

        // Delete the plan (soft delete)
        const deletedPlan = await planManagementService.deletePlan(id);

        return NextResponse.json({
            success: true,
            data: deletedPlan,
            message: "Plan deleted successfully"
        });
    } catch (error) {
        logger.error("Error deleting plan", { planId: params.id, error: error instanceof Error ? error.message : "Unknown error" });

        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 404 }
                );
            }
            if (error.message.includes("active subscriptions")) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 409 }
                );
            }
        }

        return NextResponse.json(
            { error: "Failed to delete plan" },
            { status: 500 }
        );
    }
}

/**
 * Helper function to check if user is admin
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