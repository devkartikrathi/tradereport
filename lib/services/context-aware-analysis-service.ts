import { prisma } from '@/lib/prisma';
import { marketDataService } from './market-data-service';
import { analyticsService } from './analytics-service';
import { generateMarketContextAnalysis } from '@/lib/gemini';
import { logger } from '@/lib/logger';

export interface ContextAwareAnalysis {
    id: string;
    userId: string;
    marketContext: any;
    tradingData: any;
    analysis: {
        marketCondition: string;
        tradingRecommendations: string[];
        riskAssessment: string[];
        opportunities: string[];
        warnings: string[];
        sectorInsights: SectorInsight[];
    };
    relevance: number; // 0-100
    createdAt: Date;
}

export interface SectorInsight {
    sector: string;
    performance: 'outperforming' | 'underperforming' | 'neutral';
    recommendation: string;
    riskLevel: 'low' | 'medium' | 'high';
    opportunities: string[];
}

export interface MarketAwareRecommendation {
    type: 'entry' | 'exit' | 'hold' | 'adjust';
    symbol?: string;
    reasoning: string;
    confidence: number; // 0-100
    marketContext: string;
    riskLevel: 'low' | 'medium' | 'high';
    expectedOutcome: string;
}

export interface ContextAwareRiskAssessment {
    overallRisk: 'low' | 'medium' | 'high' | 'extreme';
    marketRisk: number; // 0-100
    sectorRisk: number; // 0-100
    volatilityRisk: number; // 0-100
    recommendations: string[];
    riskFactors: string[];
    mitigationStrategies: string[];
}

export interface TradeValidationResult {
    isValid: boolean;
    confidence: number; // 0-100
    marketContext: string;
    recommendations: string[];
    warnings: string[];
    riskAssessment: ContextAwareRiskAssessment;
}

export class ContextAwareAnalysisService {
    /**
     * Generate context-aware analysis
     */
    async generateContextAwareAnalysis(userId: string): Promise<ContextAwareAnalysis> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Get market data
            const marketData = await marketDataService.getCurrentMarketData();

            // Get user's trading data
            const tradingData = await analyticsService.getUserAnalytics(userId);

            // Analyze market conditions
            const marketCondition = await marketDataService.analyzeMarketConditions(marketData);
            const volatilityAnalysis = await marketDataService.analyzeVolatility(marketData);
            // const trendAnalysis = await marketDataService.analyzeTrends(marketData);
            const sectorAnalysis = await marketDataService.getSectorAnalysis(marketData);

            // Generate AI-powered insights
            // const aiInsights = await this.generateAIMarketInsights(tradingData, marketData);

            // Create sector insights
            const sectorInsights = this.createSectorInsights(sectorAnalysis, marketCondition);

            // Calculate relevance score
            const relevance = this.calculateRelevance(marketCondition, tradingData);

            const analysis = {
                marketCondition: this.formatMarketCondition(marketCondition),
                tradingRecommendations: this.generateTradingRecommendations(marketCondition, tradingData),
                riskAssessment: this.generateRiskAssessment(marketCondition, volatilityAnalysis),
                opportunities: this.identifyOpportunities(marketCondition, sectorAnalysis),
                warnings: this.generateWarnings(marketCondition, volatilityAnalysis),
                sectorInsights
            };

