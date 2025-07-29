import { KiteConnect } from "kiteconnect";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { decryptToken } from "./encryption-service";

export interface ZerodhaCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface ZerodhaSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  loginTime: string;
  userType: string;
  userName: string;
  email: string;
  broker: string;
  exchanges: string[];
  products: string[];
  orderTypes: string[];
  profile: Record<string, unknown>;
}

export class ZerodhaService {
  private apiKey: string;
  private apiSecret: string;
  private kite: KiteConnect;

  constructor(credentials?: ZerodhaCredentials) {
    this.apiKey = credentials?.apiKey || process.env.ZERODHA_API_KEY || '';
    this.apiSecret = credentials?.apiSecret || process.env.ZERODHA_API_SECRET || '';

    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Zerodha API credentials not configured');
    }

    this.kite = new KiteConnect({ api_key: this.apiKey });
  }

  /**
   * Generate login URL for Zerodha authentication
   */
  generateLoginUrl(): string {
    return this.kite.getLoginURL();
  }

  /**
   * Generate session from request token
   */
  async generateSession(requestToken: string): Promise<ZerodhaSession> {
    try {
      logger.info("Generating Zerodha session", { requestToken: requestToken.substring(0, 10) + "..." });

      const sessionData = await this.kite.generateSession(requestToken, this.apiSecret);

      // Set the access token for subsequent API calls
      this.kite.setAccessToken(sessionData.access_token);

      // Get user profile
      const profile = await this.kite.getProfile();

      const session: ZerodhaSession = {
        accessToken: sessionData.access_token,
        refreshToken: sessionData.refresh_token,
        userId: sessionData.user_id,
        loginTime: sessionData.login_time,
        userType: sessionData.user_type,
        userName: sessionData.user_name,
        email: profile.email,
        broker: profile.broker,
        exchanges: sessionData.exchanges || [],
        products: sessionData.products || [],
        orderTypes: sessionData.order_types || [],
        profile: profile
      };

      logger.info("Zerodha session generated successfully", {
        userId: session.userId,
        userName: session.userName,
        email: session.email
      });

      return session;
    } catch (error) {
      logger.error("Error generating Zerodha session", {
        error: error instanceof Error ? error.message : "Unknown error",
        requestToken: requestToken.substring(0, 10) + "..."
      });
      throw new Error(`Failed to generate Zerodha session: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get user profile from Zerodha
   */
  async getProfile(): Promise<Record<string, unknown>> {
    try {
      const profile = await this.kite.getProfile();
      logger.info("Zerodha profile retrieved", { userId: profile.user_id });
      return profile;
    } catch (error) {
      logger.error("Error getting Zerodha profile", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw new Error(`Failed to get Zerodha profile: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get user margins
   */
  async getMargins(): Promise<Record<string, unknown>> {
    try {
      const margins = await this.kite.getMargins();
      logger.info("Zerodha margins retrieved");
      return margins;
    } catch (error) {
      logger.error("Error getting Zerodha margins", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw new Error(`Failed to get Zerodha margins: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get portfolio positions
   */
  async getPositions(): Promise<Record<string, unknown>> {
    try {
      const positions = await this.kite.getPositions();
      logger.info("Zerodha positions retrieved", {
        netPositions: positions.net?.length || 0,
        dayPositions: positions.day?.length || 0
      });
      return positions;
    } catch (error) {
      logger.error("Error getting Zerodha positions", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw new Error(`Failed to get Zerodha positions: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get portfolio holdings
   */
  async getHoldings(): Promise<Record<string, unknown>[]> {
    try {
      const holdings = await this.kite.getHoldings();
      logger.info("Zerodha holdings retrieved", {
        holdingsCount: holdings.length
      });
      return holdings;
    } catch (error) {
      logger.error("Error getting Zerodha holdings", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw new Error(`Failed to get Zerodha holdings: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get orders
   */
  async getOrders(): Promise<Record<string, unknown>[]> {
    try {
      const orders = await this.kite.getOrders();
      logger.info("Zerodha orders retrieved", {
        ordersCount: orders.length
      });
      return orders;
    } catch (error) {
      logger.error("Error getting Zerodha orders", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw new Error(`Failed to get Zerodha orders: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get trades
   */
  async getTrades(): Promise<Record<string, unknown>[]> {
    try {
      const trades = await this.kite.getTrades();
      logger.info("Zerodha trades retrieved", {
        tradesCount: trades.length
      });
      return trades;
    } catch (error) {
      logger.error("Error getting Zerodha trades", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw new Error(`Failed to get Zerodha trades: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Save Zerodha connection to database
   */
  async saveConnection(userId: string, session: ZerodhaSession): Promise<void> {
    try {
      // Save or update broker connection
      await prisma.brokerConnection.upsert({
        where: {
          userId_broker: {
            userId,
            broker: "zerodha"
          }
        },
        update: {
          encryptedAccessToken: session.accessToken,
          updatedAt: new Date()
        },
        create: {
          userId,
          broker: "zerodha",
          encryptedAccessToken: session.accessToken,
        }
      });

      logger.info("Zerodha connection saved to database", { userId });
    } catch (error) {
      logger.error("Error saving Zerodha connection", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId
      });
      throw new Error(`Failed to save Zerodha connection: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get Zerodha connection from database
   */
  async getConnection(userId: string): Promise<ZerodhaSession | null> {
    try {
      const connection = await prisma.brokerConnection.findUnique({
        where: {
          userId_broker: {
            userId,
            broker: "zerodha"
          }
        }
      });

      if (!connection) {
        return null;
      }

      // Create new KiteConnect instance with stored token
      const kite = new KiteConnect({ api_key: this.apiKey });

      // Decrypt the access token before using it
      const decryptedToken = await decryptToken(connection.encryptedAccessToken);
      kite.setAccessToken(decryptedToken);

      // Get current profile to verify token is still valid
      const profile = await kite.getProfile();

      return {
        accessToken: decryptedToken,
        refreshToken: "", // Not stored for security
        userId: profile.user_id,
        loginTime: new Date().toISOString(),
        userType: profile.user_type,
        userName: profile.user_name,
        email: profile.email,
        broker: profile.broker,
        exchanges: [],
        products: [],
        orderTypes: [],
        profile: profile
      };
    } catch (error) {
      logger.error("Error getting Zerodha connection", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId
      });
      return null;
    }
  }

  /**
   * Remove Zerodha connection
   */
  async removeConnection(userId: string): Promise<void> {
    try {
      await prisma.brokerConnection.deleteMany({
        where: {
          userId,
          broker: "zerodha"
        }
      });

      logger.info("Zerodha connection removed", { userId });
    } catch (error) {
      logger.error("Error removing Zerodha connection", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId
      });
      throw new Error(`Failed to remove Zerodha connection: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Import trades from Zerodha
   */
  async importTrades(userId: string): Promise<Record<string, unknown>[]> {
    try {
      const connection = await this.getConnection(userId);
      if (!connection) {
        throw new Error("No Zerodha connection found");
      }

      // Set access token
      this.kite.setAccessToken(connection.accessToken);

      // Get trades
      const trades = await this.kite.getTrades();

      // Transform trades to our format
      const transformedTrades = trades.map((trade: Record<string, unknown>) => ({
        tradeId: trade.order_id,
        date: new Date(trade.trade_time as string),
        time: new Date(trade.trade_time as string).toTimeString().split(' ')[0],
        symbol: trade.tradingsymbol,
        tradeType: (trade.transaction_type as string).toUpperCase(),
        entryPrice: parseFloat(trade.average_price as string),
        exitPrice: parseFloat(trade.average_price as string),
        quantity: parseInt(trade.quantity as string),
        commission: parseFloat((trade.charges as string) || "0"),
        profitLoss: parseFloat((trade.pnl as string) || "0"),
        duration: 0, // Calculate if needed
        userId: userId
      }));

      logger.info("Zerodha trades imported", {
        userId,
        tradesCount: transformedTrades.length
      });

      return transformedTrades;
    } catch (error) {
      logger.error("Error importing Zerodha trades", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId
      });
      throw new Error(`Failed to import Zerodha trades: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Check if the access token is still valid
  async isTokenValid(accessToken: string): Promise<boolean> {
    try {
      const kite = new KiteConnect({ api_key: this.apiKey });
      kite.setAccessToken(accessToken);

      // Try to get profile - if it succeeds, token is valid
      await kite.getProfile();
      return true;
    } catch (error) {
      logger.warn("Zerodha token validation failed", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return false;
    }
  }
} 