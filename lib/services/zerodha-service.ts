import { KiteConnect } from "kiteconnect";

export interface Trade {
  trade_id: string;
  order_id: string;
  exchange_order_id: string | null;
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  transaction_type: string;
  product: string;
  average_price: number;
  filled: number;
  quantity: number;
  fill_timestamp: Date;
  order_timestamp: Date;
  exchange_timestamp: Date;
}

export interface Position {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  product: string;
  quantity: number;
  overnight_quantity: number;
  multiplier: number;
  average_price: number;
  close_price: number;
  last_price: number;
  value: number;
  pnl: number;
  m2m: number;
  unrealised: number;
  realised: number;
  buy_quantity: number;
  buy_price: number;
  buy_value: number;
  buy_m2m: number;
  day_buy_quantity: number;
  day_buy_price: number;
  day_buy_value: number;
  sell_quantity: number;
  sell_price: number;
  sell_value: number;
  sell_m2m: number;
  day_sell_quantity: number;
  day_sell_price: number;
  day_sell_value: number;
}

export class ZerodhaService {
  private kite: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.apiKey = process.env.ZERODHA_API_KEY || '';
    this.apiSecret = process.env.ZERODHA_API_SECRET || '';
    
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Zerodha API credentials not configured');
    }

    this.kite = new KiteConnect({
      api_key: this.apiKey,
    });
  }

  async getAccessToken(requestToken: string): Promise<string> {
    try {
      const sessionData = await this.kite.generateSession(requestToken, this.apiSecret);
      return sessionData.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to get access token');
    }
  }

  // Check if token is still valid
  async isTokenValid(accessToken: string): Promise<boolean> {
    try {
      this.kite.setAccessToken(accessToken);
      await this.kite.getProfile();
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Invalid session') || errorMessage.includes('Token expired')) {
        return false;
      }
      throw error;
    }
  }

  // Get last trading day's date (considering market holidays)
  getLastTradingDate(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // If today is Sunday (0) or Saturday (6), go back to Friday
    if (dayOfWeek === 0) {
      today.setDate(today.getDate() - 2);
    } else if (dayOfWeek === 6) {
      today.setDate(today.getDate() - 1);
    }
    
    // Set time to end of trading day (3:30 PM IST)
    today.setHours(15, 30, 0, 0);
    return today;
  }

  async getTrades(accessToken: string, fromDate?: Date, toDate?: Date): Promise<Trade[]> {
    try {
      this.kite.setAccessToken(accessToken);
      
      // If no dates provided, get last trading day's trades
      if (!fromDate) {
        fromDate = this.getLastTradingDate();
        fromDate.setDate(fromDate.getDate() - 1); // Previous day
        fromDate.setHours(9, 15, 0, 0); // Market open
      }
      
      if (!toDate) {
        toDate = this.getLastTradingDate();
      }

      const trades = await this.kite.getTrades();
      
      // Filter trades by date range
      const filteredTrades = trades.filter((trade: unknown) => {
        const tradeObj = trade as { fill_timestamp: string };
        const tradeDate = new Date(tradeObj.fill_timestamp);
        return tradeDate >= fromDate! && tradeDate <= toDate!;
      });

      return filteredTrades;
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw new Error('Failed to fetch trades');
    }
  }

  async getCurrentPositions(accessToken: string): Promise<Position[]> {
    try {
      this.kite.setAccessToken(accessToken);
      const positions = await this.kite.getPositions();
      
      // Return net positions (current holdings)
      return positions.net || [];
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw new Error('Failed to fetch positions');
    }
  }

  async getProfile(accessToken: string) {
    try {
      this.kite.setAccessToken(accessToken);
      return await this.kite.getProfile();
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch profile');
    }
  }

  async getHoldings(accessToken: string) {
    try {
      this.kite.setAccessToken(accessToken);
      return await this.kite.getHoldings();
    } catch (error) {
      console.error('Error fetching holdings:', error);
      throw new Error('Failed to fetch holdings');
    }
  }

  async getMargins(accessToken: string) {
    try {
      this.kite.setAccessToken(accessToken);
      return await this.kite.getMargins();
    } catch (error) {
      console.error('Error fetching margins:', error);
      throw new Error('Failed to fetch margins');
    }
  }

  // Get orders for a specific date range
  async getOrders(accessToken: string) {
    try {
      this.kite.setAccessToken(accessToken);
      return await this.kite.getOrders();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  // Get historical data for a specific instrument
  async getHistoricalData(accessToken: string, instrumentToken: number, fromDate: Date, toDate: Date, interval: string = 'day') {
    try {
      this.kite.setAccessToken(accessToken);
      return await this.kite.getHistoricalData(instrumentToken, fromDate, toDate, interval);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw new Error('Failed to fetch historical data');
    }
  }
} 