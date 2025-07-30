import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export interface WebhookAuthConfig {
    secret: string;
    allowedIPs?: string[];
    rateLimit?: {
        windowMs: number;
        maxRequests: number;
    };
}

export class WebhookAuthMiddleware {
    private readonly secret: string;
    private readonly allowedIPs: string[];
    private readonly rateLimit: { windowMs: number; maxRequests: number };
    private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

    constructor(config: WebhookAuthConfig) {
        this.secret = config.secret;
        this.allowedIPs = config.allowedIPs || [];
        this.rateLimit = config.rateLimit || { windowMs: 60000, maxRequests: 100 };
    }

    /**
     * Authenticate webhook request
     */
    authenticate(request: NextRequest): { isValid: boolean; error?: string } {
        try {
            // Check IP whitelist
            if (this.allowedIPs.length > 0) {
                const clientIP = this.getClientIP(request);
                if (!this.allowedIPs.includes(clientIP)) {
                    logger.warn("Webhook request from unauthorized IP", { ip: clientIP });
                    return { isValid: false, error: "Unauthorized IP" };
                }
            }

            // Check rate limiting
            const rateLimitResult = this.checkRateLimit(request);
            if (!rateLimitResult.isValid) {
                return rateLimitResult;
            }

            // Validate required headers
            const signature = request.headers.get("x-phonepe-signature");
            const timestamp = request.headers.get("x-phonepe-timestamp");

            if (!signature) {
                return { isValid: false, error: "Missing signature" };
            }

            if (!timestamp) {
                return { isValid: false, error: "Missing timestamp" };
            }

            // Validate timestamp (prevent replay attacks)
            const timestampAge = Date.now() - parseInt(timestamp);
            const maxAge = 5 * 60 * 1000; // 5 minutes
            if (timestampAge > maxAge) {
                return { isValid: false, error: "Timestamp too old" };
            }

            return { isValid: true };

        } catch (error) {
            logger.error("Error in webhook authentication", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            return { isValid: false, error: "Authentication failed" };
        }
    }

    /**
     * Check rate limiting
     */
    private checkRateLimit(request: NextRequest): { isValid: boolean; error?: string } {
        const clientIP = this.getClientIP(request);
        const now = Date.now();
        const windowStart = now - this.rateLimit.windowMs;

        // Get current request count for this IP
        const current = this.requestCounts.get(clientIP);

        if (!current || current.resetTime < windowStart) {
            // Reset counter for new window
            this.requestCounts.set(clientIP, { count: 1, resetTime: now });
        } else if (current.count >= this.rateLimit.maxRequests) {
            // Rate limit exceeded
            logger.warn("Webhook rate limit exceeded", { ip: clientIP });
            return { isValid: false, error: "Rate limit exceeded" };
        } else {
            // Increment counter
            current.count++;
        }

        return { isValid: true };
    }

    /**
     * Get client IP address
     */
    private getClientIP(request: NextRequest): string {
        const forwarded = request.headers.get("x-forwarded-for");
        const realIP = request.headers.get("x-real-ip");

        if (forwarded) {
            return forwarded.split(",")[0].trim();
        }

        if (realIP) {
            return realIP;
        }

        return "unknown";
    }

    /**
     * Generate webhook signature
     */
    generateSignature(payload: string): string {
        const hmac = crypto.createHmac("sha256", this.secret);
        hmac.update(payload);
        return hmac.digest("hex");
    }

    /**
     * Verify webhook signature
     */
    verifySignature(signature: string, payload: string): boolean {
        const expectedSignature = this.generateSignature(payload);
        return crypto.timingSafeEqual(
            Buffer.from(signature, "hex"),
            Buffer.from(expectedSignature, "hex")
        );
    }

    /**
     * Clean up old rate limit entries
     */
    cleanup(): void {
        const now = Date.now();
        const windowStart = now - this.rateLimit.windowMs;

        for (const [ip, data] of this.requestCounts.entries()) {
            if (data.resetTime < windowStart) {
                this.requestCounts.delete(ip);
            }
        }
    }
}

// Create middleware instance with configuration
export const webhookAuth = new WebhookAuthMiddleware({
    secret: process.env.WEBHOOK_SECRET || "default-secret",
    allowedIPs: process.env.WEBHOOK_ALLOWED_IPS?.split(",") || [],
    rateLimit: {
        windowMs: 60000, // 1 minute
        maxRequests: 100 // 100 requests per minute
    }
});

// Cleanup old entries every 5 minutes
setInterval(() => {
    webhookAuth.cleanup();
}, 5 * 60 * 1000); 