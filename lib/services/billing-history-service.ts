import { PrismaClient, Payment, PaymentStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

export interface BillingHistoryFilters {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
}

export interface BillingHistoryResult {
    records: Payment[];
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface BillingSummary {
    totalAmount: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    averageAmount: number;
}

export class BillingHistoryService {
    /**
     * Get billing history for user
     */
    async getBillingHistory(
        userId: string,
        filters: BillingHistoryFilters = {}
    ): Promise<BillingHistoryResult> {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                startDate,
                endDate
            } = filters;

            // Build where clause
            const where: any = { userId };

            if (status) {
                where.status = status;
            }

            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate);
                }
            }

            // Get total count
            const totalRecords = await prisma.payment.count({ where });

            // Calculate pagination
            const totalPages = Math.ceil(totalRecords / limit);
            const skip = (page - 1) * limit;

            // Get payments with pagination
            const records = await prisma.payment.findMany({
                where,
                include: {
                    plan: true,
                    subscription: true
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit
            });

            const hasNext = page < totalPages;
            const hasPrev = page > 1;

            logger.info("Billing history retrieved", {
                userId,
                totalRecords,
                page,
                limit
            });

            return {
                records,
                page,
                limit,
                totalRecords,
                totalPages,
                hasNext,
                hasPrev
            };

        } catch (error) {
            logger.error("Error getting billing history", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }

    /**
     * Get billing summary for user
     */
    async getBillingSummary(userId: string): Promise<BillingSummary> {
        try {
            const [totalAmount, totalPayments, successfulPayments, failedPayments] = await Promise.all([
                prisma.payment.aggregate({
                    where: { userId },
                    _sum: { amount: true }
                }),
                prisma.payment.count({ where: { userId } }),
                prisma.payment.count({
                    where: {
                        userId,
                        status: PaymentStatus.SUCCEEDED
                    }
                }),
                prisma.payment.count({
                    where: {
                        userId,
                        status: PaymentStatus.FAILED
                    }
                })
            ]);

            const total = totalAmount._sum.amount || 0;
            const averageAmount = totalPayments > 0 ? total / totalPayments : 0;

            return {
                totalAmount: total,
                totalPayments,
                successfulPayments,
                failedPayments,
                averageAmount
            };

        } catch (error) {
            logger.error("Error getting billing summary", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }

    /**
     * Get payment details
     */
    async getPaymentDetails(paymentId: string, userId: string): Promise<Payment | null> {
        try {
            const payment = await prisma.payment.findFirst({
                where: {
                    id: paymentId,
                    userId
                },
                include: {
                    plan: true,
                    subscription: true
                }
            });

            return payment;

        } catch (error) {
            logger.error("Error getting payment details", {
                error: error instanceof Error ? error.message : "Unknown error",
                paymentId,
                userId
            });
            throw error;
        }
    }

    /**
     * Get recent payments
     */
    async getRecentPayments(userId: string, limit: number = 5): Promise<Payment[]> {
        try {
            const payments = await prisma.payment.findMany({
                where: { userId },
                include: {
                    plan: true
                },
                orderBy: { createdAt: "desc" },
                take: limit
            });

            return payments;

        } catch (error) {
            logger.error("Error getting recent payments", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }

    /**
     * Get payment statistics by status
     */
    async getPaymentStatistics(userId: string): Promise<{
        pending: number;
        succeeded: number;
        failed: number;
        canceled: number;
    }> {
        try {
            const [pending, succeeded, failed, canceled] = await Promise.all([
                prisma.payment.count({
                    where: {
                        userId,
                        status: PaymentStatus.PENDING
                    }
                }),
                prisma.payment.count({
                    where: {
                        userId,
                        status: PaymentStatus.SUCCEEDED
                    }
                }),
                prisma.payment.count({
                    where: {
                        userId,
                        status: PaymentStatus.FAILED
                    }
                }),
                prisma.payment.count({
                    where: {
                        userId,
                        status: PaymentStatus.CANCELED
                    }
                })
            ]);

            return {
                pending,
                succeeded,
                failed,
                canceled
            };

        } catch (error) {
            logger.error("Error getting payment statistics", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId
            });
            throw error;
        }
    }

    /**
     * Get billing history by date range
     */
    async getBillingHistoryByDateRange(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<Payment[]> {
        try {
            const payments = await prisma.payment.findMany({
                where: {
                    userId,
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    plan: true
                },
                orderBy: { createdAt: "desc" }
            });

            return payments;

        } catch (error) {
            logger.error("Error getting billing history by date range", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                startDate,
                endDate
            });
            throw error;
        }
    }

    /**
     * Export billing history
     */
    async exportBillingHistory(
        userId: string,
        format: "csv" | "json" = "csv"
    ): Promise<string> {
        try {
            const payments = await prisma.payment.findMany({
                where: { userId },
                include: {
                    plan: true
                },
                orderBy: { createdAt: "desc" }
            });

            if (format === "json") {
                return JSON.stringify(payments, null, 2);
            }

            // CSV format
            const headers = [
                "Payment ID",
                "Order ID",
                "Amount",
                "Currency",
                "Status",
                "Plan",
                "Created At",
                "Updated At"
            ];

            const rows = payments.map(payment => [
                payment.id,
                payment.orderId,
                payment.amount,
                payment.currency,
                payment.status,
                payment.plan?.name || "",
                payment.createdAt.toISOString(),
                payment.updatedAt.toISOString()
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.join(","))
            ].join("\n");

            return csvContent;

        } catch (error) {
            logger.error("Error exporting billing history", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
                format
            });
            throw error;
        }
    }
}

// Export singleton instance
export const billingHistoryService = new BillingHistoryService(); 