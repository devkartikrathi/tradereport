import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { decryptToken } from "@/lib/services/encryption-service";
import { ZerodhaService } from "@/lib/services/zerodha-service";
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
      where: { clerkId: userId },
      include: { brokerConnections: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find Zerodha connection
    const zerodhaConnection = user.brokerConnections.find(
      (conn) => conn.broker === "zerodha"
    );

    if (!zerodhaConnection) {
      return NextResponse.json(
        { error: "Zerodha connection not found" },
        { status: 404 }
      );
    }

    // Decrypt access token
    const accessToken = await decryptToken(zerodhaConnection.encryptedAccessToken);

    // Initialize Zerodha service
    const zerodhaService = new ZerodhaService();

    // Check if token is still valid
    const isTokenValid = await zerodhaService.isTokenValid(accessToken);
    if (!isTokenValid) {
      return NextResponse.json(
        { error: "Zerodha session expired. Please reconnect your account." },
        { status: 401 }
      );
    }

    // Get last trading day's trades
    const lastTradingDate = zerodhaService.getLastTradingDate();
    const fromDate = new Date(lastTradingDate);
    fromDate.setDate(fromDate.getDate() - 1); // Previous day
    fromDate.setHours(9, 15, 0, 0); // Market open

    const trades = await zerodhaService.getTrades(accessToken, fromDate, lastTradingDate);

    logger.info("Fetched trades from Zerodha", {
      userId,
      tradeCount: trades.length,
      fromDate: fromDate.toISOString(),
      toDate: lastTradingDate.toISOString(),
    });

    return NextResponse.json({
      success: true,
      trades: trades,
      summary: {
        totalTrades: trades.length,
        fromDate: fromDate.toISOString(),
        toDate: lastTradingDate.toISOString(),
        fetchedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error("Error fetching trades from Zerodha", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { 
        error: "Failed to fetch trades from Zerodha",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 