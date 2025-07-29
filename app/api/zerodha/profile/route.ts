import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { KiteConnect } from "kiteconnect";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { decryptToken } from "@/lib/services/encryption-service";

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

        // Check if user has Zerodha connection
        const connection = await prisma.brokerConnection.findUnique({
            where: {
                userId_broker: {
                    userId: user.id,
                    broker: "zerodha"
                }
            }
        });

        if (!connection) {
            return NextResponse.json({ error: "No Zerodha connection found" }, { status: 404 });
        }

        const apiKey = process.env.ZERODHA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Zerodha API not configured" }, { status: 500 });
        }

        // Decrypt the access token
        const accessToken = await decryptToken(connection.encryptedAccessToken);

        // Create KiteConnect instance
        const kite = new KiteConnect({ api_key: apiKey });
        kite.setAccessToken(accessToken);

        // Get user profile
        const profile = await kite.getProfile();

        logger.info("Zerodha profile retrieved", { userId: user.id });

        return NextResponse.json(profile);
    } catch (error) {
        logger.error("Error fetching Zerodha profile", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
        });
        return NextResponse.json(
            { error: "Failed to fetch Zerodha profile" },
            { status: 500 }
        );
    }
} 