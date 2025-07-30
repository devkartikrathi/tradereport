import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { PaymentStatus } from "@prisma/client";

export interface CancelPaymentResponse {
    success: boolean;
    data?: {
        orderId: string;
        status: string;
        message: string;
    };
    error?: string;
}

/**
 * POST /api/payments/[orderId]/cancel - Cancel pending payment
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { orderId } = params;

        if (!orderId) {
            return NextResponse.json(
                { success: false, error: "Order ID is required" },
                { status: 400 }
            );
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Get payment details
        const payment = await prisma.payment.findFirst({
            where: {
                orderId,
                userId: user.id
            }
        });

        if (!payment) {
            return NextResponse.json(
                { success: false, error: "Payment not found" },
                { status: 404 }
            );
        }

        // Check if payment can be cancelled
        if (payment.status !== PaymentStatus.PENDING) {
            return NextResponse.json(
                { success: false, error: "Payment cannot be cancelled" },
                { status: 400 }
            );
        }

        // Update payment status to cancelled
        const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.CANCELED,
                metadata: {
                    ...payment.metadata,
                    canceledAt: new Date().toISOString(),
                    canceledBy: userId
                }
            }
        });

        logger.info("Payment cancelled", {
            paymentId: payment.id,
            orderId,
            userId: user.id
        });

        const response: CancelPaymentResponse = {
            success: true,
            data: {
                orderId: updatedPayment.orderId,
                status: updatedPayment.status,
                message: "Payment cancelled successfully"
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        logger.error("Error cancelling payment", {
            error: error instanceof Error ? error.message : "Unknown error",
            orderId: params.orderId
        });

        return NextResponse.json(
            { success: false, error: "Failed to cancel payment" },
            { status: 500 }
        );
    }
} 