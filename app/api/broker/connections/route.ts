import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Ensure user exists in database
        const user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: {},
            create: {
                clerkId: userId,
                email: "",
                firstName: "",
                lastName: "",
            }
        });

        const connections = await prisma.brokerConnection.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" }
        });

        logger.info("Broker connections retrieved", { userId: user.id, count: connections.length });

        return NextResponse.json(connections);
    } catch (error) {
        logger.error("Error fetching broker connections", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
        });
        return NextResponse.json(
            { error: "Failed to fetch broker connections" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { broker } = body;

        if (!broker) {
            return NextResponse.json({ error: "Broker name is required" }, { status: 400 });
        }

        // Ensure user exists in database
        const user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: {},
            create: {
                clerkId: userId,
                email: "",
                firstName: "",
                lastName: "",
            }
        });

        // Check if connection already exists
        const existingConnection = await prisma.brokerConnection.findUnique({
            where: {
                userId_broker: {
                    userId: user.id,
                    broker
                }
            }
        });

        if (existingConnection) {
            return NextResponse.json({ error: "Connection already exists" }, { status: 409 });
        }

        const connection = await prisma.brokerConnection.create({
            data: {
                userId: user.id,
                broker,
                encryptedAccessToken: "", // Will be set during OAuth flow
            }
        });

        logger.info("Broker connection created", { userId: user.id, broker });

        return NextResponse.json(connection);
    } catch (error) {
        logger.error("Error creating broker connection", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
        });
        return NextResponse.json(
            { error: "Failed to create broker connection" },
            { status: 500 }
        );
    }
} 