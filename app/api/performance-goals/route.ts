import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // For now, return empty array until Prisma client is regenerated
        return NextResponse.json([]);

    } catch (error) {
        logger.error("Performance goals API error", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
        });

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, description, category, targetValue, targetDate } = await request.json();

        // Validate input
        if (!title || !category || typeof targetValue !== "number") {
            return NextResponse.json(
                { error: "Title, category, and target value are required" },
                { status: 400 }
            );
        }

        // Validate category
        const validCategories = ["profit_target", "win_rate", "risk_management", "consistency"];
        if (!validCategories.includes(category)) {
            return NextResponse.json(
                { error: "Invalid category" },
                { status: 400 }
            );
        }

        // For now, return a mock response until Prisma client is regenerated
        const mockGoal = {
            id: "mock-goal-id",
            title,
            description,
            category,
            targetValue,
            currentValue: 0,
            startDate: new Date().toISOString(),
            targetDate: targetDate ? new Date(targetDate).toISOString() : null,
            isActive: true,
            progress: 0,
            insights: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        logger.info("Performance goal created", {
            userId,
            goalId: mockGoal.id,
            title: mockGoal.title,
            category: mockGoal.category,
        });

        return NextResponse.json(mockGoal);

    } catch (error) {
        logger.error("Performance goal creation error", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
        });

        return NextResponse.json(
            { error: "Failed to create performance goal" },
            { status: 500 }
        );
    }
} 