            return {
                id: `analysis_${Date.now()}`,
                userId,
                marketContext: marketData,
                tradingData,
                analysis,
                relevance,
                createdAt: new Date()
            };
        } catch (error) {
            logger.error('Error generating context-aware analysis', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Validate trade with market context
     */
    async validateTradeWithContext(
        userId: string,
        tradeData: {
            symbol: string;
            action: 'buy' | 'sell';
            quantity: number;
            price: number;
            stopLoss?: number;
            target?: number;
        }
    ): Promise<TradeValidationResult> {
        try {
            const marketData = await marketDataService.getCurrentMarketData();
            const tradingData = await analyticsService.getUserAnalytics(userId);
            const marketCondition = await marketDataService.analyzeMarketConditions(marketData);
            const volatilityAnalysis = await marketDataService.analyzeVolatility(marketData);

            // Analyze trade in market context
            const isValid = this.validateTradeContext(tradeData, marketCondition, volatilityAnalysis);
            const confidence = this.calculateTradeConfidence(tradeData, marketCondition, tradingData);
            const marketContext = this.getMarketContextDescription(marketCondition);

            const recommendations = this.generateTradeRecommendations(tradeData, marketCondition);
            const warnings = this.generateTradeWarnings(tradeData, marketCondition, volatilityAnalysis);

            const riskAssessment = await this.assessTradeRisk(tradeData, marketCondition, volatilityAnalysis);

            return {
                isValid,
                confidence,
                marketContext,
                recommendations,
                warnings,
                riskAssessment
            };
        } catch (error) {
            logger.error('Error validating trade with context', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Generate market-aware recommendations
     */
    async generateMarketAwareRecommendations(userId: string): Promise<MarketAwareRecommendation[]> {
        try {
            const marketData = await marketDataService.getCurrentMarketData();
            // const tradingData = await analyticsService.getUserAnalytics(userId);
            const marketCondition = await marketDataService.analyzeMarketConditions(marketData);
            const sectorAnalysis = await marketDataService.getSectorAnalysis(marketData);

            const recommendations: MarketAwareRecommendation[] = [];

            // Generate recommendations based on market condition
            if (marketCondition.type === 'bull') {
                recommendations.push({
                    type: 'entry',
                    reasoning: 'Bull market conditions favor long positions',
                    confidence: marketCondition.confidence,
                    marketContext: 'Bull market with strong momentum',
                    riskLevel: 'medium',
                    expectedOutcome: 'Potential for upside gains'
                });
            } else if (marketCondition.type === 'bear') {
                recommendations.push({
                    type: 'exit',
                    reasoning: 'Bear market conditions suggest reducing exposure',
                    confidence: marketCondition.confidence,
                    marketContext: 'Bear market with downward pressure',
                    riskLevel: 'high',
                    expectedOutcome: 'Risk of further declines'
                });
            }

            // Add sector-specific recommendations
            const outperformingSectors = sectorAnalysis.filter(s => s.performance === 'outperforming');
            if (outperformingSectors.length > 0) {
                recommendations.push({
                    type: 'entry',
                    symbol: outperformingSectors[0].symbol,
                    reasoning: `${outperformingSectors[0].name} sector is outperforming the market`,
                    confidence: 75,
                    marketContext: 'Sector rotation favoring strong performers',
                    riskLevel: 'medium',
                    expectedOutcome: 'Continued sector outperformance'
                });
            }

            return recommendations;
        } catch (error) {
            logger.error('Error generating market-aware recommendations', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Assess risk with market context
     */
    async assessRiskWithContext(userId: string): Promise<ContextAwareRiskAssessment> {
        try {
            const marketData = await marketDataService.getCurrentMarketData();
            const marketCondition = await marketDataService.analyzeMarketConditions(marketData);
            const volatilityAnalysis = await marketDataService.analyzeVolatility(marketData);
            const sectorAnalysis = await marketDataService.getSectorAnalysis(marketData);

            // Calculate risk components
            const marketRisk = this.calculateMarketRisk(marketCondition);
            const sectorRisk = this.calculateSectorRisk(sectorAnalysis);
            const volatilityRisk = this.calculateVolatilityRisk(volatilityAnalysis);

            // Determine overall risk
            const overallRisk = this.determineOverallRisk(marketRisk, sectorRisk, volatilityRisk);

            const recommendations = this.generateRiskRecommendations(overallRisk, marketCondition);
            const riskFactors = this.identifyRiskFactors(marketCondition, volatilityAnalysis);
            const mitigationStrategies = this.generateMitigationStrategies(overallRisk);

            return {
                overallRisk,
                marketRisk,
                sectorRisk,
                volatilityRisk,
                recommendations,
                riskFactors,
                mitigationStrategies
            };
        } catch (error) {
            logger.error('Error assessing risk with context', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Generate AI-powered market insights
     */
    private async generateAIMarketInsights(tradingData: any, marketData: any): Promise<string> {
        try {
            const aiResponse = await generateMarketContextAnalysis(tradingData, marketData);
            return aiResponse;
        } catch (error) {
            logger.error('Error generating AI market insights', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return '';
        }
    }

    /**
     * Create sector insights
     */
    private createSectorInsights(sectorAnalysis: any[], marketCondition: any): SectorInsight[] {
        return sectorAnalysis.map(sector => ({
            sector: sector.name,
            performance: sector.performance,
            recommendation: this.generateSectorRecommendation(sector, marketCondition),
            riskLevel: this.calculateSectorRiskLevel(sector),
            opportunities: this.identifySectorOpportunities(sector, marketCondition)
        }));
    }

    /**
     * Calculate relevance score
     */
    private calculateRelevance(marketCondition: any, tradingData: any): number {
        let relevance = 50; // Base relevance

        // Adjust based on market condition strength
        if (marketCondition.strength === 'strong') {
            relevance += 20;
        } else if (marketCondition.strength === 'weak') {
            relevance -= 10;
        }

        // Adjust based on user's trading activity
        if (tradingData.analytics?.totalTrades > 50) {
            relevance += 15;
        }

        // Adjust based on market condition type
        if (marketCondition.type === 'bull' || marketCondition.type === 'bear') {
            relevance += 10;
        }

        return Math.min(100, Math.max(0, relevance));
    }

    /**
     * Format market condition
     */
    private formatMarketCondition(marketCondition: any): string {
        const strength = marketCondition.strength.charAt(0).toUpperCase() + marketCondition.strength.slice(1);
        const type = marketCondition.type === 'bull' ? 'bullish' : marketCondition.type === 'bear' ? 'bearish' : 'neutral';
        return `${strength} ${type} market with ${marketCondition.confidence}% confidence`;
    }

    /**
     * Generate trading recommendations
     */
    private generateTradingRecommendations(marketCondition: any, tradingData: any): string[] {
        const recommendations: string[] = [];

        if (marketCondition.type === 'bull') {
            recommendations.push('Consider increasing position sizes in strong sectors');
            recommendations.push('Look for breakout opportunities in momentum stocks');
            recommendations.push('Focus on growth-oriented strategies');
        } else if (marketCondition.type === 'bear') {
            recommendations.push('Reduce position sizes and increase cash allocation');
            recommendations.push('Focus on defensive stocks and dividend payers');
            recommendations.push('Consider hedging strategies');
        } else {
            recommendations.push('Maintain balanced portfolio allocation');
            recommendations.push('Focus on stock-specific opportunities');
            recommendations.push('Monitor for market direction changes');
        }

        return recommendations;
    }

    /**
     * Generate risk assessment
     */
    private generateRiskAssessment(marketCondition: any, volatilityAnalysis: any): string[] {
        const assessment: string[] = [];

        if (volatilityAnalysis.currentLevel === 'high' || volatilityAnalysis.currentLevel === 'extreme') {
            assessment.push('Elevated market volatility increases risk');
            assessment.push('Consider reducing position sizes');
            assessment.push('Implement tighter stop-losses');
        }

        if (marketCondition.type === 'bear') {
            assessment.push('Bear market conditions increase downside risk');
            assessment.push('Consider defensive positioning');
        }

        return assessment;
    }

    /**
     * Identify opportunities
     */
    private identifyOpportunities(marketCondition: any, sectorAnalysis: any[]): string[] {
        const opportunities: string[] = [];

        if (marketCondition.type === 'bull') {
            opportunities.push('Bull market provides favorable conditions for growth stocks');
            opportunities.push('Sector rotation opportunities in outperforming sectors');
        }

        const outperformingSectors = sectorAnalysis.filter(s => s.performance === 'outperforming');
        if (outperformingSectors.length > 0) {
            opportunities.push(`${outperformingSectors.length} sectors are outperforming the market`);
        }

        return opportunities;
    }

    /**
     * Generate warnings
     */
    private generateWarnings(marketCondition: any, volatilityAnalysis: any): string[] {
        const warnings: string[] = [];

        if (volatilityAnalysis.currentLevel === 'extreme') {
            warnings.push('Extreme volatility - exercise caution with new positions');
        }

        if (marketCondition.type === 'bear' && marketCondition.strength === 'strong') {
            warnings.push('Strong bear market - consider reducing exposure');
        }

        return warnings;
    }

    /**
     * Validate trade context
     */
    private validateTradeContext(tradeData: any, marketCondition: any, volatilityAnalysis: any): boolean {
        // Basic validation logic
        if (marketCondition.type === 'bear' && tradeData.action === 'buy') {
            return false; // Buying in bear market
        }

        if (volatilityAnalysis.currentLevel === 'extreme' && tradeData.quantity > 100) {
            return false; // Large position in extreme volatility
        }

        return true;
    }

    /**
     * Calculate trade confidence
     */
    private calculateTradeConfidence(tradeData: any, marketCondition: any, tradingData: any): number {
        let confidence = 50; // Base confidence

        // Adjust based on market condition alignment
        if ((marketCondition.type === 'bull' && tradeData.action === 'buy') ||
            (marketCondition.type === 'bear' && tradeData.action === 'sell')) {
            confidence += 20;
        } else {
            confidence -= 20;
        }

        // Adjust based on user's trading history
        if (tradingData.analytics?.winRate > 60) {
            confidence += 10;
        }

        return Math.min(100, Math.max(0, confidence));
    }

    /**
     * Get market context description
     */
    private getMarketContextDescription(marketCondition: any): string {
        return `${marketCondition.strength} ${marketCondition.type} market with ${marketCondition.confidence}% confidence`;
    }

    /**
     * Generate trade recommendations
     */
    private generateTradeRecommendations(tradeData: any, marketCondition: any): string[] {
        const recommendations: string[] = [];

        if (marketCondition.type === 'bull' && tradeData.action === 'buy') {
            recommendations.push('Trade aligns with bullish market conditions');
        } else if (marketCondition.type === 'bear' && tradeData.action === 'sell') {
            recommendations.push('Trade aligns with bearish market conditions');
        } else {
            recommendations.push('Consider market conditions when executing this trade');
        }

        return recommendations;
    }

    /**
     * Generate trade warnings
     */
    private generateTradeWarnings(tradeData: any, marketCondition: any, volatilityAnalysis: any): string[] {
        const warnings: string[] = [];

        if (marketCondition.type === 'bear' && tradeData.action === 'buy') {
            warnings.push('Buying in bear market - consider waiting for better conditions');
        }

        if (volatilityAnalysis.currentLevel === 'high' || volatilityAnalysis.currentLevel === 'extreme') {
            warnings.push('High volatility - consider reducing position size');
        }

        return warnings;
    }

    /**
     * Assess trade risk
     */
    private async assessTradeRisk(tradeData: any, marketCondition: any, volatilityAnalysis: any): Promise<ContextAwareRiskAssessment> {
        const marketRisk = this.calculateMarketRisk(marketCondition);
        const volatilityRisk = this.calculateVolatilityRisk(volatilityAnalysis);
        const sectorRisk = 50; // Default sector risk

        const overallRisk = this.determineOverallRisk(marketRisk, sectorRisk, volatilityRisk);

        return {
            overallRisk,
            marketRisk,
            sectorRisk,
            volatilityRisk,
            recommendations: this.generateRiskRecommendations(overallRisk, marketCondition),
            riskFactors: this.identifyRiskFactors(marketCondition, volatilityAnalysis),
            mitigationStrategies: this.generateMitigationStrategies(overallRisk)
        };
    }

    /**
     * Calculate market risk
     */
    private calculateMarketRisk(marketCondition: any): number {
        if (marketCondition.type === 'bear') {
            return 80;
        } else if (marketCondition.type === 'bull') {
            return 30;
        } else {
            return 50;
        }
    }

    /**
     * Calculate sector risk
     */
    private calculateSectorRisk(sectorAnalysis: any[]): number {
        const underperformingSectors = sectorAnalysis.filter(s => s.performance === 'underperforming');
        return (underperformingSectors.length / sectorAnalysis.length) * 100;
    }

    /**
     * Calculate volatility risk
     */
    private calculateVolatilityRisk(volatilityAnalysis: any): number {
        switch (volatilityAnalysis.currentLevel) {
            case 'extreme': return 90;
            case 'high': return 70;
            case 'moderate': return 50;
            case 'low': return 30;
            default: return 50;
        }
    }

    /**
     * Determine overall risk
     */
    private determineOverallRisk(marketRisk: number, sectorRisk: number, volatilityRisk: number): 'low' | 'medium' | 'high' | 'extreme' {
        const avgRisk = (marketRisk + sectorRisk + volatilityRisk) / 3;

        if (avgRisk >= 80) return 'extreme';
        if (avgRisk >= 60) return 'high';
        if (avgRisk >= 40) return 'medium';
        return 'low';
    }

    /**
     * Generate risk recommendations
     */
    private generateRiskRecommendations(overallRisk: string, marketCondition: any): string[] {
        const recommendations: string[] = [];

        if (overallRisk === 'extreme' || overallRisk === 'high') {
            recommendations.push('Reduce position sizes');
            recommendations.push('Implement strict stop-losses');
            recommendations.push('Consider hedging strategies');
        } else if (overallRisk === 'medium') {
            recommendations.push('Maintain balanced portfolio');
            recommendations.push('Monitor positions closely');
        } else {
            recommendations.push('Normal risk management practices');
        }

        return recommendations;
    }

    /**
     * Identify risk factors
     */
    private identifyRiskFactors(marketCondition: any, volatilityAnalysis: any): string[] {
        const factors: string[] = [];

        if (marketCondition.type === 'bear') {
            factors.push('Bear market conditions');
        }

        if (volatilityAnalysis.currentLevel === 'high' || volatilityAnalysis.currentLevel === 'extreme') {
            factors.push('Elevated market volatility');
        }

        return factors;
    }

    /**
     * Generate mitigation strategies
     */
    private generateMitigationStrategies(overallRisk: string): string[] {
        const strategies: string[] = [];

        if (overallRisk === 'extreme' || overallRisk === 'high') {
            strategies.push('Increase cash allocation');
            strategies.push('Use defensive stocks');
            strategies.push('Implement portfolio hedging');
        } else if (overallRisk === 'medium') {
            strategies.push('Diversify across sectors');
            strategies.push('Maintain stop-losses');
        }

        return strategies;
    }

    /**
     * Generate sector recommendation
     */
    private generateSectorRecommendation(sector: any, marketCondition: any): string {
        if (sector.performance === 'outperforming') {
            return `Consider overweighting ${sector.name} sector`;
        } else if (sector.performance === 'underperforming') {
            return `Consider underweighting ${sector.name} sector`;
        } else {
            return `Maintain neutral weight in ${sector.name} sector`;
        }
    }

    /**
     * Calculate sector risk level
     */
    private calculateSectorRiskLevel(sector: any): 'low' | 'medium' | 'high' {
        if (sector.performance === 'outperforming') return 'low';
        if (sector.performance === 'underperforming') return 'high';
        return 'medium';
    }

    /**
     * Identify sector opportunities
     */
    private identifySectorOpportunities(sector: any, marketCondition: any): string[] {
        const opportunities: string[] = [];

        if (sector.performance === 'outperforming') {
            opportunities.push('Sector momentum favors continued outperformance');
        }

        if (marketCondition.type === 'bull' && sector.performance === 'outperforming') {
            opportunities.push('Bull market amplifies sector strength');
        }

        return opportunities;
    }
}

export const contextAwareAnalysisService = new ContextAwareAnalysisService(); 