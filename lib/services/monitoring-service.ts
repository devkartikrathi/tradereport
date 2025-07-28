import { ZerodhaService, Position, Trade } from './zerodha-service';
import { TradingRulesService } from './trading-rules-service';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export interface LivePosition {
    tradingsymbol: string;
    exchange: string;
    quantity: number;
    averagePrice: number;
    lastPrice: number;
    pnl: number;
    unrealised: number;
    realised: number;
    value: number;
    timestamp: Date;
}

export interface LiveTrade {
    tradeId: string;
    tradingsymbol: string;
    exchange: string;
    transactionType: string;
    quantity: number;
    averagePrice: number;
    timestamp: Date;
    pnl?: number;
}

export interface MonitoringData {
    positions: LivePosition[];
    todayTrades: LiveTrade[];
    dailyPnL: number;
    dailyTradesCount: number;
    totalExposure: number;
    lastUpdated: Date;
}

export interface MarketHours {
    isMarketOpen: boolean;
    nextOpenTime?: Date;
    nextCloseTime?: Date;
    currentTime: Date;
}

export class MonitoringService {
    private zerodhaService: ZerodhaService;
    private tradingRulesService: TradingRulesService;
    private cache: Map<string, { data: unknown; timestamp: Date }> = new Map();
    private readonly CACHE_DURATION = 30000; // 30 seconds

    constructor() {
        this.zerodhaService = new ZerodhaService();
        this.tradingRulesService = new TradingRulesService();
    }

    /**
     * Check if market is currently open
     */
    isMarketOpen(): MarketHours {
        const now = new Date();
        const currentTime = now.getTime();

        // Indian market hours: 9:15 AM to 3:30 PM IST (Monday to Friday)
        const dayOfWeek = now.getDay();
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

        if (!isWeekday) {
            return {
                isMarketOpen: false,
                currentTime: now,
                nextOpenTime: this.getNextMarketOpenTime(now)
            };
        }

        const marketOpen = new Date(now);
        marketOpen.setHours(9, 15, 0, 0);

        const marketClose = new Date(now);
        marketClose.setHours(15, 30, 0, 0);

        const isOpen = currentTime >= marketOpen.getTime() && currentTime <= marketClose.getTime();

        return {
            isMarketOpen: isOpen,
            currentTime: now,
            nextOpenTime: isOpen ? undefined : this.getNextMarketOpenTime(now),
            nextCloseTime: isOpen ? marketClose : undefined
        };
    }

    /**
     * Get next market open time
     */
    private getNextMarketOpenTime(currentTime: Date): Date {
        const nextOpen = new Date(currentTime);

        // If it's weekend, move to next Monday
        const dayOfWeek = currentTime.getDay();
        if (dayOfWeek === 0) { // Sunday
            nextOpen.setDate(currentTime.getDate() + 1);
        } else if (dayOfWeek === 6) { // Saturday
            nextOpen.setDate(currentTime.getDate() + 2);
        } else if (currentTime.getHours() >= 15) { // After market close
            nextOpen.setDate(currentTime.getDate() + 1);
        }

        nextOpen.setHours(9, 15, 0, 0);
        return nextOpen;
    }

