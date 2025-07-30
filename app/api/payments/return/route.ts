import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/lib/services/payment-service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        const returnData = await request.json();

        // Validate required fields
        if (!returnData.merchantTransactionId || !returnData.status) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid payment return parameters"
                },
                { status: 400 }
            );
        }

        // Process payment return
        const result = await paymentService.processPaymentReturn(returnData);

        logger.info("Payment return processed successfully", {
            merchantTransactionId: returnData.merchantTransactionId,
            status: returnData.status,
            success: result.success
        });

        return NextResponse.json({
            success: result.success,
            message: result.message,
            payment: result.payment ? {
                orderId: (result.payment as any).orderId,
                amount: result.payment.amount,
                currency: result.payment.currency,
                status: result.payment.status,
                transactionId: result.payment.transactionId,
                planName: (result.payment as any).plan?.name
            } : undefined
        });

    } catch (error) {
        logger.error("Error processing payment return", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            {
                success: false,
                message: "Failed to process payment return"
            },
            { status: 500 }
        );
    }
} 