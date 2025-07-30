import { PrismaClient, Subscription, SubscriptionStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

interface SubscriptionUsageData {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  trialSubscriptions: number;
  subscriptionGrowth: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  planDistribution: {
    basic: number;
    pro: number;
    enterprise: number;
  };
  churnRate: number;
  averageRevenuePerUser: number;
  monthlyRecurringRevenue: number;
}

interface FeatureAccessAnalytics {
  totalAccessAttempts: number;
  successfulAccesses: number;
  failedAccesses: number;
  mostAccessedFeatures: Array<{
    feature: string;
    accessCount: number;
    successRate: number;
  }>;
  accessByPlan: Array<{
    planName: string;
    accessCount: number;
    uniqueUsers: number;
  }>;
  featureUsageTrends: Array<{
    feature: string;
    dailyUsage: number;
    weeklyUsage: number;
    monthlyUsage: number;
  }>;
}

interface SubscriptionConversionData {
  totalVisitors: number;
  trialSignups: number;
  paidConversions: number;
  conversionRate: number;
  conversionFunnel: {
    pageViews: number;
    pricingPageViews: number;
    checkoutStarts: number;
    successfulPayments: number;
  };
  conversionByPlan: Array<{
    planName: string;
    conversions: number;
    revenue: number;
  }>;
  conversionTrends: Array<{
    date: string;
    conversions: number;
    revenue: number;
  }>;
}

interface SubscriptionHealthData {
  overallHealth: "excellent" | "good" | "fair" | "poor";
  healthScore: number;
  metrics: {
    activeSubscriptions: number;
    expiringSubscriptions: number;
    expiredSubscriptions: number;
    churnRate: number;
    averageSubscriptionDuration: number;
    renewalRate: number;
  };
  alerts: Array<{
    type: "warning" | "error" | "info";
    message: string;
    severity: "low" | "medium" | "high";
  }>;
  recommendations: string[];
}

interface PerformanceMetrics {
  totalRevenue: number;
  averageMonthlySpend: number;
  subscriptionDuration: number;
  planChanges: number;
  renewalRate: number;
  churnRate: number;
  customerLifetimeValue: number;
  monthlyRecurringRevenue: number;
}

export class SubscriptionAnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getSubscriptionUsageAnalytics(): Promise<SubscriptionUsageData> {
    try {
      const [
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        trialSubscriptions,
        subscriptions
      ] = await Promise.all([
        this.prisma.subscription.count(),
        this.prisma.subscription.count({
          where: { status: "ACTIVE" }
        }),
        this.prisma.subscription.count({
          where: { status: "EXPIRED" as any }
        }),
        this.prisma.subscription.count({
          where: { status: "TRIAL" }
        }),
        this.prisma.subscription.findMany({
          include: {
            plan: true,
            payments: true
          }
        })
      ]);

      // Calculate plan distribution
      const planDistribution = {
        basic: 0,
        pro: 0,
        enterprise: 0
      };

      subscriptions.forEach(sub => {
        const planName = sub.plan.name.toLowerCase();
        if (planName.includes("basic")) planDistribution.basic++;
        else if (planName.includes("pro")) planDistribution.pro++;
        else if (planName.includes("enterprise")) planDistribution.enterprise++;
      });

      // Calculate growth rates (mock data for now)
      const subscriptionGrowth = {
        monthly: 15,
        quarterly: 45,
        yearly: 180
      };

      // Calculate churn rate
      const churnRate = expiredSubscriptions / totalSubscriptions * 100;

      // Calculate revenue metrics
      const totalRevenue = subscriptions.reduce((sum, sub) => {
        return sum + sub.payments.reduce((paymentSum, payment) => {
          return paymentSum + (payment.amount || 0);
        }, 0);
      }, 0);

      const averageRevenuePerUser = totalSubscriptions > 0 ? totalRevenue / totalSubscriptions : 0;
      const monthlyRecurringRevenue = activeSubscriptions * averageRevenuePerUser;

      return {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        trialSubscriptions,
        subscriptionGrowth,
        planDistribution,
        churnRate,
        averageRevenuePerUser,
        monthlyRecurringRevenue
      };
    } catch (error) {
      logger.error("Error getting subscription usage analytics:", error);
      throw error;
    }
  }

  async getFeatureAccessAnalytics(): Promise<FeatureAccessAnalytics> {
    try {
      // Mock data for feature access analytics
      // In a real implementation, this would come from a FeatureAccess table
      const totalAccessAttempts = 1250;
      const successfulAccesses = 1100;
      const failedAccesses = 150;

      const mostAccessedFeatures = [
        {
          feature: "ai_coaching",
          accessCount: 450,
          successRate: 95
        },
        {
          feature: "behavioral_analysis",
          accessCount: 380,
          successRate: 92
        },
        {
          feature: "risk_management",
          accessCount: 320,
          successRate: 88
        },
        {
          feature: "trade_validator",
          accessCount: 280,
          successRate: 85
        },
        {
          feature: "live_monitoring",
          accessCount: 200,
          successRate: 90
        }
      ];

      const accessByPlan = [
        {
          planName: "Basic",
          accessCount: 200,
          uniqueUsers: 50
        },
        {
          planName: "Pro",
          accessCount: 750,
          uniqueUsers: 120
        },
        {
          planName: "Enterprise",
          accessCount: 300,
          uniqueUsers: 30
        }
      ];

      const featureUsageTrends = [
        {
          feature: "ai_coaching",
          dailyUsage: 15,
          weeklyUsage: 105,
          monthlyUsage: 450
        },
        {
          feature: "behavioral_analysis",
          dailyUsage: 12,
          weeklyUsage: 84,
          monthlyUsage: 380
        },
        {
          feature: "risk_management",
          dailyUsage: 10,
          weeklyUsage: 70,
          monthlyUsage: 320
        },
        {
          feature: "trade_validator",
          dailyUsage: 8,
          weeklyUsage: 56,
          monthlyUsage: 280
        },
        {
          feature: "live_monitoring",
          dailyUsage: 6,
          weeklyUsage: 42,
          monthlyUsage: 200
        }
      ];

      return {
        totalAccessAttempts,
        successfulAccesses,
        failedAccesses,
        mostAccessedFeatures,
        accessByPlan,
        featureUsageTrends
      };
    } catch (error) {
      logger.error("Error getting feature access analytics:", error);
      throw error;
    }
  }

  async getSubscriptionConversionAnalytics(): Promise<SubscriptionConversionData> {
    try {
      // Mock data for conversion analytics
      const totalVisitors = 5000;
      const trialSignups = 750;
      const paidConversions = 225;
      const conversionRate = (paidConversions / totalVisitors) * 100;

      const conversionFunnel = {
        pageViews: 5000,
        pricingPageViews: 1200,
        checkoutStarts: 450,
        successfulPayments: 225
      };

      const conversionByPlan = [
        {
          planName: "Basic",
          conversions: 45,
          revenue: 405 // 45 * $9
        },
        {
          planName: "Pro",
          conversions: 150,
          revenue: 4350 // 150 * $29
        },
        {
          planName: "Enterprise",
          conversions: 30,
          revenue: 2970 // 30 * $99
        }
      ];

      const conversionTrends = [
        {
          date: "2024-01",
          conversions: 15,
          revenue: 870
        },
        {
          date: "2024-02",
          conversions: 18,
          revenue: 1044
        },
        {
          date: "2024-03",
          conversions: 22,
          revenue: 1276
        },
        {
          date: "2024-04",
          conversions: 25,
          revenue: 1450
        },
        {
          date: "2024-05",
          conversions: 28,
          revenue: 1624
        },
        {
          date: "2024-06",
          conversions: 30,
          revenue: 1740
        }
      ];

      return {
        totalVisitors,
        trialSignups,
        paidConversions,
        conversionRate,
        conversionFunnel,
        conversionByPlan,
        conversionTrends
      };
    } catch (error) {
      logger.error("Error getting subscription conversion analytics:", error);
      throw error;
    }
  }

  async getSubscriptionHealthMonitoring(): Promise<SubscriptionHealthData> {
    try {
      const subscriptions = await this.prisma.subscription.findMany({
        include: {
          plan: true
        }
      });

      const activeSubscriptions = subscriptions.filter(sub => sub.status === "ACTIVE").length;
      const expiringSubscriptions = subscriptions.filter(sub => {
        if (!sub.currentPeriodEnd) return false;
        const daysUntilExpiry = Math.ceil(
          (new Date(sub.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      }).length;

      const expiredSubscriptions = subscriptions.filter(sub => (sub as any).status === "EXPIRED").length;
      const totalSubscriptions = subscriptions.length;

      const churnRate = totalSubscriptions > 0 ? (expiredSubscriptions / totalSubscriptions) * 100 : 0;
      const renewalRate = totalSubscriptions > 0 ? ((activeSubscriptions - expiringSubscriptions) / totalSubscriptions) * 100 : 0;

      // Calculate average subscription duration
      const subscriptionDurations = subscriptions
        .filter(sub => sub.createdAt)
        .map(sub => {
          const endDate = sub.currentPeriodEnd || new Date();
          return Math.ceil(
            (new Date(endDate).getTime() - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
        });

      const averageSubscriptionDuration = subscriptionDurations.length > 0
        ? subscriptionDurations.reduce((sum, duration) => sum + duration, 0) / subscriptionDurations.length
        : 0;

      // Calculate health score
      let healthScore = 100;
      if (churnRate > 10) healthScore -= 20;
      if (expiringSubscriptions > activeSubscriptions * 0.1) healthScore -= 15;
      if (renewalRate < 80) healthScore -= 25;
      if (activeSubscriptions < totalSubscriptions * 0.7) healthScore -= 20;

      const overallHealth = healthScore >= 90 ? "excellent"
        : healthScore >= 75 ? "good"
          : healthScore >= 60 ? "fair"
            : "poor";

      const alerts: Array<{
        type: "warning" | "error" | "info";
        message: string;
        severity: "low" | "medium" | "high";
      }> = [];

      if (churnRate > 10) {
        alerts.push({
          type: "warning",
          message: `High churn rate detected: ${churnRate.toFixed(1)}%`,
          severity: "high"
        });
      }

      if (expiringSubscriptions > activeSubscriptions * 0.1) {
        alerts.push({
          type: "warning",
          message: `${expiringSubscriptions} subscriptions expiring soon`,
          severity: "medium"
        });
      }

      if (renewalRate < 80) {
        alerts.push({
          type: "error",
          message: `Low renewal rate: ${renewalRate.toFixed(1)}%`,
          severity: "high"
        });
      }

      const recommendations: string[] = [];
      if (churnRate > 10) {
        recommendations.push("Implement customer retention strategies");
        recommendations.push("Improve customer support and onboarding");
      }
      if (expiringSubscriptions > 0) {
        recommendations.push("Send renewal reminders to expiring subscriptions");
        recommendations.push("Offer incentives for early renewal");
      }
      if (renewalRate < 80) {
        recommendations.push("Analyze reasons for non-renewal");
        recommendations.push("Improve product value proposition");
      }

      return {
        overallHealth,
        healthScore,
        metrics: {
          activeSubscriptions,
          expiringSubscriptions,
          expiredSubscriptions,
          churnRate,
          averageSubscriptionDuration,
          renewalRate
        },
        alerts,
        recommendations
      };
    } catch (error) {
      logger.error("Error getting subscription health monitoring:", error);
      throw error;
    }
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const subscriptions = await this.prisma.subscription.findMany({
        include: {
          plan: true,
          payments: true
        }
      });

      const totalRevenue = subscriptions.reduce((sum, sub) => {
        return sum + sub.payments.reduce((paymentSum, payment) => {
          return paymentSum + (payment.amount || 0);
        }, 0);
      }, 0);

      const activeSubscriptions = subscriptions.filter(sub => sub.status === "ACTIVE");
      const averageMonthlySpend = activeSubscriptions.length > 0
        ? totalRevenue / activeSubscriptions.length
        : 0;

      const subscriptionDurations = subscriptions
        .filter(sub => sub.createdAt)
        .map(sub => {
          const endDate = sub.currentPeriodEnd || new Date();
          return Math.ceil(
            (new Date(endDate).getTime() - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
        });

      const subscriptionDuration = subscriptionDurations.length > 0
        ? subscriptionDurations.reduce((sum, duration) => sum + duration, 0) / subscriptionDurations.length
        : 0;

      // Mock data for plan changes and renewal rate
      const planChanges = 45; // Mock data
      const renewalRate = 85; // Mock data
      const churnRate = 15; // Mock data

      const customerLifetimeValue = averageMonthlySpend * (subscriptionDuration / 30);
      const monthlyRecurringRevenue = activeSubscriptions.length * averageMonthlySpend;

      return {
        totalRevenue,
        averageMonthlySpend,
        subscriptionDuration,
        planChanges,
        renewalRate,
        churnRate,
        customerLifetimeValue,
        monthlyRecurringRevenue
      };
    } catch (error) {
      logger.error("Error getting performance metrics:", error);
      throw error;
    }
  }

  async getUserAnalytics(userId: string): Promise<{
    subscriptionDuration: number;
    totalSpent: number;
    averageMonthlySpend: number;
    planChanges: number;
    featureUsage: Array<{
      feature: string;
      usageCount: number;
      lastUsed: Date;
    }>;
    paymentHistory: Array<{
      date: Date;
      amount: number;
      status: string;
    }>;
  }> {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId },
        include: {
          plan: true,
          payments: true
        }
      });

      if (!subscription) {
        return {
          subscriptionDuration: 0,
          totalSpent: 0,
          averageMonthlySpend: 0,
          planChanges: 0,
          featureUsage: [],
          paymentHistory: []
        };
      }

      const subscriptionDuration = subscription.createdAt
        ? Math.ceil(
          (new Date().getTime() - new Date(subscription.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        : 0;

      const totalSpent = subscription.payments.reduce((sum, payment) => {
        return sum + (payment.amount || 0);
      }, 0);

      const averageMonthlySpend = subscriptionDuration > 0
        ? (totalSpent / (subscriptionDuration / 30))
        : 0;

      // Mock data for plan changes and feature usage
      const planChanges = 2; // Mock data

      const featureUsage = [
        {
          feature: "ai_coaching",
          usageCount: 25,
          lastUsed: new Date()
        },
        {
          feature: "behavioral_analysis",
          usageCount: 18,
          lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          feature: "risk_management",
          usageCount: 12,
          lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      ];

      const paymentHistory = subscription.payments.map(payment => ({
        date: payment.createdAt,
        amount: payment.amount || 0,
        status: payment.status
      }));

      return {
        subscriptionDuration,
        totalSpent,
        averageMonthlySpend,
        planChanges,
        featureUsage,
        paymentHistory
      };
    } catch (error) {
      logger.error("Error getting user analytics:", error);
      throw error;
    }
  }

  async exportAnalyticsReport(): Promise<{
    subscriptionUsage: SubscriptionUsageData;
    featureAccess: FeatureAccessAnalytics;
    conversion: SubscriptionConversionData;
    health: SubscriptionHealthData;
    performance: PerformanceMetrics;
    generatedAt: Date;
  }> {
    try {
      const [
        subscriptionUsage,
        featureAccess,
        conversion,
        health,
        performance
      ] = await Promise.all([
        this.getSubscriptionUsageAnalytics(),
        this.getFeatureAccessAnalytics(),
        this.getSubscriptionConversionAnalytics(),
        this.getSubscriptionHealthMonitoring(),
        this.getPerformanceMetrics()
      ]);

      return {
        subscriptionUsage,
        featureAccess,
        conversion,
        health,
        performance,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error("Error exporting analytics report:", error);
      throw error;
    }
  }
}

export const subscriptionAnalyticsService = new SubscriptionAnalyticsService(); 