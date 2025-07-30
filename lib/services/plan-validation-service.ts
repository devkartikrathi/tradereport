import { PrismaClient, Plan } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

export interface PlanValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface PricingValidationResult {
    isValid: boolean;
    errors: string[];
    priceAnalysis: {
        isCompetitive: boolean;
        suggestedPrice?: number;
        marketAverage?: number;
    };
}

export interface FeatureValidationResult {
    isValid: boolean;
    errors: string[];
    featureAnalysis: {
        totalFeatures: number;
        coreFeatures: number;
        premiumFeatures: number;
        missingCoreFeatures: string[];
    };
}

export class PlanValidationService {
    /**
     * Validate plan pricing
     */
    async validatePlanPricing(plan: Plan): Promise<PricingValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Basic pricing validation
        if (plan.price < 0) {
            errors.push("Plan price cannot be negative");
        }

        if (plan.price > 10000) {
            warnings.push("Plan price seems unusually high");
        }

        // Check for competitive pricing
        const similarPlans = await prisma.plan.findMany({
            where: {
                billingCycle: plan.billingCycle,
                isActive: true,
                id: { not: plan.id }
            }
        });

        const avgPrice = similarPlans.length > 0
            ? similarPlans.reduce((sum, p) => sum + p.price, 0) / similarPlans.length
            : 0;

        const isCompetitive = avgPrice === 0 || plan.price <= avgPrice * 1.5;
        const suggestedPrice = avgPrice > 0 ? avgPrice * 0.9 : plan.price;