    /**
     * Get live positions for a user
     */
    async getLivePositions(userId: string): Promise<LivePosition[]> {
        try {
            const cacheKey = `positions_${userId}`;
            const cached = this.getCachedData<LivePosition[]>(cacheKey);
            if (cached) {
                return cached;
            }

            const user = await prisma.user.findUnique({
                where: { clerkId: userId },
                include: { brokerConnections: true }
            });

            if (!user || user.brokerConnections.length === 0) {
                logger.warn('No broker connections found for user', { userId });
                return [];
            }

            const positions: LivePosition[] = [];

            for (const connection of user.brokerConnections) {
                if (connection.broker === 'zerodha') {
                    try {
                        const zerodhaPositions = await this.zerodhaService.getCurrentPositions(
                            connection.encryptedAccessToken
                        );

                        const livePositions = zerodhaPositions.map((pos: Position) => ({
                            tradingsymbol: pos.tradingsymbol,
                            exchange: pos.exchange,
                            quantity: pos.quantity,
                            averagePrice: pos.average_price,
                            lastPrice: pos.last_price,
                            pnl: pos.pnl,
                            unrealised: pos.unrealised,
                            realised: pos.realised,
                            value: pos.value,
                            timestamp: new Date()
                        }));

                        positions.push(...livePositions);
                    } catch (error) {
                        logger.error('Error fetching Zerodha positions', {
                            userId,
                            broker: connection.broker,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }
            }

            this.setCachedData(cacheKey, positions);
            return positions;
        } catch (error) {
            logger.error('Error getting live positions', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Get today's trades for a user
     */
    async getTodayTrades(userId: string): Promise<LiveTrade[]> {
        try {
            const cacheKey = `trades_${userId}`;
            const cached = this.getCachedData<LiveTrade[]>(cacheKey);
            if (cached) {
                return cached;
            }

            const user = await prisma.user.findUnique({
                where: { clerkId: userId },
                include: { brokerConnections: true }
            });

            if (!user || user.brokerConnections.length === 0) {
                logger.warn('No broker connections found for user', { userId });
                return [];
            }

            const trades: LiveTrade[] = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const connection of user.brokerConnections) {
                if (connection.broker === 'zerodha') {
                    try {
                        const zerodhaTrades = await this.zerodhaService.getTrades(
                            connection.encryptedAccessToken,
                            today,
                            new Date()
                        );

                        const liveTrades = zerodhaTrades.map((trade: Trade) => ({
                            tradeId: trade.trade_id,
                            tradingsymbol: trade.tradingsymbol,
                            exchange: trade.exchange,
                            transactionType: trade.transaction_type,
                            quantity: trade.quantity,
                            averagePrice: trade.average_price,
                            timestamp: new Date(trade.fill_timestamp),
                            pnl: 0 // Will be calculated based on position data
                        }));

                        trades.push(...liveTrades);
                    } catch (error) {
                        logger.error('Error fetching Zerodha trades', {
                            userId,
                            broker: connection.broker,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }
            }

            this.setCachedData(cacheKey, trades);
            return trades;
        } catch (error) {
            logger.error('Error getting today trades', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Get comprehensive monitoring data for a user
     */
    async getMonitoringData(userId: string): Promise<MonitoringData> {
        try {
            const cacheKey = `monitoring_${userId}`;
            const cached = this.getCachedData<MonitoringData>(cacheKey);
            if (cached) {
                return cached;
            }

            const [positions, trades] = await Promise.all([
                this.getLivePositions(userId),
                this.getTodayTrades(userId)
            ]);

            const dailyPnL = positions.reduce((total, pos) => total + pos.pnl, 0);
            const dailyTradesCount = trades.length;
            const totalExposure = positions.reduce((total, pos) => total + Math.abs(pos.value), 0);

            const monitoringData: MonitoringData = {
                positions,
                todayTrades: trades,
                dailyPnL,
                dailyTradesCount,
                totalExposure,
                lastUpdated: new Date()
            };

            this.setCachedData(cacheKey, monitoringData);
            return monitoringData;
        } catch (error) {
            logger.error('Error getting monitoring data', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                positions: [],
                todayTrades: [],
                dailyPnL: 0,
                dailyTradesCount: 0,
                totalExposure: 0,
                lastUpdated: new Date()
            };
        }
    }

    /**
     * Check if user has active broker connections
     */
    async hasActiveConnections(userId: string): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId },
                include: { brokerConnections: true }
            });

            return (user?.brokerConnections?.length || 0) > 0;
        } catch (error) {
            logger.error('Error checking active connections', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Get user's trading rules for monitoring
     */
    async getUserTradingRules(userId: string) {
        return await this.tradingRulesService.getUserTradingRules(userId);
    }

    /**
     * Validate current trading activity against rules
     */
    async validateTradingActivity(userId: string): Promise<{
        isValid: boolean;
        violations: string[];
        warnings: string[];
    }> {
        try {
            const [monitoringData, rules] = await Promise.all([
                this.getMonitoringData(userId),
                this.getUserTradingRules(userId)
            ]);

            if (!rules) {
                return { isValid: true, violations: [], warnings: [] };
            }

            const violations: string[] = [];
            const warnings: string[] = [];

            // Check daily trades limit
            if (monitoringData.dailyTradesCount >= rules.maxDailyTrades) {
                violations.push(`Daily trades limit exceeded (${monitoringData.dailyTradesCount}/${rules.maxDailyTrades})`);
            } else if (monitoringData.dailyTradesCount >= rules.maxDailyTrades * 0.8) {
                warnings.push(`Approaching daily trades limit (${monitoringData.dailyTradesCount}/${rules.maxDailyTrades})`);
            }

            // Check daily loss limit
            if (monitoringData.dailyPnL <= -rules.maxDailyLoss) {
                violations.push(`Daily loss limit exceeded (₹${Math.abs(monitoringData.dailyPnL)}/${rules.maxDailyLoss})`);
            } else if (monitoringData.dailyPnL <= -rules.maxDailyLoss * 0.8) {
                warnings.push(`Approaching daily loss limit (₹${Math.abs(monitoringData.dailyPnL)}/${rules.maxDailyLoss})`);
            }

            // Check total exposure
            const maxExposure = rules.maxDailyLoss * 2; // 2x daily loss limit as max exposure
            if (monitoringData.totalExposure > maxExposure) {
                violations.push(`Total exposure exceeds limit (₹${monitoringData.totalExposure}/${maxExposure})`);
            }

            return {
                isValid: violations.length === 0,
                violations,
                warnings
            };
        } catch (error) {
            logger.error('Error validating trading activity', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return { isValid: true, violations: [], warnings: [] };
        }
    }

    /**
     * Get cached data if still valid
     */
    private getCachedData<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = new Date();
        const age = now.getTime() - cached.timestamp.getTime();

        if (age < this.CACHE_DURATION) {
            return cached.data as T;
        }

        this.cache.delete(key);
        return null;
    }

    /**
     * Set cached data with timestamp
     */
    private setCachedData<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: new Date()
        });
    }

    /**
     * Clear cache for a specific user
     */
    clearUserCache(userId: string): void {
        const keysToDelete = Array.from(this.cache.keys()).filter(key =>
            key.includes(`_${userId}`)
        );

        keysToDelete.forEach(key => this.cache.delete(key));
        logger.info('Cleared cache for user', { userId });
    }

    /**
     * Clear all cache
     */
    clearAllCache(): void {
        this.cache.clear();
        logger.info('Cleared all monitoring cache');
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

export const monitoringService = new MonitoringService(); 