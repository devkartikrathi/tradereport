import { logger } from "@/lib/logger";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface WebhookError {
    id: string;
    eventType: string;
    error: string;
    retryCount: number;
    lastRetryAt?: Date;
    nextRetryAt?: Date;
}

export interface ErrorHandlingResult {
    success: boolean;
    shouldRetry: boolean;
    retryDelay?: number;
    error?: string;
}

export class WebhookErrorHandler {
    private readonly MAX_RETRY_COUNT = 3;
    private readonly RETRY_DELAYS = [5000, 30000, 300000]; // 5s, 30s, 5m

    /**
     * Handle webhook processing error
     */
    async handleError(
        webhookId: string,
        error: Error,
        context: Record<string, any> = {}
    ): Promise<ErrorHandlingResult> {
        try {
            // Get webhook event
            const webhookEvent = await prisma.webhookEvent.findUnique({
                where: { id: webhookId }
            });

            if (!webhookEvent) {
                logger.error("Webhook event not found for error handling", { webhookId });
                return {
                    success: false,
                    shouldRetry: false,
                    error: "Webhook event not found"
                };
            }

            // Update webhook event with error
            await prisma.webhookEvent.update({
                where: { id: webhookId },
                data: {
                    status: "FAILED",
                    errorMessage: error.message,
                    retryCount: { increment: 1 }
                }
            });

            // Determine if we should retry
            const shouldRetry = webhookEvent.retryCount < this.MAX_RETRY_COUNT;
            const retryDelay = shouldRetry ? this.getRetryDelay(webhookEvent.retryCount) : undefined;

            // Log error with context
            logger.error("Webhook processing error", {
                webhookId,
                eventType: webhookEvent.eventType,
                error: error.message,
                retryCount: webhookEvent.retryCount + 1,
                shouldRetry,
                context
            });

            // Send alert if max retries exceeded
            if (!shouldRetry) {
                await this.sendAlert(webhookEvent, error);
            }

            return {
                success: false,
                shouldRetry,
                retryDelay,
                error: error.message
            };

        } catch (handlerError) {
            logger.error("Error in webhook error handler", {
                error: handlerError instanceof Error ? handlerError.message : "Unknown error",
                webhookId
            });

            return {
                success: false,
                shouldRetry: false,
                error: "Error handler failed"
            };
        }
    }

    /**
     * Retry failed webhook
     */
    async retryWebhook(webhookId: string): Promise<ErrorHandlingResult> {
        try {
            const webhookEvent = await prisma.webhookEvent.findUnique({
                where: { id: webhookId }
            });

            if (!webhookEvent) {
                return {
                    success: false,
                    shouldRetry: false,
                    error: "Webhook event not found"
                };
            }

            if (webhookEvent.retryCount >= this.MAX_RETRY_COUNT) {
                return {
                    success: false,
                    shouldRetry: false,
                    error: "Max retry count exceeded"
                };
            }

            // Update retry timestamp
            await prisma.webhookEvent.update({
                where: { id: webhookId },
                data: {
                    lastRetryAt: new Date(),
                    status: "PENDING"
                }
            });

            logger.info("Webhook retry initiated", {
                webhookId,
                eventType: webhookEvent.eventType,
                retryCount: webhookEvent.retryCount + 1
            });

            return {
                success: true,
                shouldRetry: true
            };

        } catch (error) {
            logger.error("Error retrying webhook", {
                error: error instanceof Error ? error.message : "Unknown error",
                webhookId
            });

            return {
                success: false,
                shouldRetry: false,
                error: "Retry failed"
            };
        }
    }

    /**
     * Get retry delay for attempt number
     */
    private getRetryDelay(attemptNumber: number): number {
        const index = Math.min(attemptNumber, this.RETRY_DELAYS.length - 1);
        return this.RETRY_DELAYS[index];
    }

    /**
     * Send alert for failed webhook
     */
    private async sendAlert(webhookEvent: any, error: Error): Promise<void> {
        try {
            // Log critical alert
            logger.error("CRITICAL: Webhook max retries exceeded", {
                webhookId: webhookEvent.id,
                eventType: webhookEvent.eventType,
                error: error.message,
                retryCount: webhookEvent.retryCount
            });

            // TODO: Send notification to admin team
            // This could be email, Slack, or other notification system
            console.error("ALERT: Webhook processing failed permanently", {
                webhookId: webhookEvent.id,
                eventType: webhookEvent.eventType,
                error: error.message
            });

        } catch (alertError) {
            logger.error("Error sending webhook alert", {
                error: alertError instanceof Error ? alertError.message : "Unknown error"
            });
        }
    }

    /**
     * Get webhook error statistics
     */
    async getErrorStatistics(): Promise<{
        totalErrors: number;
        retryableErrors: number;
        permanentErrors: number;
        averageRetryCount: number;
    }> {
        try {
            const [totalErrors, retryableErrors, permanentErrors, avgRetryCount] = await Promise.all([
                prisma.webhookEvent.count({ where: { status: "FAILED" } }),
                prisma.webhookEvent.count({
                    where: {
                        status: "FAILED",
                        retryCount: { lt: this.MAX_RETRY_COUNT }
                    }
                }),
                prisma.webhookEvent.count({
                    where: {
                        status: "FAILED",
                        retryCount: { gte: this.MAX_RETRY_COUNT }
                    }
                }),
                prisma.webhookEvent.aggregate({
                    where: { status: "FAILED" },
                    _avg: { retryCount: true }
                })
            ]);

            return {
                totalErrors,
                retryableErrors,
                permanentErrors,
                averageRetryCount: avgRetryCount._avg.retryCount || 0
            };

        } catch (error) {
            logger.error("Error getting webhook error statistics", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Clean up old error records
     */
    async cleanupOldErrors(daysOld: number = 30): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await prisma.webhookEvent.deleteMany({
                where: {
                    status: "FAILED",
                    createdAt: { lt: cutoffDate }
                }
            });

            logger.info("Cleaned up old webhook errors", {
                deletedCount: result.count,
                cutoffDate
            });

            return result.count;

        } catch (error) {
            logger.error("Error cleaning up old webhook errors", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }
}

// Export singleton instance
export const webhookErrorHandler = new WebhookErrorHandler(); 