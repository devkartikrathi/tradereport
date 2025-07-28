import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
    const startTime = Date.now();
    const healthChecks = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || "1.0.0",
        checks: {
            database: "unknown",
            memory: "unknown",
            api: "unknown",
        },
        metrics: {
            responseTime: 0,
            memoryUsage: 0,
            databaseConnections: 0,
        },
        errors: [] as string[],
    };

    try {
        // Check database connection
        try {
            await prisma.$queryRaw`SELECT 1`;
            healthChecks.checks.database = "healthy";
            healthChecks.metrics.databaseConnections = 1;
        } catch (error) {
            healthChecks.checks.database = "unhealthy";
            healthChecks.errors.push(`Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            healthChecks.status = "degraded";
        }

        // Check memory usage
        try {
            const memUsage = process.memoryUsage();
            healthChecks.metrics.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB

            // Consider memory usage healthy if under 500MB
            if (healthChecks.metrics.memoryUsage < 500) {
                healthChecks.checks.memory = "healthy";
            } else {
                healthChecks.checks.memory = "warning";
                healthChecks.errors.push(`High memory usage: ${healthChecks.metrics.memoryUsage}MB`);
            }
        } catch (error) {
            healthChecks.checks.memory = "unknown";
            healthChecks.errors.push(`Memory check failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }

        // Check API responsiveness
        try {
            const apiStartTime = Date.now();
            // Simulate a simple API call
            await new Promise(resolve => setTimeout(resolve, 10));
            const apiResponseTime = Date.now() - apiStartTime;
            healthChecks.metrics.responseTime = apiResponseTime;

            if (apiResponseTime < 100) {
                healthChecks.checks.api = "healthy";
            } else {
                healthChecks.checks.api = "warning";
                healthChecks.errors.push(`Slow API response: ${apiResponseTime}ms`);
            }
        } catch (error) {
            healthChecks.checks.api = "unhealthy";
            healthChecks.errors.push(`API check failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            healthChecks.status = "degraded";
        }

        // Calculate overall response time
        healthChecks.metrics.responseTime = Date.now() - startTime;

        // Determine overall status
        const allHealthy = Object.values(healthChecks.checks).every(check => check === "healthy");
        const anyUnhealthy = Object.values(healthChecks.checks).some(check => check === "unhealthy");

        if (anyUnhealthy) {
            healthChecks.status = "unhealthy";
        } else if (!allHealthy) {
            healthChecks.status = "degraded";
        }

        // Log health check results
        logger.info("Health check completed", {
            status: healthChecks.status,
            responseTime: healthChecks.metrics.responseTime,
            checks: healthChecks.checks,
            errors: healthChecks.errors.length,
        });

        // Return appropriate HTTP status code
        const statusCode = healthChecks.status === "healthy" ? 200 :
            healthChecks.status === "degraded" ? 200 : 503;

        return NextResponse.json(healthChecks, { status: statusCode });

    } catch (error) {
        logger.error("Health check failed", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });

        healthChecks.status = "unhealthy";
        healthChecks.errors.push(`Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        healthChecks.metrics.responseTime = Date.now() - startTime;

        return NextResponse.json(healthChecks, { status: 503 });
    }
}

// Detailed health check for debugging
export async function POST(request: NextRequest) {
    const { detailed = false } = await request.json().catch(() => ({}));

    const healthCheck = await GET();
    const data = await healthCheck.json();

    if (detailed) {
        // Add additional detailed information
        const detailedData = {
            ...data,
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                arch: process.arch,
                pid: process.pid,
                title: process.title,
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                appUrl: process.env.NEXT_PUBLIC_APP_URL,
                hasDatabase: !!process.env.DATABASE_URL,
                hasClerk: !!process.env.CLERK_SECRET_KEY,
                hasGoogleAI: !!process.env.GOOGLE_API_KEY,
            },
            performance: {
                heapUsed: process.memoryUsage().heapUsed,
                heapTotal: process.memoryUsage().heapTotal,
                external: process.memoryUsage().external,
                rss: process.memoryUsage().rss,
            },
        };

        return NextResponse.json(detailedData, { status: healthCheck.status });
    }

    return healthCheck;
} 