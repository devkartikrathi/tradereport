import { NextRequest, NextResponse } from "next/server";
import { webhookService } from "@/lib/services/webhook-service";
import { webhookAuth } from "@/middleware/webhook-auth";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        // Authenticate webhook request
        const authResult = webhookAuth.authenticate(request);
        if (!authResult.isValid) {
            logger.warn("Webhook authentication failed", {
                error: authResult.error
            });
            return NextResponse.json(
                { error: authResult.error },
                { status: 401 }
            );
        }

        // Get the raw body for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get("x-phonepe-signature");
        const timestamp = request.headers.get("x-phonepe-timestamp");

        // Log webhook reception
        logger.info("PhonePe webhook received", {
            signature: signature ? "present" : "missing",
            timestamp,
            bodyLength: rawBody.length
        });

        // Parse webhook payload
        let webhookData;
        try {
            webhookData = JSON.parse(rawBody);
        } catch (error) {
            logger.error("PhonePe webhook invalid JSON", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            return NextResponse.json(
                { error: "Invalid JSON payload" },
                { status: 400 }
            );
        }

        // Validate webhook payload structure
        if (!webhookData.merchantTransactionId || !webhookData.status) {
            logger.warn("PhonePe webhook missing required fields", {
                hasTransactionId: !!webhookData.merchantTransactionId,
                hasStatus: !!webhookData.status
            });
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Process webhook
        const result = await webhookService.processWebhook({
            payload: webhookData,
            signature,
            timestamp,
            rawBody
        });

        if (result.success) {
            logger.info("PhonePe webhook processed successfully", {
                transactionId: webhookData.merchantTransactionId,
                status: webhookData.status
            });

            return NextResponse.json({
                success: true,
                message: "Webhook processed successfully"
            });
        } else {
            logger.error("PhonePe webhook processing failed", {
                transactionId: webhookData.merchantTransactionId,
                error: result.error
            });

            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

    } catch (error) {
        logger.error("PhonePe webhook error", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // Health check endpoint
        const health = await webhookService.getHealthStatus();

        return NextResponse.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            ...health
        });
    } catch (error) {
        logger.error("Webhook health check failed", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { status: "unhealthy", error: "Health check failed" },
            { status: 500 }
        );
    }
} 