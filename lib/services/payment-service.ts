import { PrismaClient, Payment, PaymentStatus, User } from "@prisma/client";
import { logger } from "@/lib/logger";
import crypto from "crypto";

const prisma = new PrismaClient();

export interface CreatePaymentOrderData {
    planId: string;
    userId: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, unknown>;
}

export interface PhonePePaymentRequest {
    merchantId: string;
    merchantTransactionId: string;
    amount: number;
    redirectUrl: string;
    redirectMode: string;
    callbackUrl: string;
    merchantUserId: string;
    mobileNumber?: string;
    paymentInstrument: {
        type: string;
    };
}

export interface PhonePePaymentResponse {
    success: boolean;
    code: string;
    message: string;
    data?: {
        merchantId: string;
        merchantTransactionId: string;
        instrumentResponse: {
            type: string;
            redirectInfo: {
                url: string;
            };
        };
    };
}

export interface PaymentValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface PaymentReturnData {
    merchantId: string;
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    status: string;
    responseCode: string;
    responseMessage: string;
    signature: string;
}

export interface PaymentResult {
    success: boolean;
    payment: Payment;
    message: string;
}

export class PaymentService {
    private readonly PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "";
    private readonly PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || "";
    private readonly PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
    private readonly PHONEPE_BASE_URL = process.env.PHONEPE_BASE_URL || "https://api.phonepe.com/apis/pg-sandbox";

    /**
     * Create a new payment order
     */
    async createPaymentOrder(data: CreatePaymentOrderData): Promise<Payment> {
        try {
            // Validate payment data
            const validation = await this.validatePaymentData(data);
            if (!validation.isValid) {
                throw new Error(`Invalid payment data: ${validation.errors.join(", ")}`);
            }

            // Get plan and user details
            const [plan, user] = await Promise.all([
                prisma.plan.findUnique({ where: { id: data.planId } }),
                prisma.user.findUnique({ where: { id: data.userId } })
            ]);

            if (!plan) {
                throw new Error("Plan not found");
            }

            if (!user) {
                throw new Error("User not found");
            }

            // Generate unique order ID and transaction ID
            const orderId = this.generateOrderId();
            const phonePeTransactionId = this.generatePhonePeTransactionId();

            // Create payment record in database
            const payment = await prisma.payment.create({
                data: {
                    phonePeTransactionId,
                    status: PaymentStatus.PENDING,
                    amount: data.amount,
                    currency: data.currency || "INR",
                    planId: data.planId,
                    userId: data.userId,
                    orderId,
                    paymentMethod: "phonepe",
                    metadata: data.metadata as any || {},
                }
            });

            logger.info("Payment order created", {
                paymentId: payment.id,
                orderId,
                amount: data.amount,
                planId: data.planId
            });

            return payment;
        } catch (error) {
            logger.error("Error creating payment order", {
                error: error instanceof Error ? error.message : "Unknown error",
                data
            });
            throw error;
        }
    }

    /**
     * Create PhonePe payment order
     */
    async createPhonePeOrder(payment: Payment, user: User): Promise<string> {
        try {
            const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/return`;
            const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/phonepe/callback`;

            const paymentRequest: PhonePePaymentRequest = {
                merchantId: this.PHONEPE_MERCHANT_ID,
                merchantTransactionId: payment.phonePeTransactionId,
                amount: payment.amount * 100, // PhonePe expects amount in paise
                redirectUrl,
                redirectMode: "POST",
                callbackUrl,
                merchantUserId: user.clerkId,
                paymentInstrument: {
                    type: "PAY_PAGE"
                }
            };

            // Generate signature
            const signature = this.generatePhonePeSignature(paymentRequest);

            // Create PhonePe API request
            const phonePeRequest = {
                request: this.encryptRequest(JSON.stringify(paymentRequest))
            };

            // Call PhonePe API
            const response = await fetch(`${this.PHONEPE_BASE_URL}/pg/v1/pay`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": signature
                },
                body: JSON.stringify(phonePeRequest)
            });

            if (!response.ok) {
                throw new Error(`PhonePe API error: ${response.status} ${response.statusText}`);
            }

            const phonePeResponse: PhonePePaymentResponse = await response.json();

            if (!phonePeResponse.success) {
                throw new Error(`PhonePe payment failed: ${phonePeResponse.message}`);
            }

