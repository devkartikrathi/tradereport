import { PrismaClient, Plan } from "@prisma/client";
import { logger } from "@/lib/logger";
import { cacheService } from "@/lib/cache-service";

const prisma = new PrismaClient();

export interface PlanFeature {
    name: string;
    description: string;
    category: string;
}

export interface PlanWithFeatures extends Plan {
    features: string[];
}

export class PlanService {
    private readonly CACHE_KEY_PLANS = "pricing:active_plans";
    private readonly CACHE_TTL = 300; // 5 minutes

    /**
     * Get active plans for pricing page with caching
     */
    async getActivePlans(): Promise<Plan[]> {
        try {
            // Try to get from cache first
            const cachedPlans = await cacheService.get<Plan[]>(this.CACHE_KEY_PLANS);
            if (cachedPlans) {
                logger.debug("Plans retrieved from cache");
                return cachedPlans;
            }

            // Fetch from database
            const plans = await prisma.plan.findMany({
                where: { isActive: true },
                orderBy: { price: "asc" }
            });

            // Cache the results
            await cacheService.set(this.CACHE_KEY_PLANS, plans, this.CACHE_TTL);

            logger.info("Active plans fetched from database", { count: plans.length });
            return plans;
        } catch (error) {
            logger.error("Error fetching active plans", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Get specific plan by ID
     */
    async getPlanById(id: string): Promise<Plan | null> {
        try {
            const plan = await prisma.plan.findUnique({
                where: { id, isActive: true }
            });

            if (!plan) {
                logger.warn("Plan not found", { planId: id });
                return null;
            }

            logger.debug("Plan retrieved by ID", { planId: id, planName: plan.name });
            return plan;
        } catch (error) {
            logger.error("Error fetching plan by ID", {
                planId: id,
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Get plan features for comparison
     */
    async getPlanFeatures(): Promise<PlanFeature[]> {
        try {
            // This could be extended to fetch from a separate features table
            // For now, return common features based on plan tiers
            const features: PlanFeature[] = [
                {
                    name: "Basic Analytics",
                    description: "Core trading analytics and performance metrics",
                    category: "analytics"
                },
                {
                    name: "Advanced Analytics",
                    description: "Advanced charts, patterns, and detailed insights",
                    category: "analytics"
                },
                {
                    name: "AI Chat Assistant",
                    description: "Google Gemini AI-powered trading insights",
                    category: "ai"
                },
                {
                    name: "Trade Validation",
                    description: "AI-powered trade idea validation with image analysis",
                    category: "ai"
                },
                {
                    name: "Behavioral Analysis",
                    description: "Trading pattern recognition and behavioral insights",
                    category: "behavioral"
                },
                {
                    name: "Risk Management",
                    description: "Advanced risk assessment and management tools",
                    category: "risk"
                },
                {
                    name: "Performance Goals",
                    description: "Goal setting and progress tracking",
                    category: "goals"
                },
                {
                    name: "Live Monitoring",
                    description: "Real-time trade monitoring and alerts",
                    category: "monitoring"
                },
                {
                    name: "Broker Integration",
                    description: "Direct broker connection and data import",
                    category: "integration"
                },
                {
                    name: "Priority Support",
                    description: "Priority customer support and assistance",
                    category: "support"
                }
            ];

            return features;
        } catch (error) {
            logger.error("Error fetching plan features", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }

    /**
     * Get plan recommendation based on user profile
     */
    async getPlanRecommendation(userId: string): Promise<Plan | null> {
        try {
            // Get user's trading data to make recommendations
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    trades: true,
                    analytics: true,
                    subscription: {
                        include: {
                            plan: true
                        }
                    }
                }
            });

            if (!user) {
                logger.warn("User not found for plan recommendation", { userId });
                return null;
            }

            // If user already has a subscription, return current plan
            if (user.subscription) {
                return user.subscription.plan;
            }

            // Simple recommendation logic based on trading activity
            const tradeCount = user.trades.length;
            const hasAnalytics = user.analytics !== null;

            // Get all active plans
            const plans = await this.getActivePlans();
            if (plans.length === 0) return null;

            // Recommend based on activity level
            if (tradeCount > 100 || hasAnalytics) {
                // Active trader - recommend premium plan
                return plans.find(p => p.name.toLowerCase().includes("premium")) || plans[plans.length - 1];
            } else if (tradeCount > 20) {
                // Moderate trader - recommend standard plan
                return plans.find(p => p.name.toLowerCase().includes("standard")) || plans[Math.floor(plans.length / 2)];
            } else {
                // New trader - recommend basic plan
                return plans[0];
            }
        } catch (error) {
            logger.error("Error getting plan recommendation", {
                userId,
                error: error instanceof Error ? error.message : "Unknown error"
            });
            return null;
        }
    }

    /**
 * Clear plan cache
 */
    async clearCache(): Promise<void> {
        try {
            cacheService.delete(this.CACHE_KEY_PLANS);
            logger.debug("Plan cache cleared");
        } catch (error) {
            logger.error("Error clearing plan cache", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    /**
     * Get plan statistics for admin
     */
    async getPlanStatistics(): Promise<{
        totalPlans: number;
        activePlans: number;
        plansByBillingCycle: Record<string, number>;
    }> {
        try {
            const [totalPlans, activePlans] = await Promise.all([
                prisma.plan.count(),
                prisma.plan.count({ where: { isActive: true } })
            ]);

            const plansByBillingCycle = await prisma.plan.groupBy({
                by: ['billingCycle'],
                where: { isActive: true },
                _count: { billingCycle: true }
            });

            const billingCycleStats: Record<string, number> = {};
            plansByBillingCycle.forEach(stat => {
                billingCycleStats[stat.billingCycle] = stat._count.billingCycle;
            });

            return {
                totalPlans,
                activePlans,
                plansByBillingCycle: billingCycleStats
            };
        } catch (error) {
            logger.error("Error fetching plan statistics", {
                error: error instanceof Error ? error.message : "Unknown error"
            });
            throw error;
        }
    }
}

// Export singleton instance
export const planService = new PlanService(); 