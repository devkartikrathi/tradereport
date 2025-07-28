import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface MarketData {
    indices: {
        nifty: MarketIndex;
        sensex: MarketIndex;
        banknifty: MarketIndex;
    };
    volatility: {
        vix: number;
        niftyVolatility: number;
        sensexVolatility: number;
    };
    sectors: SectorPerformance[];
    marketBreadth: {
        advances: number;
        declines: number;
        unchanged: number;
        advanceDeclineRatio: number;
    };
    trends: {
        shortTerm: 'bullish' | 'bearish' | 'neutral';
        mediumTerm: 'bullish' | 'bearish' | 'neutral';
        longTerm: 'bullish' | 'bearish' | 'neutral';
    };
    timestamp: Date;
}

export interface MarketIndex {
    symbol: string;
    value: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
    previousClose: number;
}

export interface SectorPerformance {
    name: string;
    symbol: string;
    value: number;
    change: number;
    changePercent: number;
    weight: number;
    performance: 'outperforming' | 'underperforming' | 'neutral';
}

export interface MarketCondition {
    type: 'bull' | 'bear' | 'neutral';
    strength: 'weak' | 'moderate' | 'strong';
    confidence: number; // 0-100
    factors: string[];
    duration: string;
    expectedDirection: 'up' | 'down' | 'sideways';
}

export interface VolatilityAnalysis {
    currentLevel: 'low' | 'moderate' | 'high' | 'extreme';
    trend: 'increasing' | 'decreasing' | 'stable';
    impact: 'positive' | 'negative' | 'neutral';
    recommendations: string[];
}

export interface TrendAnalysis {
    direction: 'up' | 'down' | 'sideways';
    strength: number; // 0-100
    momentum: 'accelerating' | 'decelerating' | 'stable';
    support: number[];
    resistance: number[];
    breakoutLevels: number[];
}

export interface MarketContext {
    id: string;
    userId: string;
    contextType: 'market_condition' | 'volatility' | 'trend' | 'sector_correlation';
    marketData: MarketData;
    analysis: {
        condition: MarketCondition;
        volatility: VolatilityAnalysis;
        trend: TrendAnalysis;
    };
    insights: {
        tradingAdvice: string[];
        riskAssessment: string[];
        opportunities: string[];
        warnings: string[];
    };
    relevance: number; // 0-100
    createdAt: Date;
}

