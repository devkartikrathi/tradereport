import { PrismaClient } from "@prisma/client";
import { generateChatResponse } from "@/lib/gemini";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

export interface ValidationChecklist {
    id: string;
    category: string;
    item: string;
    status: 'pass' | 'fail' | 'warning';
    explanation: string;
    recommendation: string;
}

export interface ValidationResult {
    overall: 'pass' | 'fail' | 'warning';
    score: number;
    checklist: ValidationChecklist[];
    guidance: string;
    riskLevel: 'low' | 'medium' | 'high';
    confidence: number;
}

export interface TradeDetails {
    symbol: string;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    positionSize: number;
    tradeType: 'buy' | 'sell';
}

export interface RuleValidation {
    rule: string;
    status: 'pass' | 'fail' | 'warning';
    explanation: string;
    recommendation: string;
}

export class ValidatorService {
    private generateChecklistId(): string {
        return `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private calculateRiskLevel(analysis: string): 'low' | 'medium' | 'high' {
        const text = analysis.toLowerCase();

        // High risk indicators
        if (text.includes('high risk') || text.includes('dangerous') || text.includes('avoid') ||
            text.includes('overbought') || text.includes('oversold') || text.includes('reversal')) {
            return 'high';
        }

        // Medium risk indicators
        if (text.includes('moderate risk') || text.includes('caution') || text.includes('consolidation') ||
            text.includes('sideways') || text.includes('uncertain')) {
            return 'medium';
        }

        return 'low';
    }

    private calculateConfidence(analysis: string): number {
        const text = analysis.toLowerCase();

        // Confidence indicators
        let confidence = 50; // Base confidence

        if (text.includes('clear signal') || text.includes('strong trend') || text.includes('confirmed')) {
            confidence += 20;
        }
        if (text.includes('good setup') || text.includes('favorable') || text.includes('positive')) {
            confidence += 15;
        }
        if (text.includes('uncertain') || text.includes('unclear') || text.includes('mixed')) {
            confidence -= 15;
        }
        if (text.includes('weak signal') || text.includes('poor setup') || text.includes('avoid')) {
            confidence -= 25;
        }

        return Math.max(0, Math.min(100, confidence));
    }

    private parseAIResponse(response: string): ValidationChecklist[] {
        const checklist: ValidationChecklist[] = [];

        try {
            // Split response into sections
            const sections = response.split(/(?:TECHNICAL ANALYSIS|RISK MANAGEMENT|ENTRY\/EXIT|POSITION SIZING|MARKET CONTEXT):/i);

            if (sections.length >= 6) {
                // Technical Analysis
                const technicalText = sections[1]?.trim();
                if (technicalText) {
                    checklist.push({
                        id: this.generateChecklistId(),
                        category: 'Technical Analysis',
                        item: 'Chart Pattern Analysis',
                        status: technicalText.includes('positive') || technicalText.includes('good') ? 'pass' :
                            technicalText.includes('negative') || technicalText.includes('poor') ? 'fail' : 'warning',
                        explanation: technicalText,
                        recommendation: technicalText.includes('positive') ? 'Continue with analysis' : 'Review chart patterns'
                    });
                }

                // Risk Management
                const riskText = sections[2]?.trim();
                if (riskText) {
                    checklist.push({
                        id: this.generateChecklistId(),
                        category: 'Risk Management',
                        item: 'Stop Loss Placement',
                        status: riskText.includes('appropriate') || riskText.includes('good') ? 'pass' :
                            riskText.includes('inappropriate') || riskText.includes('poor') ? 'fail' : 'warning',
                        explanation: riskText,
                        recommendation: riskText.includes('appropriate') ? 'Risk management looks good' : 'Review stop loss placement'
                    });
                }

                // Entry/Exit
                const entryText = sections[3]?.trim();
                if (entryText) {
                    checklist.push({
                        id: this.generateChecklistId(),
                        category: 'Entry/Exit',
                        item: 'Entry Timing',
                        status: entryText.includes('good') || entryText.includes('optimal') ? 'pass' :
                            entryText.includes('poor') || entryText.includes('avoid') ? 'fail' : 'warning',
                        explanation: entryText,
                        recommendation: entryText.includes('good') ? 'Entry timing looks favorable' : 'Consider waiting for better entry'
                    });
                }

                // Position Sizing
                const sizingText = sections[4]?.trim();
                if (sizingText) {
                    checklist.push({
                        id: this.generateChecklistId(),
                        category: 'Position Sizing',
                        item: 'Position Size Assessment',
                        status: sizingText.includes('appropriate') || sizingText.includes('good') ? 'pass' :
                            sizingText.includes('inappropriate') || sizingText.includes('large') ? 'fail' : 'warning',
                        explanation: sizingText,
                        recommendation: sizingText.includes('appropriate') ? 'Position size looks good' : 'Consider reducing position size'
                    });
                }

                // Market Context
                const contextText = sections[5]?.trim();
                if (contextText) {
                    checklist.push({
                        id: this.generateChecklistId(),
                        category: 'Market Context',
                        item: 'Market Environment',
                        status: contextText.includes('favorable') || contextText.includes('good') ? 'pass' :
                            contextText.includes('unfavorable') || contextText.includes('poor') ? 'fail' : 'warning',
                        explanation: contextText,
                        recommendation: contextText.includes('favorable') ? 'Market context supports trade' : 'Consider market conditions'
                    });
                }
            }
        } catch (error) {
            logger.error("Error parsing AI response", { error });
        }

        return checklist;
    }

    async validateTradeIdea(imageUrl: string, description: string, tradeDetails?: TradeDetails): Promise<ValidationResult> {
        try {
            // Prepare the analysis prompt
            const prompt = `Analyze this trading chart image and provide a comprehensive validation of the trade idea.

**Trade Description:** ${description}

${tradeDetails ? `
**Trade Details:**
- Symbol: ${tradeDetails.symbol}
- Entry Price: ${tradeDetails.entryPrice}
- Stop Loss: ${tradeDetails.stopLoss}
- Take Profit: ${tradeDetails.takeProfit}
- Position Size: ${tradeDetails.positionSize}
- Trade Type: ${tradeDetails.tradeType}
` : ''}

**Analysis Requirements:**
Please analyze the chart image and provide validation in the following format:

TECHNICAL ANALYSIS:
[Analyze chart patterns, support/resistance levels, trend direction, and technical indicators]

RISK MANAGEMENT:
[Evaluate stop loss placement, risk-reward ratio, and risk management aspects]

ENTRY/EXIT:
[Assess entry timing, exit strategy, and trade execution]

POSITION SIZING:
[Evaluate position size appropriateness and risk exposure]

MARKET CONTEXT:
[Consider overall market environment, sector performance, and external factors]

**Guidance:**
Provide overall guidance on whether this trade idea is worth pursuing, including:
- Overall assessment (pass/fail/warning)
- Key strengths and weaknesses
- Specific recommendations for improvement
- Risk level assessment (low/medium/high)
- Confidence level (0-100%)

Focus on practical, actionable insights for Indian market trading.`;

            // Get AI analysis
            const aiResponse = await generateChatResponse(prompt, { hasData: true }, undefined);

            // Parse the response
            const checklist = this.parseAIResponse(aiResponse);

            // Calculate metrics
            const riskLevel = this.calculateRiskLevel(aiResponse);
            const confidence = this.calculateConfidence(aiResponse);

            // Calculate overall score
            const passCount = checklist.filter(item => item.status === 'pass').length;
            const failCount = checklist.filter(item => item.status === 'fail').length;
            const totalChecks = checklist.length;
            const score = totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 0;

            // Determine overall status
            let overall: 'pass' | 'fail' | 'warning';
            if (score >= 80 && failCount === 0) {
                overall = 'pass';
            } else if (score >= 60 && failCount <= 1) {
                overall = 'warning';
            } else {
                overall = 'fail';
            }

            // Generate guidance
            const guidance = this.generateGuidance(overall, score, riskLevel, checklist);

            logger.info("Trade validation completed", {
                overall,
                score,
                riskLevel,
                confidence,
                checklistCount: checklist.length,
            });

            return {
                overall,
                score,
                checklist,
                guidance,
                riskLevel,
                confidence,
            };

        } catch (error) {
            logger.error("Error validating trade idea", {
                error: error instanceof Error ? error.message : "Unknown error",
            });

            // Return fallback validation
            return {
                overall: 'warning',
                score: 50,
                checklist: [
                    {
                        id: this.generateChecklistId(),
                        category: 'System',
                        item: 'AI Analysis',
                        status: 'warning',
                        explanation: 'Unable to complete AI analysis at this time',
                        recommendation: 'Please try again or provide more detailed description'
                    }
                ],
                guidance: 'Unable to complete full validation. Please try again with a clearer image or more detailed description.',
                riskLevel: 'medium',
                confidence: 50,
            };
        }
    }

    private generateGuidance(overall: string, score: number, riskLevel: string, checklist: ValidationChecklist[]): string {
        const passCount = checklist.filter(item => item.status === 'pass').length;
        const failCount = checklist.filter(item => item.status === 'fail').length;
        const warningCount = checklist.filter(item => item.status === 'warning').length;

        if (overall === 'pass') {
            return `✅ This trade idea looks promising! With ${score}% validation score and ${passCount} passed checks, this setup appears favorable. The ${riskLevel} risk level suggests manageable risk. Proceed with caution and ensure proper position sizing.`;
        } else if (overall === 'warning') {
            return `⚠️ This trade idea needs attention. With ${score}% validation score and ${warningCount} warnings, there are areas for improvement. Consider addressing the flagged issues before proceeding.`;
        } else {
            return `❌ This trade idea has significant concerns. With ${score}% validation score and ${failCount} failed checks, this setup needs substantial improvement. Consider waiting for a better opportunity or addressing the major issues identified.`;
        }
    }

    async checkTradingRules(tradeDetails: TradeDetails, userId: string): Promise<RuleValidation[]> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { tradingRules: true }
            });

            if (!user?.tradingRules) {
                return [
                    {
                        rule: 'Trading Rules',
                        status: 'warning',
                        explanation: 'No trading rules configured',
                        recommendation: 'Set up your trading rules for better validation'
                    }
                ];
            }

            const rules = user.tradingRules;
            const validations: RuleValidation[] = [];

            // Check risk-reward ratio
            const riskRewardRatio = Math.abs((tradeDetails.takeProfit - tradeDetails.entryPrice) / (tradeDetails.entryPrice - tradeDetails.stopLoss));
            if (riskRewardRatio >= rules.riskRewardRatio) {
                validations.push({
                    rule: 'Risk-Reward Ratio',
                    status: 'pass',
                    explanation: `Risk-reward ratio of ${riskRewardRatio.toFixed(2)} meets your minimum requirement of ${rules.riskRewardRatio}`,
                    recommendation: 'Risk-reward ratio looks good'
                });
            } else {
                validations.push({
                    rule: 'Risk-Reward Ratio',
                    status: 'fail',
                    explanation: `Risk-reward ratio of ${riskRewardRatio.toFixed(2)} is below your minimum requirement of ${rules.riskRewardRatio}`,
                    recommendation: 'Consider adjusting entry, stop loss, or take profit to improve risk-reward ratio'
                });
            }

            // Check position size (assuming position size is in percentage of account)
            if (tradeDetails.positionSize <= 5) { // Assuming 5% max position size
                validations.push({
                    rule: 'Position Size',
                    status: 'pass',
                    explanation: `Position size of ${tradeDetails.positionSize}% is within reasonable limits`,
                    recommendation: 'Position size looks appropriate'
                });
            } else {
                validations.push({
                    rule: 'Position Size',
                    status: 'warning',
                    explanation: `Position size of ${tradeDetails.positionSize}% may be too large`,
                    recommendation: 'Consider reducing position size for better risk management'
                });
            }

            return validations;

        } catch (error) {
            logger.error("Error checking trading rules", {
                userId,
                error: error instanceof Error ? error.message : "Unknown error",
            });

            return [
                {
                    rule: 'Trading Rules',
                    status: 'warning',
                    explanation: 'Unable to check trading rules',
                    recommendation: 'Please ensure your trading rules are properly configured'
                }
            ];
        }
    }

    async generateValidationChecklist(analysis: string): Promise<ValidationChecklist[]> {
        return this.parseAIResponse(analysis);
    }
}

export const validatorService = new ValidatorService(); 