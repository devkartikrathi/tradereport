import { NextResponse } from "next/server";
import { webhookService } from "@/lib/services/webhook-service";
import { logger } from "@/lib/logger";

export async function POST() {
    try {
        // Retry failed webhooks
        const retryCount = await webhookService.retryFailedWebhooks();

        logger.info("Webhook retry completed", {
            retryCount
        });

        return NextResponse.json({
            success: true,
            retryCount,
            message: `Retried ${retryCount} failed webhooks`
        });

    } catch (error) {
        logger.error("Error retrying webhooks", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Failed to retry webhooks" },
            { status: 500 }
        );
    }
} 