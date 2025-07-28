import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

interface TradingRulesRequest {
    maxDailyTrades: number;
    maxDailyLoss: number;
    riskRewardRatio: number;
}

interface TradingRulesResponse {
    maxDailyTrades: number;
    maxDailyLoss: number;
    riskRewardRatio: number;
}

function validateTradingRules(data: TradingRulesRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate max daily trades
    if (!Number.isInteger(data.maxDailyTrades) || data.maxDailyTrades < 1 || data.maxDailyTrades > 50) {
        errors.push("Max daily trades must be an integer between 1 and 50");
    }

    // Validate max daily loss
    if (typeof data.maxDailyLoss !== 'number' || data.maxDailyLoss < 100 || data.maxDailyLoss > 100000) {
        errors.push("Max daily loss must be between ₹100 and ₹1,00,000");
    }

    // Validate risk-reward ratio
    if (typeof data.riskRewardRatio !== 'number' || data.riskRewardRatio < 0.5 || data.riskRewardRatio > 10.0) {
        errors.push("Risk-reward ratio must be between 0.5 and 10.0");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { tradingRules: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Return existing rules or default values
        if (user.tradingRules) {
            const response: TradingRulesResponse = {
                maxDailyTrades: user.tradingRules.maxDailyTrades,
                maxDailyLoss: user.tradingRules.maxDailyLoss,
                riskRewardRatio: user.tradingRules.riskRewardRatio
            };
            return NextResponse.json(response);
        } else {
            // Return default values if no rules exist
            const defaultRules: TradingRulesResponse = {
                maxDailyTrades: 10,
                maxDailyLoss: 1000.0,
                riskRewardRatio: 2.0
            };
            return NextResponse.json(defaultRules);
        }

    } catch (error) {
        logger.error("Error fetching trading rules", {
            error: error instanceof Error ? error.message : "Unknown error",
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

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Parse request body
        const body = await request.json();
        const tradingRules: TradingRulesRequest = {
            maxDailyTrades: body.maxDailyTrades,
            maxDailyLoss: body.maxDailyLoss,
            riskRewardRatio: body.riskRewardRatio
        };

        // Validate trading rules
        const validation = validateTradingRules(tradingRules);
        if (!validation.isValid) {
            return NextResponse.json(
                {
                    error: "Invalid trading rules",
                    details: validation.errors
                },
                { status: 400 }
            );
        }

        // Save or update trading rules
        const savedRules = await prisma.tradingRuleSet.upsert({
            where: { userId: user.id },
            update: {
                maxDailyTrades: tradingRules.maxDailyTrades,
                maxDailyLoss: tradingRules.maxDailyLoss,
                riskRewardRatio: tradingRules.riskRewardRatio,
                updatedAt: new Date()
            },
            create: {
                userId: user.id,
                maxDailyTrades: tradingRules.maxDailyTrades,
                maxDailyLoss: tradingRules.maxDailyLoss,
                riskRewardRatio: tradingRules.riskRewardRatio
            }
        });

        logger.info("Trading rules saved successfully", {
            userId: user.id,
            maxDailyTrades: savedRules.maxDailyTrades,
            maxDailyLoss: savedRules.maxDailyLoss,
            riskRewardRatio: savedRules.riskRewardRatio
        });

        return NextResponse.json({
            success: true,
            message: "Trading rules saved successfully",
            rules: {
                maxDailyTrades: savedRules.maxDailyTrades,
                maxDailyLoss: savedRules.maxDailyLoss,
                riskRewardRatio: savedRules.riskRewardRatio
            }
        });

    } catch (error) {
        logger.error("Error saving trading rules", {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 