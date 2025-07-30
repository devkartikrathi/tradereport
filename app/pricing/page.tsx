import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { planService } from "@/lib/services/plan-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Shield, Users, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { Plan } from "@prisma/client";
import PlanCard from "@/components/pricing/plan-card";
import PlanComparison from "@/components/pricing/plan-comparison";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - TradePulse | AI-Powered Trading Analytics",
  description: "Choose your perfect trading analytics plan. Get AI-powered insights, advanced analytics, and personalized coaching for Indian markets. Start with a free trial.",
  keywords: "trading analytics pricing, AI trading insights, Indian markets, NSE BSE analytics, trading performance, subscription plans",
  openGraph: {
    title: "Pricing - TradePulse | AI-Powered Trading Analytics",
    description: "Choose your perfect trading analytics plan. Get AI-powered insights, advanced analytics, and personalized coaching for Indian markets.",
    type: "website",
  },
};

export default async function PricingPage() {
  const { userId } = await auth();
  const user = await currentUser();

  // Get or create user in database
  let userRecord = null;
  let currentSubscription = null;

  try {
    if (userId) {
      userRecord = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { 
          subscription: {
            include: {
              plan: true
            }
          }
        }
      });

      // Create user if doesn't exist
      if (!userRecord) {
        userRecord = await prisma.user.create({
          data: {
            clerkId: userId,
            email: user?.emailAddresses?.[0]?.emailAddress || "",
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
          },
          include: { 
            subscription: {
              include: {
                plan: true
              }
            }
          }
        });
      }

      currentSubscription = userRecord?.subscription;
    }
  } catch (error) {
    logger.error("Error fetching user data for pricing page", { 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }

  // Fetch active plans
  let plans: Plan[] = [];
  try {
    plans = await planService.getActivePlans();
  } catch (error) {
    logger.error("Error fetching plans for pricing page", { 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }

  // Sort plans by price (lowest to highest)
  const sortedPlans = plans.sort((a, b) => a.price - b.price);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Choose Your Trading Analytics Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Unlock powerful AI-powered trading insights, advanced analytics, and personalized coaching 
            to improve your trading performance in Indian markets.
          </p>
        </div>

        {/* Current Subscription Banner */}
        {currentSubscription && (
          <div className="mb-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Crown className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Current Plan: {currentSubscription.plan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(currentSubscription.plan.price)} / {currentSubscription.plan.billingCycle}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {sortedPlans.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isPopular={index === 1} // Middle plan is popular
              isCurrentPlan={currentSubscription?.planId === plan.id}
              isSignedIn={!!userId}
            />
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Compare Plan Features
          </h2>
          <PlanComparison 
            plans={sortedPlans}
            selectedPlanId={currentSubscription?.planId}
          />
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose TradePulse?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">
                Your trading data is encrypted and secure. We never share your information.
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-muted-foreground">
                Google Gemini AI analyzes your patterns and provides personalized recommendations.
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Get instant insights and live monitoring of your trading performance.
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Indian Market Focus</h3>
              <p className="text-sm text-muted-foreground">
                Designed specifically for Indian markets with NSE/BSE support.
              </p>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <FAQItem
              question="Can I change my plan anytime?"
              answer="Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards, debit cards, and UPI payments. All payments are processed securely through our payment partners."
            />
            <FAQItem
              question="Is there a free trial available?"
              answer="Yes, we offer a 7-day free trial for all plans. You can cancel anytime during the trial period without any charges."
            />
            <FAQItem
              question="Can I cancel my subscription?"
              answer="Absolutely! You can cancel your subscription at any time from your account settings. You&apos;ll continue to have access until the end of your current billing period."
            />
            <FAQItem
              question="Do you support Indian brokers?"
              answer="Yes, we support all major Indian brokers including Zerodha, Angel One, ICICI Direct, Upstox, and many more."
            />
            <FAQItem
              question="Is my data secure?"
              answer="Yes, we use bank-level encryption and security measures to protect your trading data. We never share your information with third parties."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
} 