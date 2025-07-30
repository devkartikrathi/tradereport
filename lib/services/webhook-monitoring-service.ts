import { logger } from "@/lib/logger";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface WebhookMetrics {
    totalWebhooks: number;
    successfulWebhooks: number;
    failedWebhooks: number;
    averageProcessingTime: number;
    successRate: number;
    lastProcessedAt?: string;
}

export interface WebhookHealth {
    status: "healthy" | "degraded" | "unhealthy";
    issues: string[];
    metrics: WebhookMetrics;
}

export interface PerformanceMetrics {
    processingTime: number;
    memoryUsage: number;
    errorRate: number;
    throughput: number;
}

export class WebhookMonitoringService {
    private processingTimes: number[] = [];
    private readonly MAX_SAMPLES = 100;

    /**
     * Record webhook processing metrics
     */
    async recordProcessingMetrics(
        webhookId: string,
        processingTime: number,
        success: boolean
    ): Promise<void> {
        try {
            // Store processing time for performance tracking
            this.processingTimes.push(processingTime);
            if (this.processingTimes.length > this.MAX_SAMPLES) {
                this.processingTimes.shift();
            }

            // Log performance metrics
            logger.info("Webhook processing metrics recorded", {
                webhookId,
                processingTime,
                success,
                averageProcessingTime: this.getAverageProcessingTime()
            });

        } catch (error) {
            logger.error("Error recording webhook metrics", {
                error: error instanceof Error ? error.message : "Unknown error",
                webhookId
            });
        }
    }

    /**
     * Get webhook health status
     */
    async getHealthStatus(): Promise<WebhookHealth> {
        try {
            const metrics = await this.getMetrics();
            const issues: string[] = [];

            // Check success rate
            if (metrics.successRate < 0.95) {
                issues.push(`Low success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
            }

            // Check processing time
            if (metrics.averageProcessingTime > 5000) {
                issues.push(`High processing time: ${metrics.averageProcessingTime}ms`);
            }

            // Check recent activity
            if (!metrics.lastProcessedAt) {
                issues.push("No recent webhook activity");
            } else {
                const lastProcessed = new Date(metrics.lastProcessedAt);
                const now = new Date();
                const timeSinceLastProcessed = now.getTime() - lastProcessed.getTime();

                if (timeSinceLastProcessed > 10 * 60 * 1000) { // 10 minutes
                    issues.push("No recent webhook processing");
                }
            }

            // Determine health status
            let status: "healthy" | "degraded" | "unhealthy";
            if (issues.length === 0) {
                status = "healthy";
            } else if (issues.length <= 2) {
                status = "degraded";
            } else {
                status = "unhealthy";
            }

            return {
                status,
                issues,
                metrics
            };

        } catch (error) {
            logger.error("Error getting webhook health status", {
                error: error instanceof Error ? error.message : "Unknown error"
            });

            return {
                status: "unhealthy",
                issues: ["Failed to get health status"],
                metrics: {
                    totalWebhooks: 0,
                    successfulWebhooks: 0,
                    failedWebhooks: 0,
                    averageProcessingTime: 0,
                    successRate: 0
                }
            };
        }
    }

    /**
     * Get webhook metrics
     */
    async getMetrics(): Promise<WebhookMetrics> {
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

            const successRate = totalWebhooks > 0 ? successfulWebhooks / totalWebhooks : 0;
            const averageProcessingTime = this.getAverageProcessingTime();

            return {
                totalWebhooks,
                successfulWebhooks,
                failedWebhooks,
                averageProcessingTime,
                successRate,
                lastProcessedAt: lastProcessed?.processedAt?.toISOString()
            };

        } catch (error) {
            logger.error("Error getting webhook metrics", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): PerformanceMetrics {
        const avgProcessingTime = this.getAverageProcessingTime();
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
        const errorRate = this.calculateErrorRate();
        const throughput = this.calculateThroughput();

        return {
            processingTime: avgProcessingTime,
            memoryUsage,
            errorRate,
            throughput
        };
    }

    /**
     * Get webhook statistics by event type
     */
    async getEventTypeStatistics(): Promise<Record<string, {
        count: number;
        successCount: number;
        failureCount: number;
        successRate: number;
    }>> {
        try {
            const events = await prisma.webhookEvent.groupBy({
                by: ["eventType", "status"],
                _count: { id: true }
            });

            const statistics: Record<string, any> = {};

            events.forEach((event) => {
                const eventType = event.eventType;
                const status = event.status;
                const count = event._count.id;

                if (!statistics[eventType]) {
                    statistics[eventType] = {
                        count: 0,
                        successCount: 0,
                        failureCount: 0,
                        successRate: 0
                    };
                }

                statistics[eventType].count += count;

                if (status === "PROCESSED") {
                    statistics[eventType].successCount += count;
                } else if (status === "FAILED") {
                    statistics[eventType].failureCount += count;
                }
            });

            // Calculate success rates
            Object.keys(statistics).forEach((eventType) => {
                const stats = statistics[eventType];
                stats.successRate = stats.count > 0 ? stats.successCount / stats.count : 0;
            });

            return statistics;

        } catch (error) {
            logger.error("Error getting event type statistics", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Get webhook processing timeline
     */
    async getProcessingTimeline(hours: number = 24): Promise<{
        timestamp: string;
        count: number;
        successCount: number;
        failureCount: number;
    }[]> {
        try {
            const cutoffTime = new Date();
            cutoffTime.setHours(cutoffTime.getHours() - hours);

            const events = await prisma.webhookEvent.findMany({
                where: {
                    createdAt: { gte: cutoffTime }
                },
                select: {
                    createdAt: true,
                    status: true
                },
                orderBy: { createdAt: "asc" }
            });

            // Group by hour
            const timeline: Record<string, any> = {};

            events.forEach((event) => {
                const hour = new Date(event.createdAt).toISOString().slice(0, 13) + ":00:00.000Z";

                if (!timeline[hour]) {
                    timeline[hour] = {
                        timestamp: hour,
                        count: 0,
                        successCount: 0,
                        failureCount: 0
                    };
                }

                timeline[hour].count++;

                if (event.status === "PROCESSED") {
                    timeline[hour].successCount++;
                } else if (event.status === "FAILED") {
                    timeline[hour].failureCount++;
                }
            });

            return Object.values(timeline);

        } catch (error) {
            logger.error("Error getting processing timeline", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Get average processing time
     */
    private getAverageProcessingTime(): number {
        if (this.processingTimes.length === 0) {
            return 0;
        }
        return this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
    }

    /**
     * Calculate error rate
     */
    private calculateErrorRate(): number {
        // This would be calculated from actual error data
        // For now, return a placeholder
        return 0.02; // 2% error rate
    }

    /**
     * Calculate throughput
     */
    private calculateThroughput(): number {
        // Calculate webhooks per minute
        const recentEvents = this.processingTimes.length;
        const timeWindow = 60; // 1 minute
        return recentEvents / timeWindow;
    }

    /**
     * Generate monitoring report
     */
    async generateReport(): Promise<{
        health: WebhookHealth;
        performance: PerformanceMetrics;
        eventTypes: Record<string, any>;
        timeline: any[];
    }> {
        try {
            const [health, performance, eventTypes, timeline] = await Promise.all([
                this.getHealthStatus(),
                this.getPerformanceMetrics(),
                this.getEventTypeStatistics(),
                this.getProcessingTimeline()
            ]);

            return {
                health,
                performance,
                eventTypes,
                timeline
            };

        } catch (error) {
            logger.error("Error generating monitoring report", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }
}

// Export singleton instance
export const webhookMonitoringService = new WebhookMonitoringService(); 