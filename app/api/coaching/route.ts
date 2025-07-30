import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { coachingService } from "@/lib/services/coaching-service";
import { subscriptionMiddleware } from "@/lib/middleware/subscription-middleware";
import { logger } from "@/lib/logger";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validate subscription for AI coaching feature
        const validation = await subscriptionMiddleware.validateSubscription(userId);
        if (!validation.hasAccess) {
            return NextResponse.json(
                {
                    error: "Premium subscription required for AI coaching",
                    details: validation.error,
                    upgradeRequired: true
                },
                { status: 403 }
            );
        }

        // Get user from database to get the internal user ID
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();

        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Generate coaching insights
        const coachingData = await coachingService.getUserCoachingData(user.id);

        logger.info("Coaching insights fetched successfully", {
            userId: user.id,
            strengthsCount: coachingData.strengths.length,
            weaknessesCount: coachingData.weaknesses.length,
            recommendationsCount: coachingData.recommendations.length
        });

        return NextResponse.json(coachingData);

    } catch (error) {
        logger.error("Error fetching coaching insights", {
            error: error instanceof Error ? error.message : "Unknown error",
        });

        return NextResponse.json(
            {
                error: "Failed to fetch coaching insights",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
} 