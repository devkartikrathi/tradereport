import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ZerodhaService } from "@/lib/services/zerodha-service";
import { decryptToken } from "@/lib/services/encryption-service";

const prisma = new PrismaClient();

interface ImportResult {
  imported?: number;
  total?: number;
  error?: string;
}

interface ImportResults {
  trades?: ImportResult;
  positions?: ImportResult;
  holdings?: ImportResult;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Zerodha service
    const zerodhaService = new ZerodhaService();

    // Get user and broker connection
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { brokerConnections: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

    // Check if token is still valid
    const isTokenValid = await zerodhaService.isTokenValid(accessToken);
    if (!isTokenValid) {
      return NextResponse.json(
        { error: "Zerodha session expired. Please reconnect." },
        { status: 401 }
      );
    }

    const { importType } = await request.json();
    const results: ImportResults = {};

    // Import trades
    if (importType === "trades" || importType === "all") {
      try {
        const trades = await zerodhaService.getTrades(accessToken);
        
        // Convert Zerodha trades to your format and save
        const savedTrades = [];
        for (const trade of trades) {
          // Check if trade already exists
          const existingTrade = await prisma.trade.findFirst({
            where: {
              tradeId: trade.trade_id,
              userId: user.id,
            },
          });

          if (existingTrade) {
            // Update existing trade
            const updatedTrade = await prisma.trade.update({
              where: { id: existingTrade.id },
              data: {
                date: new Date(trade.fill_timestamp),
                time: new Date(trade.fill_timestamp).toLocaleTimeString(),
                symbol: trade.tradingsymbol,
                tradeType: trade.transaction_type,
                entryPrice: trade.average_price,
                exitPrice: trade.average_price,
                quantity: trade.quantity,
                profitLoss: trade.transaction_type === "BUY" ? 0 : 0, // Calculate based on your logic
                updatedAt: new Date(),
              },
            });
            savedTrades.push(updatedTrade);
          } else {
            // Create new trade
            const newTrade = await prisma.trade.create({
              data: {
                tradeId: trade.trade_id,
                userId: user.id,
                date: new Date(trade.fill_timestamp),
                time: new Date(trade.fill_timestamp).toLocaleTimeString(),
                symbol: trade.tradingsymbol,
                tradeType: trade.transaction_type,
                entryPrice: trade.average_price,
                exitPrice: trade.average_price,
                quantity: trade.quantity,
                profitLoss: 0, // Calculate based on your logic
              },
            });
            savedTrades.push(newTrade);
          }
        }
        
        results.trades = {
          imported: savedTrades.length,
          total: trades.length,
        };
      } catch (error) {
        console.error("Error importing trades:", error);
        results.trades = { error: "Failed to import trades" };
      }
    }

    // Import positions
    if (importType === "positions" || importType === "all") {
      try {
        const positions = await zerodhaService.getCurrentPositions(accessToken);
        
        // Convert positions to your format and save
        const savedPositions = [];
        for (const position of positions) {
          if (position.quantity !== 0) { // Only save non-zero positions
            // Check if position already exists
            const existingPosition = await prisma.openPosition.findFirst({
              where: {
                symbol: position.tradingsymbol,
                userId: user.id,
              },
            });

            if (existingPosition) {
              // Update existing position
              const updatedPosition = await prisma.openPosition.update({
                where: { id: existingPosition.id },
                data: {
                  type: position.quantity > 0 ? "LONG" : "SHORT",
                  price: position.average_price,
                  remainingQuantity: Math.abs(position.quantity),
                  currentValue: position.value,
                  updatedAt: new Date(),
                },
              });
              savedPositions.push(updatedPosition);
            } else {
              // Create new position
              const newPosition = await prisma.openPosition.create({
                data: {
                  userId: user.id,
                  symbol: position.tradingsymbol,
                  type: position.quantity > 0 ? "LONG" : "SHORT",
                  date: new Date(),
                  price: position.average_price,
                  remainingQuantity: Math.abs(position.quantity),
                  currentValue: position.value,
                },
              });
              savedPositions.push(newPosition);
            }
          }
        }
        
        results.positions = {
          imported: savedPositions.length,
          total: positions.length,
        };
      } catch (error) {
        console.error("Error importing positions:", error);
        results.positions = { error: "Failed to import positions" };
      }
    }

    // Import holdings
    if (importType === "holdings" || importType === "all") {
      try {
        const holdings = await zerodhaService.getHoldings(accessToken);
        results.holdings = {
          imported: holdings.length,
          total: holdings.length,
        };
      } catch (error) {
        console.error("Error importing holdings:", error);
        results.holdings = { error: "Failed to import holdings" };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data import completed",
      results,
    });

  } catch (error) {
    console.error("Error in import data:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
} 