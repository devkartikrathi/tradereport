import { NextRequest, NextResponse } from "next/server";
import { paymentSessionService } from "@/lib/services/payment-session-service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Validate required fields
        if (!data.orderId || !data.userId || !data.planId || !data.amount) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create payment session
        const session = await paymentSessionService.createSession({
            orderId: data.orderId,
            userId: data.userId,
            planId: data.planId,
            amount: data.amount,
            currency: data.currency,
            timeoutMinutes: data.timeoutMinutes
        });

        logger.info("Payment session created via API", {
            sessionId: session.sessionId,
            orderId: session.orderId
        });

        return NextResponse.json({
            success: true,
            session
        });

    } catch (error) {
        logger.error("Error creating payment session", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Failed to create payment session" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId");

        if (!sessionId) {
            return NextResponse.json(
                { error: "Session ID is required" },
                { status: 400 }
            );
        }

        // Get session status
        const session = await paymentSessionService.getSessionStatus(sessionId);

        if (!session) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            session
        });

    } catch (error) {
        logger.error("Error getting payment session", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Failed to get payment session" },
            { status: 500 }
        );
    }
} 