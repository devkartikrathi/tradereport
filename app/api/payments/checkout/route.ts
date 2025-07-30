import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { PaymentStatus } from "@prisma/client";

export interface CheckoutRequest {
    planId: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, unknown>;
}

export interface CheckoutResponse {
    success: boolean;
    data?: {
        orderId: string;
        paymentUrl: string;
        amount: number;
        currency: string;
        planId: string;
    };
    error?: string;
}

/**
 * POST /api/payments/checkout - Create payment order and return payment URL
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get request body
        const body: CheckoutRequest = await request.json();
        const { planId, amount, currency = "INR", metadata } = body;

        // Validate required fields
        if (!planId) {
            return NextResponse.json(
                { success: false, error: "Plan ID is required" },
                { status: 400 }
            );
        }

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: "Valid amount is required" },
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

        // Get plan details
        const plan = await prisma.plan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return NextResponse.json(
                { success: false, error: "Plan not found" },
                { status: 404 }
            );
        }

        if (!plan.isActive) {
            return NextResponse.json(
                { success: false, error: "Plan is not active" },
                { status: 400 }
            );
        }

        // Validate amount matches plan price
        if (plan.price !== amount) {
            return NextResponse.json(
                { success: false, error: "Payment amount does not match plan price" },
                { status: 400 }
            );
        }

        // Check for existing pending payment
        const existingPayment = await prisma.payment.findFirst({
            where: {
                planId,
                userId: user.id,
                status: PaymentStatus.PENDING
            }
        });

        if (existingPayment) {
            return NextResponse.json(
                { success: false, error: "Pending payment already exists for this plan" },
                { status: 409 }
            );
        }

        // Generate unique IDs
        const orderId = generateOrderId();
        const phonePeTransactionId = generatePhonePeTransactionId();

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                planId,
                userId: user.id,
                phonePeTransactionId,
                orderId,
                amount,
                currency,
                status: PaymentStatus.PENDING,
                paymentMethod: "phonepe",
                metadata: metadata || {},
            }
        });

        logger.info("Payment order created", {
            paymentId: payment.id,
            orderId,
            planId,
            amount,
            userId: user.id
        });

        // For now, return a mock payment URL
        // In production, this would integrate with PhonePe API
        const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/process?orderId=${orderId}`;

        const response: CheckoutResponse = {
            success: true,
            data: {
                orderId,
                paymentUrl,
                amount,
                currency,
                planId
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        logger.error("Error creating payment checkout", {
            error: error instanceof Error ? error.message : "Unknown error"
        });

        return NextResponse.json(
            { success: false, error: "Failed to create payment order" },
            { status: 500 }
        );
    }
}

/**
 * Generate unique order ID
 */
function generateOrderId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return `ORDER_${timestamp}_${random}`.toUpperCase();
}

/**
 * Generate PhonePe transaction ID
 */
function generatePhonePeTransactionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return `TXN_${timestamp}_${random}`.toUpperCase();
} 