        return {
            isValid: errors.length === 0,
            errors,
            priceAnalysis: {
                isCompetitive,
                suggestedPrice,
                marketAverage: avgPrice
            }
        };
    }

    /**
     * Validate plan features
     */
    async validatePlanFeatures(plan: Plan): Promise<FeatureValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Basic feature validation
        if (!plan.features || plan.features.length === 0) {
            errors.push("Plan must have at least one feature");
        }

        // Check for core features
        const coreFeatures = ['basic_analytics', 'trade_upload'];
        const missingCoreFeatures = coreFeatures.filter(feature =>
            !plan.features.includes(feature)
        );

        if (missingCoreFeatures.length > 0) {
            warnings.push(`Missing core features: ${missingCoreFeatures.join(", ")}`);
        }

        // Analyze feature distribution
        const totalFeatures = plan.features.length;
        const coreFeaturesCount = plan.features.filter(f => coreFeatures.includes(f)).length;
        const premiumFeaturesCount = totalFeatures - coreFeaturesCount;

        return {
            isValid: errors.length === 0,
            errors,
            featureAnalysis: {
                totalFeatures,
                coreFeatures: coreFeaturesCount,
                premiumFeatures: premiumFeaturesCount,
                missingCoreFeatures
            }
        };
    }

    /**
     * Validate plan conflicts
     */
    async validatePlanConflicts(plan: Plan): Promise<PlanValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check for naming conflicts
        const existingPlan = await prisma.plan.findFirst({
            where: {
                name: plan.name,
                id: { not: plan.id }
            }
        });

        if (existingPlan) {
            errors.push(`Plan name "${plan.name}" already exists`);
        }

        // Check for pricing conflicts
        const similarPlans = await prisma.plan.findMany({
            where: {
                billingCycle: plan.billingCycle,
                isActive: true,
                id: { not: plan.id }
            }
        });

        const conflictingPlans = similarPlans.filter(p =>
            Math.abs(p.price - plan.price) < 10 && p.price !== plan.price
        );

        if (conflictingPlans.length > 0) {
            warnings.push(`Similar pricing to existing plans: ${conflictingPlans.map(p => p.name).join(", ")}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate plan lifecycle
     */
    async validatePlanLifecycle(plan: Plan): Promise<PlanValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check if plan has active subscriptions
        if (!plan.isActive) {
            const activeSubscriptions = await prisma.subscription.count({
                where: {
                    planId: plan.id,
                    status: { in: ['ACTIVE', 'TRIAL'] }
                }
            });

            if (activeSubscriptions > 0) {
                errors.push(`Cannot deactivate plan with ${activeSubscriptions} active subscriptions`);
            }
        }

        // Check plan age
        const planAge = Date.now() - plan.createdAt.getTime();
        const daysOld = planAge / (1000 * 60 * 60 * 24);

        if (daysOld > 365 && plan.isActive) {
            warnings.push("Plan is over 1 year old - consider reviewing");
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Comprehensive plan validation
     */
    async validatePlan(plan: Plan): Promise<PlanValidationResult> {
        const [pricingValidation, featureValidation, conflictValidation, lifecycleValidation] = await Promise.all([
            this.validatePlanPricing(plan),
            this.validatePlanFeatures(plan),
            this.validatePlanConflicts(plan),
            this.validatePlanLifecycle(plan)
        ]);

        const errors = [
            ...pricingValidation.errors,
            ...featureValidation.errors,
            ...conflictValidation.errors,
            ...lifecycleValidation.errors
        ];

        const warnings = [
            ...pricingValidation.warnings,
            ...featureValidation.warnings,
            ...conflictValidation.warnings,
            ...lifecycleValidation.warnings
        ];

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate plan transition (upgrade/downgrade)
     */
    async validatePlanTransition(
        currentPlan: Plan,
        newPlan: Plan,
        isUpgrade: boolean
    ): Promise<PlanValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate price direction
        if (isUpgrade && newPlan.price <= currentPlan.price) {
            errors.push("Upgrade plan must be more expensive than current plan");
        }

        if (!isUpgrade && newPlan.price >= currentPlan.price) {
            errors.push("Downgrade plan must be less expensive than current plan");
        }

        // Check feature compatibility
        const lostFeatures = currentPlan.features.filter(feature =>
            !newPlan.features.includes(feature)
        );

        if (lostFeatures.length > 0) {
            warnings.push(`Will lose access to: ${lostFeatures.join(", ")}`);
        }

        // Check billing cycle compatibility
        if (currentPlan.billingCycle !== newPlan.billingCycle) {
            warnings.push(`Billing cycle will change from ${currentPlan.billingCycle} to ${newPlan.billingCycle}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get plan health score
     */
    async getPlanHealthScore(plan: Plan): Promise<number> {
        try {
            const [pricingValidation, featureValidation, conflictValidation, lifecycleValidation] = await Promise.all([
                this.validatePlanPricing(plan),
                this.validatePlanFeatures(plan),
                this.validatePlanConflicts(plan),
                this.validatePlanLifecycle(plan)
            ]);

            let score = 100;

            // Deduct points for errors
            score -= pricingValidation.errors.length * 20;
            score -= featureValidation.errors.length * 15;
            score -= conflictValidation.errors.length * 25;
            score -= lifecycleValidation.errors.length * 10;

            // Deduct points for warnings
            score -= pricingValidation.warnings.length * 5;
            score -= featureValidation.warnings.length * 3;
            score -= conflictValidation.warnings.length * 8;
            score -= lifecycleValidation.warnings.length * 2;

            // Bonus for good practices
            if (plan.features.length >= 5) score += 10;
            if (plan.price > 0 && plan.price < 1000) score += 5;
            if (plan.isActive) score += 5;

            return Math.max(0, Math.min(100, score));
        } catch (error) {
            logger.error("Error calculating plan health score", { planId: plan.id, error: error instanceof Error ? error.message : "Unknown error" });
            return 50; // Default score on error
        }
    }

    /**
     * Get plan recommendations
     */
    async getPlanRecommendations(plan: Plan): Promise<string[]> {
        const recommendations: string[] = [];

        const [pricingValidation, featureValidation] = await Promise.all([
            this.validatePlanPricing(plan),
            this.validatePlanFeatures(plan)
        ]);

        // Pricing recommendations
        if (!pricingValidation.priceAnalysis.isCompetitive) {
            recommendations.push("Consider adjusting pricing to be more competitive");
        }

        if (plan.price === 0) {
            recommendations.push("Consider adding premium features to justify paid plans");
        }

        // Feature recommendations
        if (featureValidation.featureAnalysis.totalFeatures < 3) {
            recommendations.push("Consider adding more features to increase value");
        }

        if (featureValidation.featureAnalysis.missingCoreFeatures.length > 0) {
            recommendations.push("Add core features to improve user experience");
        }

        // General recommendations
        if (!plan.description) {
            recommendations.push("Add a detailed description to improve conversion");
        }

        if (plan.maxUsers === null) {
            recommendations.push("Consider setting user limits for better resource management");
        }

        return recommendations;
    }
}

export const planValidationService = new PlanValidationService(); 