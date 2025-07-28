import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { validatorService } from "@/lib/services/validator-service";
import { s3Service } from "@/lib/services/s3-service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        const body = await request.json();
        const { imageId, description, tradeDetails } = body;

        if (!imageId || !description) {
            return NextResponse.json({
                error: "Image ID and description are required"
            }, { status: 400 });
        }

        // Get image URL from S3
        let imageUrl: string;
        try {
            imageUrl = await s3Service.getImageUrl(imageId);
        } catch (error) {
            logger.error("Error getting image URL", {
                imageId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return NextResponse.json({
                error: "Failed to retrieve uploaded image"
            }, { status: 500 });
        }

        // Validate trade idea with AI
        const validationResult = await validatorService.validateTradeIdea(
            imageUrl,
            description,
            tradeDetails
        );

        // If trade details are provided, also check against trading rules
        if (tradeDetails) {
            const ruleValidations = await validatorService.checkTradingRules(tradeDetails, user.id);

            // Add trading rules validations to the checklist
            ruleValidations.forEach(rule => {
                validationResult.checklist.push({
                    id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    category: 'Trading Rules',
                    item: rule.rule,
                    status: rule.status,
                    explanation: rule.explanation,
                    recommendation: rule.recommendation,
                });
            });

            // Recalculate overall score and status
            const passCount = validationResult.checklist.filter(item => item.status === 'pass').length;
            const failCount = validationResult.checklist.filter(item => item.status === 'fail').length;
            const totalChecks = validationResult.checklist.length;
            validationResult.score = totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 0;

            if (validationResult.score >= 80 && failCount === 0) {
                validationResult.overall = 'pass';
            } else if (validationResult.score >= 60 && failCount <= 1) {
                validationResult.overall = 'warning';
            } else {
                validationResult.overall = 'fail';
            }
        }

        logger.info("Trade validation completed", {
            userId: user.id,
            imageId,
            overall: validationResult.overall,
            score: validationResult.score,
            checklistCount: validationResult.checklist.length,
        });

        return NextResponse.json(validationResult);

    } catch (error) {
        logger.error("Error validating trade idea", {
            error: error instanceof Error ? error.message : "Unknown error",
        });

        return NextResponse.json(
            {
                error: "Failed to validate trade idea",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
} 