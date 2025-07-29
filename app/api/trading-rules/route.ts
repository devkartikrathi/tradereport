import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { tradingRules: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Return trading rules or default values
        if (user.tradingRules) {
            return NextResponse.json({
                maxDailyTrades: user.tradingRules.maxDailyTrades,
                maxDailyLoss: user.tradingRules.maxDailyLoss,
                riskRewardRatio: user.tradingRules.riskRewardRatio,
                createdAt: user.tradingRules.createdAt,
                updatedAt: user.tradingRules.updatedAt,
            });
        } else {
            // Return default values
            return NextResponse.json({
                maxDailyTrades: 10,
                maxDailyLoss: 1000.0,
                riskRewardRatio: 2.0,
                createdAt: null,
                updatedAt: null,
            });
        }

    } catch (error) {
        logger.error("Trading rules API error", {
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

        const { maxDailyTrades, maxDailyLoss, riskRewardRatio } = await request.json();

        // Validate input
        const validationErrors: string[] = [];

        if (typeof maxDailyTrades !== "number" || maxDailyTrades < 1 || maxDailyTrades > 50) {
            validationErrors.push("maxDailyTrades must be a number between 1 and 50");
        }

        if (typeof maxDailyLoss !== "number" || maxDailyLoss < 100 || maxDailyLoss > 100000) {
            validationErrors.push("maxDailyLoss must be between 100 and 100000");
        }

        if (typeof riskRewardRatio !== "number" || riskRewardRatio < 0.5 || riskRewardRatio > 10.0) {
            validationErrors.push("riskRewardRatio must be between 0.5 and 10.0");
        }

        if (validationErrors.length > 0) {
            return NextResponse.json(
                { error: "Invalid trading rules data", details: validationErrors },
                { status: 400 }
            );
        }

        // Get or create user
        let user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: "",
                },
            });
        }

        // Upsert trading rules
        const tradingRules = await prisma.tradingRuleSet.upsert({
            where: { userId: user.id },
            update: {
                maxDailyTrades,
                maxDailyLoss,
                riskRewardRatio,
            },
            create: {
                userId: user.id,
                maxDailyTrades,
                maxDailyLoss,
                riskRewardRatio,
            },
        });

        logger.info("Trading rules updated", {
            userId: user.id,
            maxDailyTrades: tradingRules.maxDailyTrades,
            maxDailyLoss: tradingRules.maxDailyLoss,
            riskRewardRatio: tradingRules.riskRewardRatio,
        });

        return NextResponse.json({
            maxDailyTrades: tradingRules.maxDailyTrades,
            maxDailyLoss: tradingRules.maxDailyLoss,
            riskRewardRatio: tradingRules.riskRewardRatio,
            createdAt: tradingRules.createdAt,
            updatedAt: tradingRules.updatedAt,
        });

    } catch (error) {
        logger.error("Trading rules update error", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
        });

        return NextResponse.json(
            { error: "Failed to update trading rules" },
            { status: 500 }
        );
    }
} 