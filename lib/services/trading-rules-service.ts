import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

export interface TradingRules {
    maxDailyTrades: number;
    maxDailyLoss: number;
    riskRewardRatio: number;
}

export interface TradingRulesValidation {
    isValid: boolean;
    errors: string[];
}

export class TradingRulesService {
    /**
     * Get user's trading rules
     */
    async getUserTradingRules(userId: string): Promise<TradingRules | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId },
                include: { tradingRules: true }
            });

            if (!user) {
                logger.warn("User not found for trading rules", { userId });
                return null;
            }

            if (!user.tradingRules) {
                logger.info("No trading rules found for user, returning defaults", { userId });
                return this.getDefaultTradingRules();
            }

            return {
                maxDailyTrades: user.tradingRules.maxDailyTrades,
                maxDailyLoss: user.tradingRules.maxDailyLoss,
                riskRewardRatio: user.tradingRules.riskRewardRatio
            };
        } catch (error) {
            logger.error("Error fetching user trading rules", {
                userId,
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Save or update user's trading rules
     */
    async saveUserTradingRules(userId: string, rules: TradingRules): Promise<TradingRules> {
        try {
            // Validate rules before saving
            const validation = this.validateTradingRules(rules);
            if (!validation.isValid) {
                throw new Error(`Invalid trading rules: ${validation.errors.join(', ')}`);
            }

            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error("User not found");
            }

            // Save or update trading rules
            const savedRules = await prisma.tradingRuleSet.upsert({
                where: { userId: user.id },
                update: {
                    maxDailyTrades: rules.maxDailyTrades,
                    maxDailyLoss: rules.maxDailyLoss,
                    riskRewardRatio: rules.riskRewardRatio,
                    updatedAt: new Date()
                },
                create: {
                    userId: user.id,
                    maxDailyTrades: rules.maxDailyTrades,
                    maxDailyLoss: rules.maxDailyLoss,
                    riskRewardRatio: rules.riskRewardRatio
                }
            });

            logger.info("Trading rules saved successfully", {
                userId: user.id,
                maxDailyTrades: savedRules.maxDailyTrades,
                maxDailyLoss: savedRules.maxDailyLoss,
                riskRewardRatio: savedRules.riskRewardRatio
            });

            return {
                maxDailyTrades: savedRules.maxDailyTrades,
                maxDailyLoss: savedRules.maxDailyLoss,
                riskRewardRatio: savedRules.riskRewardRatio
            };
        } catch (error) {
            logger.error("Error saving user trading rules", {
                userId,
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Validate trading rules
     */
    validateTradingRules(rules: TradingRules): TradingRulesValidation {
        const errors: string[] = [];

        // Validate max daily trades
        if (!Number.isInteger(rules.maxDailyTrades) || rules.maxDailyTrades < 1 || rules.maxDailyTrades > 50) {
            errors.push("Max daily trades must be an integer between 1 and 50");
        }

        // Validate max daily loss
        if (typeof rules.maxDailyLoss !== 'number' || rules.maxDailyLoss < 100 || rules.maxDailyLoss > 100000) {
            errors.push("Max daily loss must be between ₹100 and ₹1,00,000");
        }

        // Validate risk-reward ratio
        if (typeof rules.riskRewardRatio !== 'number' || rules.riskRewardRatio < 0.5 || rules.riskRewardRatio > 10.0) {
            errors.push("Risk-reward ratio must be between 0.5 and 10.0");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get default trading rules
     */
    getDefaultTradingRules(): TradingRules {
        return {
            maxDailyTrades: 10,
            maxDailyLoss: 1000.0,
            riskRewardRatio: 2.0
        };
    }

    /**
     * Check if user has trading rules set
     */
    async hasTradingRules(userId: string): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId },
                include: { tradingRules: true }
            });

            return user?.tradingRules !== null;
        } catch (error) {
            logger.error("Error checking if user has trading rules", {
                userId,
                error: error instanceof Error ? error.message : "Unknown error"
            });
            return false;
        }
    }

    /**
     * Delete user's trading rules
     */
    async deleteUserTradingRules(userId: string): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (!user) {
                throw new Error("User not found");
            }

            await prisma.tradingRuleSet.delete({
                where: { userId: user.id }
            });

            logger.info("Trading rules deleted successfully", { userId: user.id });
            return true;
        } catch (error) {
            logger.error("Error deleting user trading rules", {
                userId,
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Validate a trade against user's trading rules
     */
    async validateTradeAgainstRules(
        userId: string,
        tradeData: {
            dailyTradesCount: number;
            dailyLoss: number;
            riskRewardRatio: number;
        }
    ): Promise<{ isValid: boolean; violations: string[] }> {
        try {
            const rules = await this.getUserTradingRules(userId);
            if (!rules) {
                // If no rules set, trade is valid
                return { isValid: true, violations: [] };
            }

            const violations: string[] = [];

            // Check daily trades limit
            if (tradeData.dailyTradesCount >= rules.maxDailyTrades) {
                violations.push(`Daily trades limit exceeded (${tradeData.dailyTradesCount}/${rules.maxDailyTrades})`);
            }

            // Check daily loss limit
            if (tradeData.dailyLoss >= rules.maxDailyLoss) {
                violations.push(`Daily loss limit exceeded (₹${tradeData.dailyLoss}/${rules.maxDailyLoss})`);
            }

            // Check risk-reward ratio
            if (tradeData.riskRewardRatio < rules.riskRewardRatio) {
                violations.push(`Risk-reward ratio below minimum (${tradeData.riskRewardRatio}/${rules.riskRewardRatio})`);
            }

            return {
                isValid: violations.length === 0,
                violations
            };
        } catch (error) {
            logger.error("Error validating trade against rules", {
                userId,
                error: error instanceof Error ? error.message : "Unknown error"
            });
            // If validation fails, allow the trade
            return { isValid: true, violations: [] };
        }
    }
}

export const tradingRulesService = new TradingRulesService(); 