            // Update payment with PhonePe response
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    paymentUrl: phonePeResponse.data?.instrumentResponse.redirectInfo.url,
                    signature,
                    metadata: {
                        ...(payment.metadata as Record<string, any>),
                        phonePeResponse: phonePeResponse.data
                    }
                }
            });

            logger.info("PhonePe order created successfully", {
                paymentId: payment.id,
                phonePeTransactionId: payment.phonePeTransactionId
            });

            return phonePeResponse.data?.instrumentResponse.redirectInfo.url || "";
        } catch (error) {
            logger.error("Error creating PhonePe order", {
                error: error instanceof Error ? error.message : "Unknown error",
                paymentId: payment.id
            });
            throw error;
        }
    }

    /**
     * Validate payment return data from PhonePe
     */
    async validatePaymentReturn(returnData: PaymentReturnData): Promise<PaymentValidationResult> {
        const errors: string[] = [];

        try {
            // Validate required fields
            if (!returnData.merchantId) {
                errors.push("Merchant ID is required");
            }

            if (!returnData.merchantTransactionId) {
                errors.push("Merchant transaction ID is required");
            }

            if (!returnData.transactionId) {
                errors.push("Transaction ID is required");
            }

            if (!returnData.amount) {
                errors.push("Amount is required");
            }

            if (!returnData.signature) {
                errors.push("Signature is required");
            }

            // Validate amount format and range
            if (returnData.amount && (isNaN(returnData.amount) || returnData.amount <= 0)) {
                errors.push("Invalid amount");
            }

            // Validate response code
            if (returnData.responseCode && returnData.responseCode !== "SUCCESS") {
                errors.push(`Payment failed with code: ${returnData.responseCode}`);
            }

            // Verify signature
            if (!this.verifyPhonePeSignature(JSON.stringify(returnData), returnData.signature)) {
                errors.push("Invalid signature");
            }

            // Check if payment exists
            const payment = await prisma.payment.findUnique({
                where: { phonePeTransactionId: returnData.merchantTransactionId }
            });

            if (!payment) {
                errors.push("Payment not found");
            } else {
                // Validate amount matches (convert from paise to rupees)
                const expectedAmount = payment.amount * 100;
                if (returnData.amount && returnData.amount !== expectedAmount) {
                    errors.push("Amount mismatch");
                }

                // Check if payment is already processed
                if (payment.status !== "PENDING") {
                    errors.push("Payment already processed");
                }
            }

            // Validate merchant ID matches
            if (returnData.merchantId && returnData.merchantId !== this.PHONEPE_MERCHANT_ID) {
                errors.push("Invalid merchant ID");
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        } catch (error) {
            logger.error("Error validating payment return", {
                error: error instanceof Error ? error.message : "Unknown error",
                returnData
            });
            errors.push("Validation error occurred");
            return {
                isValid: false,
                errors
            };
        }
    }

    /**
     * Process payment return from PhonePe
     */
    async processPaymentReturn(returnData: PaymentReturnData): Promise<PaymentResult> {
        try {
            // Validate return data
            const validation = await this.validatePaymentReturn(returnData);
            if (!validation.isValid) {
                throw new Error(`Invalid payment return: ${validation.errors.join(", ")}`);
            }

            // Find payment
            const payment = await prisma.payment.findUnique({
                where: { phonePeTransactionId: returnData.merchantTransactionId }
            });

            if (!payment) {
                throw new Error("Payment not found");
            }

            // Update payment status based on PhonePe response
            let newStatus: PaymentStatus;
            let message: string;

            if (returnData.status === "PAYMENT_SUCCESS") {
                newStatus = PaymentStatus.SUCCEEDED;
                message = "Payment completed successfully";
            } else if (returnData.status === "PAYMENT_ERROR") {
                newStatus = PaymentStatus.FAILED;
                message = "Payment failed";
            } else {
                newStatus = PaymentStatus.FAILED;
                message = "Payment status unknown";
            }

            // Update payment
            const updatedPayment = await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: newStatus,
                    transactionId: returnData.transactionId,
                    metadata: {
                        ...(payment.metadata as Record<string, any>),
                        returnData,
                        processedAt: new Date().toISOString()
                    }
                }
            });

            logger.info("Payment return processed", {
                paymentId: payment.id,
                status: newStatus,
                transactionId: returnData.transactionId
            });

            return {
                success: newStatus === PaymentStatus.SUCCEEDED,
                payment: updatedPayment,
                message
            };
        } catch (error) {
            logger.error("Error processing payment return", {
                error: error instanceof Error ? error.message : "Unknown error",
                returnData
            });
            throw error;
        }
    }

    /**
     * Verify PhonePe signature
     */
    verifyPhonePeSignature(payload: string, signature: string): boolean {
        try {
            const expectedSignature = this.generatePhonePeSignature(payload);
            return signature === expectedSignature;
        } catch (error) {
            logger.error("Error verifying PhonePe signature", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            return false;
        }
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(orderId: string): Promise<Payment | null> {
        try {
            const payment = await prisma.payment.findUnique({
                where: { orderId },
                include: {
                    subscription: {
                        include: {
                            plan: true,
                            user: true
                        }
                    }
                }
            });

            return payment;
        } catch (error) {
            logger.error("Error getting payment status", {
                error: error instanceof Error ? error.message : "Unknown error",
                orderId
            });
            throw error;
        }
    }

    /**
     * Update payment status
     */
    async updatePaymentStatus(
        orderId: string,
        status: PaymentStatus,
        metadata?: Record<string, any>
    ): Promise<Payment> {
        try {
            const existingPayment = await prisma.payment.findUnique({
                where: { orderId }
            });

            if (!existingPayment) {
                throw new Error("Payment not found");
            }

            const payment = await prisma.payment.update({
                where: { orderId },
                data: {
                    status,
                    metadata: metadata ? {
                        ...(existingPayment.metadata as Record<string, any>),
                        ...metadata
                    } : undefined
                }
            });

            logger.info("Payment status updated", {
                orderId,
                status,
                paymentId: payment.id
            });

            return payment;
        } catch (error) {
            logger.error("Error updating payment status", {
                error: error instanceof Error ? error.message : "Unknown error",
                orderId,
                status
            });
            throw error;
        }
    }

    /**
     * Cancel pending payment
     */
    async cancelPayment(orderId: string): Promise<Payment> {
        try {
            const payment = await prisma.payment.findUnique({
                where: { orderId }
            });

            if (!payment) {
                throw new Error("Payment not found");
            }

            if (payment.status !== PaymentStatus.PENDING) {
                throw new Error("Payment cannot be cancelled");
            }

            const updatedPayment = await this.updatePaymentStatus(
                orderId,
                PaymentStatus.CANCELED,
                { canceledAt: new Date().toISOString() }
            );

            logger.info("Payment cancelled", { orderId, paymentId: payment.id });
            return updatedPayment;
        } catch (error) {
            logger.error("Error cancelling payment", {
                error: error instanceof Error ? error.message : "Unknown error",
                orderId
            });
            throw error;
        }
    }

    /**
     * Validate payment data
     */
    private async validatePaymentData(data: CreatePaymentOrderData): Promise<PaymentValidationResult> {
        const errors: string[] = [];

        // Validate required fields
        if (!data.planId) {
            errors.push("Plan ID is required");
        }

        if (!data.userId) {
            errors.push("User ID is required");
        }

        if (!data.amount || data.amount <= 0) {
            errors.push("Valid amount is required");
        }

        // Check if plan exists and is active
        if (data.planId) {
            const plan = await prisma.plan.findUnique({
                where: { id: data.planId }
            });

            if (!plan) {
                errors.push("Plan not found");
            } else if (!plan.isActive) {
                errors.push("Plan is not active");
            } else if (plan.price !== data.amount) {
                errors.push("Payment amount does not match plan price");
            }
        }

        // Check if user exists
        if (data.userId) {
            const user = await prisma.user.findUnique({
                where: { id: data.userId }
            });

            if (!user) {
                errors.push("User not found");
            }
        }

        // Check for duplicate pending payments
        if (data.planId && data.userId) {
            const existingPayment = await prisma.payment.findFirst({
                where: {
                    planId: data.planId,
                    userId: data.userId,
                    status: PaymentStatus.PENDING
                }
            });

            if (existingPayment) {
                errors.push("Pending payment already exists for this plan");
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Generate unique order ID
     */
    private generateOrderId(): string {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 15);
        return `ORDER_${timestamp}_${random}`.toUpperCase();
    }

    /**
     * Generate PhonePe transaction ID
     */
    private generatePhonePeTransactionId(): string {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 15);
        return `TXN_${timestamp}_${random}`.toUpperCase();
    }

    /**
     * Generate PhonePe signature
     */
    private generatePhonePeSignature(payload: string | object): string {
        const payloadString = typeof payload === "string" ? payload : JSON.stringify(payload);
        const base64Payload = Buffer.from(payloadString).toString("base64");
        const stringToHash = `${base64Payload}/pg/v1/pay${this.PHONEPE_SALT_KEY}`;

        const sha256Hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
        return `${sha256Hash}###${this.PHONEPE_SALT_INDEX}`;
    }

    /**
     * Generate CSRF token for payment
     */
    generateCSRFToken(orderId: string): string {
        const timestamp = Date.now().toString();
        const data = `${orderId}:${timestamp}:${this.PHONEPE_SALT_KEY}`;
        return crypto.createHash("sha256").update(data).digest("hex");
    }

    /**
     * Validate CSRF token
     */
    validateCSRFToken(token: string, orderId: string): boolean {
        try {
            // Extract timestamp from token (first 13 characters are timestamp)
            const timestamp = token.substring(0, 13);
            const expectedData = `${orderId}:${timestamp}:${this.PHONEPE_SALT_KEY}`;
            const expectedToken = crypto.createHash("sha256").update(expectedData).digest("hex");

            // Check if token is valid and not expired (30 minutes)
            const tokenAge = Date.now() - parseInt(timestamp);
            const maxAge = 30 * 60 * 1000; // 30 minutes

            return token === expectedToken && tokenAge < maxAge;
        } catch (error) {
            logger.error("Error validating CSRF token", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            return false;
        }
    }

    /**
     * Generate payment URL with security parameters
     */
    generateSecurePaymentUrl(payment: Payment, csrfToken: string): string {
        const baseUrl = payment.paymentUrl;
        if (!baseUrl) {
            throw new Error("Payment URL not found");
        }

        const url = new URL(baseUrl);
        url.searchParams.set("csrf", csrfToken);
        url.searchParams.set("orderId", payment.orderId);
        url.searchParams.set("timestamp", Date.now().toString());

        return url.toString();
    }

    /**
     * Validate payment URL security
     */
    validatePaymentURL(url: string, orderId: string): boolean {
        try {
            const urlObj = new URL(url);

            // Check if URL is from PhonePe domain
            if (!urlObj.hostname.includes("phonepe.com")) {
                return false;
            }

            // Validate required parameters
            const requiredParams = ["csrf", "orderId", "timestamp"];
            for (const param of requiredParams) {
                if (!urlObj.searchParams.has(param)) {
                    return false;
                }
            }

            // Validate CSRF token
            const csrfToken = urlObj.searchParams.get("csrf");
            if (!csrfToken || !this.validateCSRFToken(csrfToken, orderId)) {
                return false;
            }

            // Check if URL is not expired (30 minutes)
            const timestamp = parseInt(urlObj.searchParams.get("timestamp") || "0");
            const urlAge = Date.now() - timestamp;
            const maxAge = 30 * 60 * 1000; // 30 minutes

            return urlAge < maxAge;
        } catch (error) {
            logger.error("Error validating payment URL", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            return false;
        }
    }

    /**
     * Encrypt request for PhonePe
     */
    private encryptRequest(payload: string): string {
        // This is a simplified encryption - in production, use proper encryption
        return Buffer.from(payload).toString("base64");
    }

    /**
     * Get plan details
     */
    async getPlanDetails(planId: string) {
        try {
            const plan = await prisma.plan.findUnique({
                where: { id: planId }
            });

            return plan;
        } catch (error) {
            logger.error("Error getting plan details", {
                error: error instanceof Error ? error.message : "Unknown error",
                planId
            });
            throw error;
        }
    }

    /**
     * Get payment statistics
     */
    async getPaymentStatistics(): Promise<{
        totalPayments: number;
        successfulPayments: number;
        pendingPayments: number;
        failedPayments: number;
        totalAmount: number;
    }> {
        try {
            const [
                totalPayments,
                successfulPayments,
                pendingPayments,
                failedPayments,
                totalAmount
            ] = await Promise.all([
                prisma.payment.count(),
                prisma.payment.count({ where: { status: PaymentStatus.SUCCEEDED } }),
                prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
                prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
                prisma.payment.aggregate({
                    where: { status: PaymentStatus.SUCCEEDED },
                    _sum: { amount: true }
                })
            ]);

            return {
                totalPayments,
                successfulPayments,
                pendingPayments,
                failedPayments,
                totalAmount: totalAmount._sum.amount || 0
            };
        } catch (error) {
            logger.error("Error getting payment statistics", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }
}

// Export singleton instance
export const paymentService = new PaymentService(); 