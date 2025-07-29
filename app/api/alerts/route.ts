import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const isRead = searchParams.get("isRead");
        const type = searchParams.get("type");
        const severity = searchParams.get("severity");
        const limit = parseInt(searchParams.get("limit") || "50");

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Build where clause
        const where: { userId: string; isRead?: boolean; type?: string; severity?: string } = { userId: user.id };

        if (isRead !== null) {
            where.isRead = isRead === "true";
        }

        if (type) {
            where.type = type;
        }

        if (severity) {
            where.severity = severity;
        }

        // Get alerts
        const alerts = await prisma.alert.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        return NextResponse.json(alerts);

    } catch (error) {
        logger.error("Alerts API error", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
        });

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { type, severity, title, message, metadata } = await request.json();

        // Validate input
        if (!type || !severity || !title || !message) {
            return NextResponse.json(
                { error: "Type, severity, title, and message are required" },
                { status: 400 }
            );
        }

        // Validate type
        const validTypes = [
            "daily_limit",
            "risk_threshold",
            "position_alert",
            "market_alert",
            "connection_alert",
        ];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: "Invalid alert type" },
                { status: 400 }
            );
        }

        // Validate severity
        const validSeverities = ["low", "medium", "high", "critical"];
        if (!validSeverities.includes(severity)) {
            return NextResponse.json(
                { error: "Invalid severity level" },
                { status: 400 }
            );
        }

        // Get or create user
        let user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: "",
                },
            });
        }

        // Create alert
        const alert = await prisma.alert.create({
            data: {
                userId: user.id,
                type,
                severity,
                title,
                message,
                metadata: metadata || {},
            },
        });

        logger.info("Alert created", {
            userId: user.id,
            alertId: alert.id,
            type: alert.type,
            severity: alert.severity,
        });

        return NextResponse.json(alert);

    } catch (error) {
        logger.error("Alert creation error", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
        });

        return NextResponse.json(
            { error: "Failed to create alert" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { alertId, isRead, isAcknowledged } = await request.json();

        if (!alertId) {
            return NextResponse.json(
                { error: "Alert ID is required" },
                { status: 400 }
            );
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Find and update alert
        const alert = await prisma.alert.findFirst({
            where: {
                id: alertId,
                userId: user.id,
            },
        });

        if (!alert) {
            return NextResponse.json(
                { error: "Alert not found" },
                { status: 404 }
            );
        }

        // Update alert
        const updatedAlert = await prisma.alert.update({
            where: { id: alertId },
            data: {
                isRead: isRead !== undefined ? isRead : alert.isRead,
                isAcknowledged: isAcknowledged !== undefined ? isAcknowledged : alert.isAcknowledged,
            },
        });

        logger.info("Alert updated", {
            userId: user.id,
            alertId: alert.id,
            isRead: updatedAlert.isRead,
            isAcknowledged: updatedAlert.isAcknowledged,
        });

        return NextResponse.json(updatedAlert);

    } catch (error) {
        logger.error("Alert update error", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
        });

        return NextResponse.json(
            { error: "Failed to update alert" },
            { status: 500 }
        );
    }
} 