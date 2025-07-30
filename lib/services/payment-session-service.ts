import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";
import crypto from "crypto";

const prisma = new PrismaClient();

export interface PaymentSession {
    sessionId: string;
    orderId: string;
    userId: string;
    planId: string;
    amount: number;
    currency: string;
    status: "active" | "expired" | "completed" | "cancelled";
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateSessionData {
    orderId: string;
    userId: string;
    planId: string;
    amount: number;
    currency?: string;
    timeoutMinutes?: number;
}

export class PaymentSessionService {
    private readonly DEFAULT_TIMEOUT_MINUTES = 30;

    /**
     * Create a new payment session
     */
    async createSession(data: CreateSessionData): Promise<PaymentSession> {
        try {
            const sessionId = this.generateSessionId();
            const expiresAt = new Date(Date.now() + (data.timeoutMinutes || this.DEFAULT_TIMEOUT_MINUTES) * 60 * 1000);

            // Store session in database (using metadata field of payment)
            const payment = await prisma.payment.findUnique({
                where: { orderId: data.orderId }
            });

            if (!payment) {
                throw new Error("Payment not found");
            }

            const sessionData = {
                sessionId,
                orderId: data.orderId,
                userId: data.userId,
                planId: data.planId,
                amount: data.amount,
                currency: data.currency || "INR",
                status: "active" as const,
                expiresAt,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Update payment with session data
            await prisma.payment.update({
                where: { orderId: data.orderId },
                data: {
                    metadata: {
                        ...(payment.metadata as Record<string, any>),
                        session: sessionData
                    }
                }
            });

            logger.info("Payment session created", {
                sessionId,
                orderId: data.orderId,
                expiresAt
            });

            return sessionData;
        } catch (error) {
            logger.error("Error creating payment session", {
                error: error instanceof Error ? error.message : "Unknown error",
                data
            });
            throw error;
        }
    }

    /**
     * Get session status
     */
    async getSessionStatus(sessionId: string): Promise<PaymentSession | null> {
        try {
            // Find payment with session data
            const payment = await prisma.payment.findFirst({
                where: {
                    metadata: {
                        path: ["session", "sessionId"],
                        equals: sessionId
                    }
                }
            });

            if (!payment) {
                return null;
            }

            const sessionData = (payment.metadata as any)?.session;
            if (!sessionData) {
                return null;
            }

            // Check if session is expired
            if (new Date() > new Date(sessionData.expiresAt)) {
                await this.updateSessionStatus(sessionId, "expired");
                sessionData.status = "expired";
            }

            return sessionData;
        } catch (error) {
            logger.error("Error getting session status", {
                error: error instanceof Error ? error.message : "Unknown error",
                sessionId
            });
            throw error;
        }
    }

    /**
     * Update session status
     */
    async updateSessionStatus(sessionId: string, status: PaymentSession["status"]): Promise<void> {
        try {
            // Find payment with session data
            const payment = await prisma.payment.findFirst({
                where: {
                    metadata: {
                        path: ["session", "sessionId"],
                        equals: sessionId
                    }
                }
            });

            if (!payment) {
                throw new Error("Session not found");
            }

            const sessionData = (payment.metadata as any)?.session;
            if (!sessionData) {
                throw new Error("Session data not found");
            }

            // Update session status
            sessionData.status = status;
            sessionData.updatedAt = new Date();

            // Update payment metadata
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    metadata: {
                        ...(payment.metadata as Record<string, any>),
                        session: sessionData
                    }
                }
            });

            logger.info("Payment session status updated", {
                sessionId,
                status
            });
        } catch (error) {
            logger.error("Error updating session status", {
                error: error instanceof Error ? error.message : "Unknown error",
                sessionId,
                status
            });
            throw error;
        }
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions(): Promise<number> {
        try {
            const now = new Date();
            let cleanedCount = 0;

            // Find all payments with active sessions
            const payments = await prisma.payment.findMany({
                where: {
                    status: "PENDING",
                    metadata: {
                        path: ["session", "status"],
                        equals: "active"
                    }
                }
            });

            for (const payment of payments) {
                const sessionData = (payment.metadata as any)?.session;
                if (sessionData && new Date(sessionData.expiresAt) < now) {
                    // Update session status to expired
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: "CANCELED",
                            metadata: {
                                ...(payment.metadata as Record<string, any>),
                                session: {
                                    ...sessionData,
                                    status: "expired",
                                    updatedAt: new Date()
                                }
                            }
                        }
                    });
                    cleanedCount++;
                }
            }

            logger.info("Expired payment sessions cleaned up", {
                cleanedCount
            });

            return cleanedCount;
        } catch (error) {
            logger.error("Error cleaning up expired sessions", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Validate session is active
     */
    async validateSession(sessionId: string): Promise<boolean> {
        try {
            const session = await this.getSessionStatus(sessionId);
            return session?.status === "active";
        } catch (error) {
            logger.error("Error validating session", {
                error: error instanceof Error ? error.message : "Unknown error",
                sessionId
            });
            return false;
        }
    }

    /**
     * Get session by order ID
     */
    async getSessionByOrderId(orderId: string): Promise<PaymentSession | null> {
        try {
            const payment = await prisma.payment.findUnique({
                where: { orderId }
            });

            if (!payment) {
                return null;
            }

            const sessionData = (payment.metadata as any)?.session;
            if (!sessionData) {
                return null;
            }

            // Check if session is expired
            if (new Date() > new Date(sessionData.expiresAt)) {
                await this.updateSessionStatus(sessionData.sessionId, "expired");
                sessionData.status = "expired";
            }

            return sessionData;
        } catch (error) {
            logger.error("Error getting session by order ID", {
                error: error instanceof Error ? error.message : "Unknown error",
                orderId
            });
            throw error;
        }
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        const timestamp = Date.now().toString();
        const random = crypto.randomBytes(8).toString("hex");
        return `SESS_${timestamp}_${random}`.toUpperCase();
    }
}

// Export singleton instance
export const paymentSessionService = new PaymentSessionService(); 