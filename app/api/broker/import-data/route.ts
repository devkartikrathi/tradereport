import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ZerodhaService } from "@/lib/services/zerodha-service";
import { decryptToken } from "@/lib/services/encryption-service";
import { matchTrades, RawTrade } from "@/lib/trade-matcher";
import { logger } from "@/lib/logger";
import { KiteConnect } from "kiteconnect";

const prisma = new PrismaClient();

interface ImportResult {
  imported?: number;
  total?: number;
  error?: string;
}

interface ImportResults {
  trades?: ImportResult;
  matchedTrades?: ImportResult;
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

    const requestBody = await request.json();
    const { importType } = requestBody;

    // Default to importing trades if no importType is specified
    const shouldImportTrades = importType === "trades" || importType === "all" || !importType;

    const results: ImportResults = {};

    // Import trades
    if (shouldImportTrades) {
      try {
        // Get raw trades from Zerodha
        logger.info("Starting Zerodha API call", {
          userId: user.id,
          hasApiKey: !!process.env.ZERODHA_API_KEY,
          hasAccessToken: !!accessToken,
          accessTokenLength: accessToken.length
        });

        const kiteConnect = new KiteConnect({
          api_key: process.env.ZERODHA_API_KEY || ''
        });
        kiteConnect.setAccessToken(accessToken);

        // Get trades from Zerodha API
        logger.info("Calling Zerodha getTrades API", { userId: user.id });

        let rawZerodhaData: Record<string, unknown>[];
        try {
          rawZerodhaData = await kiteConnect.getTrades();

          logger.info("Zerodha getTrades API call successful", {
            userId: user.id,
            dataType: typeof rawZerodhaData,
            isArray: Array.isArray(rawZerodhaData),
            length: rawZerodhaData?.length || 0
          });
        } catch (apiError) {
          logger.error("Zerodha getTrades API call failed", {
            userId: user.id,
            error: apiError instanceof Error ? apiError.message : "Unknown error",
            stack: apiError instanceof Error ? apiError.stack : undefined
          });
          throw apiError;
        }

        logger.info("Zerodha getTrades API response received", {
          userId: user.id,
          responseType: typeof rawZerodhaData,
          isArray: Array.isArray(rawZerodhaData),
          dataLength: rawZerodhaData?.length || 0
        });

        logger.info("Raw Zerodha data fetched", {
          userId: user.id,
          totalTrades: rawZerodhaData.length,
          sampleTrade: rawZerodhaData.length > 0 ? rawZerodhaData[0] : null
        });

        logger.info("Raw Zerodha trades fetched", {
          userId: user.id,
          rawTradeCount: rawZerodhaData.length,
          firstFewTrades: rawZerodhaData.slice(0, 3)
        });

        // Check if no trades were returned
        if (!rawZerodhaData || rawZerodhaData.length === 0) {
          logger.warn("No trades returned from Zerodha API", {
            userId: user.id,
            rawDataExists: !!rawZerodhaData,
            rawDataType: typeof rawZerodhaData
          });

          results.trades = {
            imported: 0,
            total: 0,
            error: "No trades found in Zerodha account"
          };

          return NextResponse.json({
            success: true,
            message: "No trades found to import",
            results,
          });
        }

        // Convert Zerodha data to RawTrade format for matching
        const rawTrades: RawTrade[] = rawZerodhaData.map((trade: Record<string, unknown>) => {
          // Handle datetime objects from Zerodha API
          const timestamp = trade.fill_timestamp || trade.exchange_timestamp || trade.order_timestamp;
          let tradeDate: Date;

          if (timestamp instanceof Date) {
            tradeDate = timestamp;
          } else if (typeof timestamp === 'string') {
            tradeDate = new Date(timestamp);
          } else {
            tradeDate = new Date(); // fallback to current date
          }

          return {
            date: tradeDate.toISOString().split('T')[0],
            symbol: trade.tradingsymbol as string,
            type: trade.transaction_type as "BUY" | "SELL",
            quantity: typeof trade.quantity === 'number' ? trade.quantity : parseInt(trade.quantity as string),
            price: typeof trade.average_price === 'number' ? trade.average_price : parseFloat(trade.average_price as string),
            commission: 0, // Zerodha API doesn't return commission in trades endpoint
            time: tradeDate.toTimeString().split(' ')[0],
            tradeId: (trade.trade_id || trade.order_id) as string
          };
        });

        logger.info("Converted trades to standard format", {
          userId: user.id,
          rawTradesCount: rawTrades.length,
          sampleConvertedTrade: rawTrades.length > 0 ? rawTrades[0] : null
        });

        logger.info("Converted trades to standard format", {
          userId: user.id,
          convertedTradeCount: rawTrades.length,
          firstFewConverted: rawTrades.slice(0, 3)
        });

        // Use trade matching logic to match BUY/SELL pairs
        const matchingResult = matchTrades(rawTrades);



        logger.info("Trade matching completed", {
          userId: user.id,
          matchedTrades: matchingResult.matchedTrades.length,
          openPositions: matchingResult.openPositions.length,
          netProfit: matchingResult.netProfit,
          matchedTradesData: matchingResult.matchedTrades.slice(0, 2),
          openPositionsData: matchingResult.openPositions.slice(0, 2)
        });

        // Save individual trades first
        const savedTrades = [];
        for (const rawTrade of rawTrades) {
          try {
            // Check if trade already exists
            const existingTrade = await prisma.trade.findFirst({
              where: {
                tradeId: rawTrade.tradeId || "",
                userId: user.id,
              },
            });

            const tradeData = {
              date: new Date(rawTrade.date),
              time: rawTrade.time || "00:00:00",
              symbol: rawTrade.symbol,
              tradeType: rawTrade.type,
              entryPrice: rawTrade.price,
              exitPrice: rawTrade.price, // For individual executions, entry and exit are the same
              quantity: rawTrade.quantity,
              commission: rawTrade.commission || 0,
              profitLoss: 0, // Individual trades don't have profit/loss, only matched trades do
              updatedAt: new Date(),
            };

            if (existingTrade) {
              // Update existing trade
              const updatedTrade = await prisma.trade.update({
                where: { id: existingTrade.id },
                data: tradeData,
              });
              savedTrades.push(updatedTrade);
            } else {
              // Create new trade
              const newTrade = await prisma.trade.create({
                data: {
                  tradeId: rawTrade.tradeId || `${rawTrade.symbol}-${Date.now()}`,
                  userId: user.id,
                  ...tradeData,
                },
              });
              savedTrades.push(newTrade);
            }
          } catch (error) {
            logger.error("Error saving individual trade", {
              error: error instanceof Error ? error.message : "Unknown error",
              trade: rawTrade
            });
          }
        }

        // Save matched trades (these represent complete buy-sell pairs with actual profit/loss)
        const savedMatchedTrades = [];
        for (const matchedTrade of matchingResult.matchedTrades) {
          try {
            // Check if matched trade already exists
            const existingMatched = await prisma.matchedTrade.findFirst({
              where: {
                userId: user.id,
                symbol: matchedTrade.symbol,
                buyTradeId: matchedTrade.buyTradeId,
                sellTradeId: matchedTrade.sellTradeId,
              },
            });

            const matchedTradeData = {
              symbol: matchedTrade.symbol,
              buyDate: new Date(matchedTrade.buyDate),
              sellDate: new Date(matchedTrade.sellDate),
              buyTime: matchedTrade.buyTime,
              sellTime: matchedTrade.sellTime,
              quantity: matchedTrade.quantity,
              buyPrice: matchedTrade.buyPrice,
              sellPrice: matchedTrade.sellPrice,
              profit: matchedTrade.profit,
              commission: matchedTrade.commission,
              buyTradeId: matchedTrade.buyTradeId,
              sellTradeId: matchedTrade.sellTradeId,
              duration: matchedTrade.duration,
              updatedAt: new Date(),
            };

            if (existingMatched) {
              // Update existing matched trade
              const updated = await prisma.matchedTrade.update({
                where: { id: existingMatched.id },
                data: matchedTradeData,
              });
              savedMatchedTrades.push(updated);
            } else {
              // Create new matched trade
              const newMatched = await prisma.matchedTrade.create({
                data: {
                  userId: user.id,
                  ...matchedTradeData,
                },
              });
              savedMatchedTrades.push(newMatched);
            }
          } catch (error) {
            logger.error("Error saving matched trade", {
              error: error instanceof Error ? error.message : "Unknown error",
              matchedTrade
            });
          }
        }

        // Update open positions - only clear positions for symbols that are being updated
        const symbolsToUpdate = new Set([
          ...rawTrades.map(trade => trade.symbol),
          ...matchingResult.openPositions.map(pos => pos.symbol)
        ]);

        // Delete existing positions only for symbols being updated
        if (symbolsToUpdate.size > 0) {
          await prisma.openPosition.deleteMany({
            where: {
              userId: user.id,
              symbol: { in: Array.from(symbolsToUpdate) }
            }
          });
        }

        const savedPositions = [];
        for (const position of matchingResult.openPositions) {
          try {
            const newPosition = await prisma.openPosition.create({
              data: {
                userId: user.id,
                symbol: position.symbol,
                type: position.type === "BUY" ? "LONG" : "SHORT",
                date: new Date(position.date),
                time: position.time,
                price: position.price,
                remainingQuantity: position.remainingQuantity,
                commission: position.commission,
                tradeId: position.tradeId,
                currentValue: position.currentValue,
              },
            });
            savedPositions.push(newPosition);
          } catch (error) {
            logger.error("Error saving open position", {
              error: error instanceof Error ? error.message : "Unknown error",
              position
            });
          }
        }

        results.trades = {
          imported: savedTrades.length,
          total: rawTrades.length,
        };

        results.matchedTrades = {
          imported: savedMatchedTrades.length,
          total: matchingResult.matchedTrades.length,
        };

        results.positions = {
          imported: savedPositions.length,
          total: matchingResult.openPositions.length,
        };

        logger.info("Trade import completed successfully", {
          userId: user.id,
          results
        });



      } catch (error) {
        logger.error("Error importing trades", {
          error: error instanceof Error ? error.message : "Unknown error",
          userId: user.id
        });
        results.trades = { error: "Failed to import trades" };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data import completed",
      results,
    });

  } catch (error) {
    logger.error("Error in import data", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
} 