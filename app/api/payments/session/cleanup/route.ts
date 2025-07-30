import { NextResponse } from "next/server";
import { paymentSessionService } from "@/lib/services/payment-session-service";
import { logger } from "@/lib/logger";

export async function POST() {
    try {
        // Clean up expired sessions
        const cleanedCount = await paymentSessionService.cleanupExpiredSessions();

        logger.info("Payment session cleanup completed", {
            cleanedCount
        });

        return NextResponse.json({
            success: true,
            cleanedCount,
            message: `Cleaned up ${cleanedCount} expired sessions`
        });

    } catch (error) {
        logger.error("Error cleaning up payment sessions", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { error: "Failed to clean up payment sessions" },
            { status: 500 }
        );
    }
} 