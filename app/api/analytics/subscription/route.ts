import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { subscriptionAnalyticsService } from "@/lib/services/subscription-analytics-service";
import { subscriptionMiddleware } from "@/lib/middleware/subscription-middleware";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Validate subscription for analytics access
        const validation = await subscriptionMiddleware.validateSubscription(userId);
        if (!validation.hasAccess) {
            return NextResponse.json(
                {
                    error: "Premium subscription required for analytics",
                    details: validation.error,
                    upgradeRequired: true
                },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        switch (type) {
            case "usage":
                const usageData = await subscriptionAnalyticsService.getSubscriptionUsageAnalytics();
                return NextResponse.json(usageData);

            case "feature-access":
                const featureData = await subscriptionAnalyticsService.getFeatureAccessAnalytics();
                return NextResponse.json(featureData);

            case "conversion":
                const conversionData = await subscriptionAnalyticsService.getSubscriptionConversionAnalytics();
                return NextResponse.json(conversionData);

            case "health":
                const healthData = await subscriptionAnalyticsService.getSubscriptionHealthMonitoring();
                return NextResponse.json(healthData);

            case "performance":
                const performanceData = await subscriptionAnalyticsService.getPerformanceMetrics();
                return NextResponse.json(performanceData);

            case "user":
                const userData = await subscriptionAnalyticsService.getUserAnalytics(userId);
                return NextResponse.json(userData);

            case "report":
                const reportData = await subscriptionAnalyticsService.exportAnalyticsReport();
                return NextResponse.json(reportData);

            default:
                // Return all analytics data
                const [
                    usageData,
                    featureData,
                    conversionData,
                    healthData,
                    performanceData,
                    userData
                ] = await Promise.all([
                    subscriptionAnalyticsService.getSubscriptionUsageAnalytics(),
                    subscriptionAnalyticsService.getFeatureAccessAnalytics(),
                    subscriptionAnalyticsService.getSubscriptionConversionAnalytics(),
                    subscriptionAnalyticsService.getSubscriptionHealthMonitoring(),
                    subscriptionAnalyticsService.getPerformanceMetrics(),
                    subscriptionAnalyticsService.getUserAnalytics(userId)
                ]);

                return NextResponse.json({
                    usage: usageData,
                    featureAccess: featureData,
                    conversion: conversionData,
                    health: healthData,
                    performance: performanceData,
                    user: userData,
                    generatedAt: new Date()
                });
        }
    } catch (error) {
        logger.error("Error fetching subscription analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics data" },
            { status: 500 }
        );
    }
} 