import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/lib/services/payment-service";
import { logger } from "@/lib/logger";

export async function GET(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { orderId } = params;

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID is required" },
                { status: 400 }
            );
        }

        // Get payment status
        const payment = await paymentService.getPaymentStatus(orderId);

        if (!payment) {
            return NextResponse.json(
                { error: "Payment not found" },
                { status: 404 }
            );
        }

        // Get plan details
        const plan = await paymentService.getPlanDetails((payment as any).planId);

        logger.info("Payment status retrieved", {
            orderId,
            status: payment.status,
            paymentId: payment.id
        });

        return NextResponse.json({
            orderId: (payment as any).orderId,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            planId: (payment as any).planId,
            planName: plan?.name,
            paymentUrl: (payment as any).paymentUrl,
            message: getStatusMessage(payment.status)
        });

    } catch (error) {
        logger.error("Error getting payment status", {
            error: error instanceof Error ? error.message : "Unknown error",
            orderId: params.orderId
        });

        return NextResponse.json(
            { error: "Failed to get payment status" },
            { status: 500 }
        );
    }
}

function getStatusMessage(status: string): string {
    switch (status) {
        case "PENDING":
            return "Payment is pending. Redirecting to PhonePe...";
        case "PROCESSING":
            return "Payment is being processed...";
        case "SUCCEEDED":
            return "Payment completed successfully!";
        case "FAILED":
            return "Payment failed. Please try again.";
        case "CANCELED":
            return "Payment was cancelled.";
        case "REFUNDED":
            return "Payment has been refunded.";
        default:
            return "Payment status unknown.";
    }
} 