import { PrismaClient, Payment, PaymentStatus } from "@prisma/client";
import { logger } from "@/lib/logger";
import crypto from "crypto";
import { subscriptionService } from "./subscription-service";

const prisma = new PrismaClient();

export interface WebhookPayload {
    merchantId: string;
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    status: string;
    responseCode: string;
    responseMessage: string;
    paymentInstrument?: {
        type: string;
        utr?: string;
    };
    checksum?: string;
}

export interface WebhookRequest {
    payload: WebhookPayload;
    signature: string;
    timestamp: string;
    rawBody: string;
}

export interface WebhookResult {
    success: boolean;
    error?: string;
    payment?: Payment;
}

export interface HealthStatus {
    totalWebhooks: number;
    successfulWebhooks: number;
    failedWebhooks: number;
    lastProcessedAt?: string;
}

export class WebhookService {
    private readonly PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || "";
    private readonly PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
    private readonly WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

    /**
     * Process PhonePe webhook
     */
    async processWebhook(request: WebhookRequest): Promise<WebhookResult> {
        try {
            // Validate webhook signature
            if (!this.validateWebhookSignature(request.signature, request.rawBody)) {
                logger.warn("Invalid webhook signature", {
                    transactionId: request.payload.merchantTransactionId
                });
                return {
                    success: false,
                    error: "Invalid signature"
                };
            }

            // Store webhook event
            const webhookEvent = await this.storeWebhookEvent(request);

            // Process payment status
            const payment = await this.processPaymentStatus(request.payload);

            if (!payment) {
                await this.updateWebhookEventStatus(webhookEvent.id, "FAILED", "Payment not found");
                return {
                    success: false,
                    error: "Payment not found"
                };
            }

            // Update webhook event status
            await this.updateWebhookEventStatus(webhookEvent.id, "PROCESSED");

            logger.info("Webhook processed successfully", {
                transactionId: request.payload.merchantTransactionId,
                status: request.payload.status,
                paymentId: payment.id
            });

            return {
                success: true,
                payment
            };

        } catch (error) {
            logger.error("Error processing webhook", {
                error: error instanceof Error ? error.message : "Unknown error",
                transactionId: request.payload.merchantTransactionId
            });

            return {
                success: false,
                error: "Webhook processing failed"
            };
        }
    }

