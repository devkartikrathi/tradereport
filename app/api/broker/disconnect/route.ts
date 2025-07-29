import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brokerId } = await request.json();

    if (!brokerId) {
      return NextResponse.json(
        { error: "Broker ID is required" },
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

    // Find and delete the broker connection
    const connection = await prisma.brokerConnection.findFirst({
      where: {
        id: brokerId,
        userId: user.id,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Broker connection not found" },
        { status: 404 }
      );
    }

    // Delete the connection
    await prisma.brokerConnection.delete({
      where: {
        id: brokerId,
      },
    });

    logger.info("Broker connection disconnected", {
      userId: user.id,
      brokerId,
      broker: connection.broker,
    });

    return NextResponse.json({
      success: true,
      message: "Broker connection disconnected successfully",
      broker: connection.broker,
    });

  } catch (error) {
    logger.error("Broker disconnect error", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
    });

    return NextResponse.json(
      { error: "Failed to disconnect broker" },
      { status: 500 }
    );
  }
} 