import { PrismaClient, Plan, Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

export interface CreatePlanData {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    billingCycle: "monthly" | "quarterly" | "yearly";
    features: string[];
    isActive?: boolean;
    maxUsers?: number;
}

export interface UpdatePlanData {
    name?: string;
    description?: string;
    price?: number;
    currency?: string;
    billingCycle?: "monthly" | "quarterly" | "yearly";
    features?: string[];
    isActive?: boolean;
    maxUsers?: number;
}

export interface PlanValidationResult {
    isValid: boolean;
    errors: string[];
}

export class PlanManagementService {
    /**
     * Create a new subscription plan
     */
    async createPlan(data: CreatePlanData): Promise<Plan> {
        try {
            // Validate plan data
            const validation = this.validatePlanData(data);
            if (!validation.isValid) {
                throw new Error(`Invalid plan data: ${validation.errors.join(", ")}`);
            }

            // Check if plan name already exists
            const existingPlan = await prisma.plan.findUnique({
                where: { name: data.name }
            });

            if (existingPlan) {
                throw new Error(`Plan with name "${data.name}" already exists`);
            }

            // Create the plan
            const plan = await prisma.plan.create({
                data: {
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    currency: data.currency || "INR",
                    billingCycle: data.billingCycle,
                    features: data.features,
                    isActive: data.isActive ?? true,
                    maxUsers: data.maxUsers
                }
            });

            logger.info("Plan created successfully", { planId: plan.id, planName: plan.name });
            return plan;
        } catch (error) {
            logger.error("Error creating plan", { error: error instanceof Error ? error.message : "Unknown error" });
            throw error;
        }
    }

    /**
     * Get all plans with optional filtering
     */
    async getPlans(options?: {
        isActive?: boolean;
        includeInactive?: boolean;
    }): Promise<Plan[]> {
        try {
            const where: Prisma.PlanWhereInput = {};

            if (options?.isActive !== undefined) {
                where.isActive = options.isActive;
            }

            const plans = await prisma.plan.findMany({
                where,
                orderBy: { createdAt: "desc" }
            });

            return plans;
        } catch (error) {
            logger.error("Error fetching plans", { error: error instanceof Error ? error.message : "Unknown error" });
            throw error;
        }
    }

    /**
     * Get a specific plan by ID
     */
    async getPlanById(id: string): Promise<Plan | null> {
        try {
            const plan = await prisma.plan.findUnique({
                where: { id }
            });

            return plan;
        } catch (error) {
            logger.error("Error fetching plan by ID", { planId: id, error: error instanceof Error ? error.message : "Unknown error" });
            throw error;
        }
    }

    /**
     * Get a plan by name
     */
    async getPlanByName(name: string): Promise<Plan | null> {
        try {
            const plan = await prisma.plan.findUnique({
                where: { name }
            });

            return plan;
        } catch (error) {
            logger.error("Error fetching plan by name", { planName: name, error: error instanceof Error ? error.message : "Unknown error" });
            throw error;
        }
    }

    /**
     * Update an existing plan
     */
    async updatePlan(id: string, data: UpdatePlanData): Promise<Plan> {
        try {
            // Check if plan exists
            const existingPlan = await prisma.plan.findUnique({
                where: { id }
            });

            if (!existingPlan) {
                throw new Error(`Plan with ID "${id}" not found`);
            }

            // Validate plan data if provided
            if (data.name || data.price || data.billingCycle || data.features) {
                const validationData: CreatePlanData = {
                    name: data.name || existingPlan.name,
                    description: data.description || existingPlan.description || undefined,
                    price: data.price || existingPlan.price,
                    currency: data.currency || existingPlan.currency,
                    billingCycle: data.billingCycle || existingPlan.billingCycle as "monthly" | "quarterly" | "yearly",
                    features: data.features || existingPlan.features,
                    isActive: data.isActive !== undefined ? data.isActive : existingPlan.isActive,
                    maxUsers: data.maxUsers !== undefined ? data.maxUsers : existingPlan.maxUsers
                };

                const validation = this.validatePlanData(validationData);
                if (!validation.isValid) {
                    throw new Error(`Invalid plan data: ${validation.errors.join(", ")}`);
                }
            }

            // Check if new name conflicts with existing plan
            if (data.name && data.name !== existingPlan.name) {
                const nameConflict = await prisma.plan.findUnique({
                    where: { name: data.name }
                });

                if (nameConflict) {
                    throw new Error(`Plan with name "${data.name}" already exists`);
                }
            }

            // Update the plan
            const updatedPlan = await prisma.plan.update({
                where: { id },
                data
            });

            logger.info("Plan updated successfully", { planId: id, planName: updatedPlan.name });
            return updatedPlan;
        } catch (error) {
            logger.error("Error updating plan", { planId: id, error: error instanceof Error ? error.message : "Unknown error" });
            throw error;
        }
    }

    /**
     * Delete a plan (soft delete by setting isActive to false)
     */
    async deletePlan(id: string): Promise<Plan> {
        try {
            // Check if plan exists
            const existingPlan = await prisma.plan.findUnique({
                where: { id }
            });

            if (!existingPlan) {
                throw new Error(`Plan with ID "${id}" not found`);
            }

            // Check if plan has active subscriptions
            const activeSubscriptions = await prisma.subscription.count({
                where: {
                    planId: id,
                    status: { in: ["ACTIVE", "TRIAL"] }
                }
            });

            if (activeSubscriptions > 0) {
                throw new Error(`Cannot delete plan with ${activeSubscriptions} active subscriptions`);
            }

            // Soft delete by setting isActive to false
            const deletedPlan = await prisma.plan.update({
                where: { id },
                data: { isActive: false }
            });

            logger.info("Plan deleted successfully", { planId: id, planName: deletedPlan.name });
            return deletedPlan;
        } catch (error) {
            logger.error("Error deleting plan", { planId: id, error: error instanceof Error ? error.message : "Unknown error" });
            throw error;
        }
    }

    /**
     * Validate plan data
     */
    private validatePlanData(data: CreatePlanData): PlanValidationResult {
        const errors: string[] = [];

        // Validate name
        if (!data.name || data.name.trim().length === 0) {
            errors.push("Plan name is required");
        } else if (data.name.length > 100) {
            errors.push("Plan name must be less than 100 characters");
        }

        // Validate price
        if (data.price < 0) {
            errors.push("Plan price must be non-negative");
        }

        // Validate billing cycle
        const validBillingCycles = ["monthly", "quarterly", "yearly"];
        if (!validBillingCycles.includes(data.billingCycle)) {
            errors.push("Billing cycle must be one of: monthly, quarterly, yearly");
        }

        // Validate features
        if (!data.features || data.features.length === 0) {
            errors.push("At least one feature must be specified");
        }

        // Validate maxUsers
        if (data.maxUsers !== undefined && data.maxUsers <= 0) {
            errors.push("Max users must be positive or null for unlimited");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get plan statistics
     */
    async getPlanStatistics(): Promise<{
        totalPlans: number;
        activePlans: number;
        inactivePlans: number;
        plansByBillingCycle: Record<string, number>;
    }> {
        try {
            const [totalPlans, activePlans, inactivePlans, plansByBillingCycle] = await Promise.all([
                prisma.plan.count(),
                prisma.plan.count({ where: { isActive: true } }),
                prisma.plan.count({ where: { isActive: false } }),
                prisma.plan.groupBy({
                    by: ["billingCycle"],
                    _count: { billingCycle: true }
                })
            ]);

            const billingCycleStats: Record<string, number> = {};
            plansByBillingCycle.forEach((group) => {
                billingCycleStats[group.billingCycle] = group._count.billingCycle;
            });

            return {
                totalPlans,
                activePlans,
                inactivePlans,
                plansByBillingCycle: billingCycleStats
            };
        } catch (error) {
            logger.error("Error fetching plan statistics", { error: error instanceof Error ? error.message : "Unknown error" });
            throw error;
        }
    }

    /**
     * Seed default plans
     */
    async seedDefaultPlans(): Promise<void> {
        try {
            const defaultPlans: CreatePlanData[] = [
                {
                    name: "Free",
                    description: "Basic trading analytics for individual traders",
                    price: 0,
                    billingCycle: "monthly",
                    features: [
                        "Basic Analytics Dashboard",
                        "Trade Data Upload (up to 100 trades/month)",
                        "Basic Performance Metrics",
                        "Email Support"
                    ],
                    maxUsers: 1
                },
                {
                    name: "Pro",
                    description: "Advanced analytics and AI-powered insights for serious traders",
                    price: 999,
                    billingCycle: "monthly",
                    features: [
                        "Advanced Analytics Dashboard",
                        "Unlimited Trade Data Upload",
                        "AI-Powered Trading Insights",
                        "Behavioral Pattern Analysis",
                        "Risk Management Coaching",
                        "Real-time Trade Monitoring",
                        "Performance Goal Setting",
                        "Priority Email Support",
                        "Market Context Integration"
                    ],
                    maxUsers: 1
                },
                {
                    name: "Enterprise",
                    description: "Complete trading analytics platform for teams and institutions",
                    price: 4999,
                    billingCycle: "monthly",
                    features: [
                        "All Pro Features",
                        "Team Management",
                        "Advanced Reporting",
                        "API Access",
                        "Custom Integrations",
                        "Dedicated Support",
                        "White-label Options",
                        "Advanced Security Features"
                    ],
                    maxUsers: null // Unlimited
                }
            ];

            for (const planData of defaultPlans) {
                const existingPlan = await this.getPlanByName(planData.name);
                if (!existingPlan) {
                    await this.createPlan(planData);
                    logger.info(`Default plan "${planData.name}" created`);
                }
            }

            logger.info("Default plans seeding completed");
        } catch (error) {
            logger.error("Error seeding default plans", { error: error instanceof Error ? error.message : "Unknown error" });
            throw error;
        }
    }

    /**
     * Compare plans
     */
    async comparePlans(planIds: string[]): Promise<Plan[]> {
        try {
            const plans = await prisma.plan.findMany({
                where: {
                    id: { in: planIds }
                },
                orderBy: { price: "asc" }
            });

            if (plans.length !== planIds.length) {
                const foundIds = plans.map(p => p.id);
                const missingIds = planIds.filter(id => !foundIds.includes(id));
                throw new Error(`Plans not found: ${missingIds.join(", ")}`);
            }

            return plans;
        } catch (error) {
            logger.error("Error comparing plans", { planIds, error: error instanceof Error ? error.message : "Unknown error" });
            throw error;
        }
    }
}

export const planManagementService = new PlanManagementService(); 