    /**
     * Validate webhook signature
     */
    private validateWebhookSignature(signature: string, payload: string): boolean {
        try {
            // PhonePe signature validation
            const expectedSignature = this.generatePhonePeSignature(payload);
            return signature === expectedSignature;
        } catch (error) {
            logger.error("Error validating webhook signature", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            return false;
        }
    }

    /**
     * Generate PhonePe signature
     */
    private generatePhonePeSignature(payload: string): string {
        const base64Payload = Buffer.from(payload).toString("base64");
        const stringToHash = `${base64Payload}/pg/v1/webhook${this.PHONEPE_SALT_KEY}`;
        const sha256Hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
        return `${sha256Hash}###${this.PHONEPE_SALT_INDEX}`;
    }

    /**
     * Store webhook event
     */
    private async storeWebhookEvent(request: WebhookRequest) {
        try {
            const webhookEvent = await prisma.webhookEvent.create({
                data: {
                    eventType: `payment.${request.payload.status.toLowerCase()}`,
                    payload: request.payload as any,
                    signature: request.signature,
                    status: "PENDING"
                }
            });

            logger.info("Webhook event stored", {
                eventId: webhookEvent.id,
                eventType: webhookEvent.eventType
            });

            return webhookEvent;
        } catch (error) {
            logger.error("Error storing webhook event", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Update webhook event status
     */
    private async updateWebhookEventStatus(eventId: string, status: string, errorMessage?: string) {
        try {
            await prisma.webhookEvent.update({
                where: { id: eventId },
                data: {
                    status,
                    processedAt: status === "PROCESSED" ? new Date() : undefined,
                    errorMessage,
                    retryCount: status === "FAILED" ? { increment: 1 } : undefined
                }
            });
        } catch (error) {
            logger.error("Error updating webhook event status", {
                error: error instanceof Error ? error.message : "Unknown error",
                eventId
            });
        }
    }

    /**
     * Process payment status
     */
    private async processPaymentStatus(payload: WebhookPayload): Promise<Payment | null> {
        try {
            // Find payment by PhonePe transaction ID
            const payment = await prisma.payment.findUnique({
                where: { phonePeTransactionId: payload.merchantTransactionId }
            });

            if (!payment) {
                logger.warn("Payment not found for webhook", {
                    transactionId: payload.merchantTransactionId
                });
                return null;
            }

            // Determine new payment status
            let newStatus: PaymentStatus;
            switch (payload.status) {
                case "PAYMENT_SUCCESS":
                    newStatus = PaymentStatus.SUCCEEDED;
                    break;
                case "PAYMENT_ERROR":
                    newStatus = PaymentStatus.FAILED;
                    break;
                case "PAYMENT_DECLINED":
                    newStatus = PaymentStatus.FAILED;
                    break;
                default:
                    newStatus = PaymentStatus.FAILED;
            }

            // Update payment status
            const updatedPayment = await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: newStatus,
                    transactionId: payload.transactionId,
                    metadata: {
                        ...(payment.metadata as Record<string, any>),
                        webhookData: payload,
                        processedAt: new Date().toISOString()
                    }
                }
            });

            // If payment is successful, activate subscription
            if (newStatus === PaymentStatus.SUCCEEDED) {
                await this.activateSubscription(updatedPayment);
            }

            logger.info("Payment status updated", {
                paymentId: payment.id,
                oldStatus: payment.status,
                newStatus,
                transactionId: payload.transactionId
            });

            return updatedPayment;

        } catch (error) {
            logger.error("Error processing payment status", {
                error: error instanceof Error ? error.message : "Unknown error",
                transactionId: payload.merchantTransactionId
            });
            throw error;
        }
    }

    /**
     * Activate subscription
     */
    private async activateSubscription(payment: Payment): Promise<void> {
        try {
            await subscriptionService.activateSubscription(payment.userId, payment.planId, payment.id);

            logger.info("Subscription activated", {
                userId: payment.userId,
                planId: payment.planId,
                paymentId: payment.id
            });
        } catch (error) {
            logger.error("Error activating subscription", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId: payment.userId,
                planId: payment.planId
            });
            throw error;
        }
    }

    /**
     * Get webhook health status
     */
    async getHealthStatus(): Promise<HealthStatus> {
        try {
            const [totalWebhooks, successfulWebhooks, failedWebhooks, lastProcessed] = await Promise.all([
                prisma.webhookEvent.count(),
                prisma.webhookEvent.count({ where: { status: "PROCESSED" } }),
                prisma.webhookEvent.count({ where: { status: "FAILED" } }),
                prisma.webhookEvent.findFirst({
                    where: { status: "PROCESSED" },
                    orderBy: { processedAt: "desc" },
                    select: { processedAt: true }
                })
            ]);

            return {
                totalWebhooks,
                successfulWebhooks,
                failedWebhooks,
                lastProcessedAt: lastProcessed?.processedAt?.toISOString()
            };
        } catch (error) {
            logger.error("Error getting webhook health status", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Retry failed webhook processing
     */
    async retryFailedWebhooks(): Promise<number> {
        try {
            const failedWebhooks = await prisma.webhookEvent.findMany({
                where: {
                    status: "FAILED",
                    retryCount: { lt: 3 }
                }
            });

            let retryCount = 0;
            for (const webhook of failedWebhooks) {
                try {
                    // Re-process webhook
                    const result = await this.processWebhook({
                        payload: webhook.payload as WebhookPayload,
                        signature: webhook.signature,
                        timestamp: new Date().toISOString(),
                        rawBody: JSON.stringify(webhook.payload)
                    });

                    if (result.success) {
                        retryCount++;
                    }
                } catch (error) {
                    logger.error("Error retrying webhook", {
                        error: error instanceof Error ? error.message : "Unknown error",
                        webhookId: webhook.id
                    });
                }
            }

            logger.info("Webhook retry completed", { retryCount });
            return retryCount;

        } catch (error) {
            logger.error("Error retrying failed webhooks", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }
}

// Export singleton instance
export const webhookService = new WebhookService(); 