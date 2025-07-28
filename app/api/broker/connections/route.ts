import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get user's broker connections
        const connections = await prisma.brokerConnection.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                broker: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        logger.info("Broker connections fetched successfully", {
            userId: user.id,
            connectionCount: connections.length
        });

        return NextResponse.json({
            connections: connections.map(conn => ({
                id: conn.id,
                broker: conn.broker,
                createdAt: conn.createdAt.toISOString(),
                updatedAt: conn.updatedAt.toISOString()
            }))
        });

    } catch (error) {
        logger.error("Error fetching broker connections", {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 