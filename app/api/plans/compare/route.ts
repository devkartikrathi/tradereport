import { NextRequest, NextResponse } from "next/server";
import { planManagementService } from "@/lib/services/plan-management-service";
import { comparePlans, getFeaturesByCategory } from "@/lib/config/plan-features";
import { logger } from "@/lib/logger";

/**
 * GET /api/plans/compare - Compare plans and their features
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const planIds = searchParams.get("plans");
        const category = searchParams.get("category");

        if (!planIds) {
            return NextResponse.json(
                { error: "Plan IDs are required" },
                { status: 400 }
            );
        }

        const planIdList = planIds.split(",");

        // Get plans from database
        const plans = await Promise.all(
            planIdList.map(async (planId) => {
                const plan = await planManagementService.getPlanById(planId);
                return plan;
            })
        );

        // Filter out null plans
        const validPlans = plans.filter(plan => plan !== null);

        if (validPlans.length === 0) {
            return NextResponse.json(
                { error: "No valid plans found" },
                { status: 404 }
            );
        }

        // Get plan names for comparison
        const planNames = validPlans.map(plan => plan!.name);

        // Compare plans using the configuration
        const comparison = comparePlans(planNames);

        // Filter by category if specified
        if (category) {
            const categoryFeatures = getFeaturesByCategory(category as 'analytics' | 'ai' | 'trading' | 'monitoring' | 'support' | 'team');
            comparison.forEach(plan => {
                plan.features = plan.features.filter(feature =>
                    categoryFeatures.some(cf => cf.id === feature.id)
                );
                plan.missingFeatures = plan.missingFeatures.filter(feature =>
                    categoryFeatures.some(cf => cf.id === feature.id)
                );
            });
        }

        // Add database plan information
        const comparisonWithDbData = comparison.map(plan => {
            const dbPlan = validPlans.find(p => p!.name === plan.planName);
            return {
                ...plan,
                dbPlan: dbPlan ? {
                    id: dbPlan.id,
                    price: dbPlan.price,
                    currency: dbPlan.currency,
                    billingCycle: dbPlan.billingCycle,
                    isActive: dbPlan.isActive,
                    maxUsers: dbPlan.maxUsers
                } : null
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                comparison: comparisonWithDbData,
                totalPlans: comparisonWithDbData.length,
                category: category || 'all'
            }
        });
    } catch (error) {
        logger.error("Error comparing plans", { error: error instanceof Error ? error.message : "Unknown error" });
        return NextResponse.json(
            { error: "Failed to compare plans" },
            { status: 500 }
        );
    }
} 