export class MarketDataService {
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Get current market data
     */
    async getCurrentMarketData(): Promise<MarketData> {
        try {
            // Check cache first
            const cached = this.cache.get('current_market_data');
            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                return cached.data;
            }

            // Fetch market data from external APIs (simulated for now)
            const marketData = await this.fetchMarketData();

            // Cache the data
            this.cache.set('current_market_data', {
                data: marketData,
                timestamp: Date.now()
            });

            logger.info('Market data fetched successfully');

            return marketData;
        } catch (error) {
            logger.error('Error fetching market data', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Analyze market conditions
     */
    async analyzeMarketConditions(marketData: MarketData): Promise<MarketCondition> {
        try {
            const niftyChange = marketData.indices.nifty.changePercent;
            const sensexChange = marketData.indices.sensex.changePercent;
            const vix = marketData.volatility.vix;
            const breadth = marketData.marketBreadth.advanceDeclineRatio;

            // Determine market type
            let type: 'bull' | 'bear' | 'neutral' = 'neutral';
            let strength: 'weak' | 'moderate' | 'strong' = 'moderate';
            let confidence = 50;

            // Analyze price action
            const avgChange = (niftyChange + sensexChange) / 2;
            if (avgChange > 0.5) {
                type = 'bull';
                strength = avgChange > 1.5 ? 'strong' : 'moderate';
                confidence = Math.min(100, 60 + avgChange * 20);
            } else if (avgChange < -0.5) {
                type = 'bear';
                strength = avgChange < -1.5 ? 'strong' : 'moderate';
                confidence = Math.min(100, 60 + Math.abs(avgChange) * 20);
            }

            // Consider volatility
            if (vix > 25) {
                confidence = Math.max(confidence - 10, 30);
            } else if (vix < 15) {
                confidence = Math.min(confidence + 10, 90);
            }

            // Consider market breadth
            if (breadth > 1.5 && type === 'bull') {
                confidence = Math.min(confidence + 10, 100);
            } else if (breadth < 0.5 && type === 'bear') {
                confidence = Math.min(confidence + 10, 100);
            }

            const factors: string[] = [];
            if (Math.abs(avgChange) > 1) {
                factors.push(`Strong ${type === 'bull' ? 'upward' : 'downward'} price movement`);
            }
            if (vix > 20) {
                factors.push('Elevated market volatility');
            }
            if (breadth > 1.2 || breadth < 0.8) {
                factors.push(`${breadth > 1.2 ? 'Broad' : 'Narrow'} market participation`);
            }

            const duration = this.estimateConditionDuration(type, strength);
            const expectedDirection = type === 'bull' ? 'up' : type === 'bear' ? 'down' : 'sideways';

            return {
                type,
                strength,
                confidence,
                factors,
                duration,
                expectedDirection
            };
        } catch (error) {
            logger.error('Error analyzing market conditions', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Analyze volatility
     */
    async analyzeVolatility(marketData: MarketData): Promise<VolatilityAnalysis> {
        try {
            const vix = marketData.volatility.vix;
            const niftyVol = marketData.volatility.niftyVolatility;

            // Determine volatility level
            let currentLevel: 'low' | 'moderate' | 'high' | 'extreme';
            if (vix < 15) {
                currentLevel = 'low';
            } else if (vix < 25) {
                currentLevel = 'moderate';
            } else if (vix < 35) {
                currentLevel = 'high';
            } else {
                currentLevel = 'extreme';
            }

            // Determine trend (simplified)
            const trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

            // Determine impact
            let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
            if (currentLevel === 'low') {
                impact = 'positive';
            } else if (currentLevel === 'extreme') {
                impact = 'negative';
            }

            const recommendations: string[] = [];
            if (currentLevel === 'high' || currentLevel === 'extreme') {
                recommendations.push('Consider reducing position sizes');
                recommendations.push('Implement tighter stop-losses');
                recommendations.push('Focus on defensive stocks');
            } else if (currentLevel === 'low') {
                recommendations.push('Consider increasing position sizes');
                recommendations.push('Look for breakout opportunities');
                recommendations.push('Focus on momentum stocks');
            }

            return {
                currentLevel,
                trend,
                impact,
                recommendations
            };
        } catch (error) {
            logger.error('Error analyzing volatility', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Analyze market trends
     */
    async analyzeTrends(marketData: MarketData): Promise<TrendAnalysis> {
        try {
            const niftyChange = marketData.indices.nifty.changePercent;
            const sensexChange = marketData.indices.sensex.changePercent;
            const avgChange = (niftyChange + sensexChange) / 2;

            // Determine direction
            const direction: 'up' | 'down' | 'sideways' =
                avgChange > 0.3 ? 'up' : avgChange < -0.3 ? 'down' : 'sideways';

            // Calculate strength (0-100)
            const strength = Math.min(100, Math.abs(avgChange) * 50);

            // Determine momentum
            const momentum: 'accelerating' | 'decelerating' | 'stable' = 'stable';

            // Calculate support and resistance levels (simplified)
            const currentPrice = marketData.indices.nifty.value;
            const support = [currentPrice * 0.95, currentPrice * 0.90];
            const resistance = [currentPrice * 1.05, currentPrice * 1.10];
            const breakoutLevels = [currentPrice * 1.02, currentPrice * 0.98];

            return {
                direction,
                strength,
                momentum,
                support,
                resistance,
                breakoutLevels
            };
        } catch (error) {
            logger.error('Error analyzing trends', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Get sector performance analysis
     */
    async getSectorAnalysis(marketData: MarketData): Promise<SectorPerformance[]> {
        try {
            return marketData.sectors.map(sector => ({
                ...sector,
                performance: this.calculateSectorPerformance(sector.changePercent)
            }));
        } catch (error) {
            logger.error('Error analyzing sectors', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Save market context to database
     */
    async saveMarketContext(userId: string, contextData: Omit<MarketContext, 'id' | 'userId' | 'createdAt'>): Promise<MarketContext> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            const savedContext = await prisma.marketContext.create({
                data: {
                    userId: user.id,
                    contextType: contextData.contextType,
                    marketData: contextData.marketData,
                    analysis: contextData.analysis,
                    insights: contextData.insights,
                    relevance: contextData.relevance
                }
            });

            logger.info('Market context saved', {
                userId,
                contextId: savedContext.id,
                contextType: savedContext.contextType
            });

            return {
                id: savedContext.id,
                userId: savedContext.userId,
                contextType: savedContext.contextType as MarketContext['contextType'],
                marketData: savedContext.marketData as MarketData,
                analysis: savedContext.analysis as MarketContext['analysis'],
                insights: savedContext.insights as MarketContext['insights'],
                relevance: savedContext.relevance,
                createdAt: savedContext.createdAt
            };
        } catch (error) {
            logger.error('Error saving market context', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Get user's market contexts
     */
    async getUserMarketContexts(userId: string): Promise<MarketContext[]> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                return [];
            }

            const contexts = await prisma.marketContext.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' }
            });

            return contexts.map(context => ({
                id: context.id,
                userId: context.userId,
                contextType: context.contextType as MarketContext['contextType'],
                marketData: context.marketData as MarketData,
                analysis: context.analysis as MarketContext['analysis'],
                insights: context.insights as MarketContext['insights'],
                relevance: context.relevance,
                createdAt: context.createdAt
            }));
        } catch (error) {
            logger.error('Error getting user market contexts', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Fetch market data from external APIs (simulated)
     */
    private async fetchMarketData(): Promise<MarketData> {
        // Simulated market data - in real implementation, this would fetch from external APIs
        const now = new Date();

        return {
            indices: {
                nifty: {
                    symbol: 'NIFTY50',
                    value: 19500 + Math.random() * 200,
                    change: (Math.random() - 0.5) * 100,
                    changePercent: (Math.random() - 0.5) * 2,
                    high: 19600,
                    low: 19400,
                    volume: 1000000 + Math.random() * 500000,
                    previousClose: 19500
                },
                sensex: {
                    symbol: 'SENSEX',
                    value: 65000 + Math.random() * 500,
                    change: (Math.random() - 0.5) * 200,
                    changePercent: (Math.random() - 0.5) * 1.5,
                    high: 65500,
                    low: 64500,
                    volume: 2000000 + Math.random() * 1000000,
                    previousClose: 65000
                },
                banknifty: {
                    symbol: 'BANKNIFTY',
                    value: 44000 + Math.random() * 400,
                    change: (Math.random() - 0.5) * 150,
                    changePercent: (Math.random() - 0.5) * 2.5,
                    high: 44500,
                    low: 43500,
                    volume: 800000 + Math.random() * 400000,
                    previousClose: 44000
                }
            },
            volatility: {
                vix: 15 + Math.random() * 10,
                niftyVolatility: 12 + Math.random() * 8,
                sensexVolatility: 10 + Math.random() * 6
            },
            sectors: [
                { name: 'Banking', symbol: 'NIFTYBANK', value: 44000, change: 100, changePercent: 0.5, weight: 0.3, performance: 'outperforming' },
                { name: 'IT', symbol: 'NIFTYIT', value: 35000, change: -50, changePercent: -0.2, weight: 0.2, performance: 'underperforming' },
                { name: 'Pharma', symbol: 'NIFTYPHARMA', value: 12000, change: 30, changePercent: 0.3, weight: 0.1, performance: 'outperforming' },
                { name: 'Auto', symbol: 'NIFTYAUTO', value: 18000, change: -20, changePercent: -0.1, weight: 0.15, performance: 'neutral' },
                { name: 'FMCG', symbol: 'NIFTYFMCG', value: 22000, change: 40, changePercent: 0.2, weight: 0.25, performance: 'outperforming' }
            ],
            marketBreadth: {
                advances: 1200 + Math.random() * 200,
                declines: 800 + Math.random() * 200,
                unchanged: 100 + Math.random() * 50,
                advanceDeclineRatio: 1.2 + Math.random() * 0.6
            },
            trends: {
                shortTerm: Math.random() > 0.5 ? 'bullish' : 'bearish',
                mediumTerm: Math.random() > 0.5 ? 'bullish' : 'bearish',
                longTerm: Math.random() > 0.5 ? 'bullish' : 'bearish'
            },
            timestamp: now
        };
    }

    /**
     * Estimate condition duration
     */
    private estimateConditionDuration(type: string, strength: string): string {
        if (strength === 'strong') {
            return type === 'bull' ? '2-3 weeks' : '1-2 weeks';
        } else if (strength === 'moderate') {
            return '1-2 weeks';
        } else {
            return '3-5 days';
        }
    }

    /**
     * Calculate sector performance
     */
    private calculateSectorPerformance(changePercent: number): 'outperforming' | 'underperforming' | 'neutral' {
        if (changePercent > 0.5) return 'outperforming';
        if (changePercent < -0.5) return 'underperforming';
        return 'neutral';
    }
}

export const marketDataService = new MarketDataService(); 