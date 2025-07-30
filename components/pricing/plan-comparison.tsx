"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, Crown, Zap } from "lucide-react";
import { Plan } from "@prisma/client";

interface PlanComparisonProps {
  plans: Plan[];
  selectedPlanId?: string;
  onPlanSelect?: (planId: string) => void;
}

export default function PlanComparison({
  plans,
  selectedPlanId,
  onPlanSelect
}: PlanComparisonProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Get all unique features from all plans
  const allFeatures = new Set<string>();
  plans.forEach(plan => {
    plan.features.forEach((feature: string) => allFeatures.add(feature));
  });

  const featuresList = Array.from(allFeatures);

  // Group features by category
  const featureCategories = {
    analytics: featuresList.filter(f => 
      f.toLowerCase().includes("analytics") || 
      f.toLowerCase().includes("chart") ||
      f.toLowerCase().includes("performance")
    ),
    ai: featuresList.filter(f => 
      f.toLowerCase().includes("ai") || 
      f.toLowerCase().includes("chat") ||
      f.toLowerCase().includes("validation") ||
      f.toLowerCase().includes("coaching")
    ),
    behavioral: featuresList.filter(f => 
      f.toLowerCase().includes("behavioral") || 
      f.toLowerCase().includes("pattern") ||
      f.toLowerCase().includes("insight")
    ),
    risk: featuresList.filter(f => 
      f.toLowerCase().includes("risk") || 
      f.toLowerCase().includes("management")
    ),
    monitoring: featuresList.filter(f => 
      f.toLowerCase().includes("monitoring") || 
      f.toLowerCase().includes("live") ||
      f.toLowerCase().includes("alert")
    ),
    integration: featuresList.filter(f => 
      f.toLowerCase().includes("broker") || 
      f.toLowerCase().includes("integration") ||
      f.toLowerCase().includes("import")
    ),
    support: featuresList.filter(f => 
      f.toLowerCase().includes("support") || 
      f.toLowerCase().includes("priority")
    )
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("basic") || name.includes("starter")) return <Zap className="h-4 w-4" />;
    if (name.includes("premium") || name.includes("pro")) return <Crown className="h-4 w-4" />;
    return <Star className="h-4 w-4" />;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "analytics": return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case "ai": return <div className="w-2 h-2 bg-purple-500 rounded-full" />;
      case "behavioral": return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case "risk": return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case "monitoring": return <div className="w-2 h-2 bg-orange-500 rounded-full" />;
      case "integration": return <div className="w-2 h-2 bg-indigo-500 rounded-full" />;
      case "support": return <div className="w-2 h-2 bg-pink-500 rounded-full" />;
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "analytics": return "Analytics";
      case "ai": return "AI Features";
      case "behavioral": return "Behavioral Analysis";
      case "risk": return "Risk Management";
      case "monitoring": return "Monitoring";
      case "integration": return "Integration";
      case "support": return "Support";
      default: return category;
    }
  };

  const getFilteredFeatures = () => {
    if (activeTab === "all") return featuresList;
    return featureCategories[activeTab as keyof typeof featureCategories] || [];
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          All Features
        </button>
        {Object.entries(featureCategories).map(([category, features]) => (
          features.length > 0 && (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {getCategoryIcon(category)}
              <span>{getCategoryName(category)}</span>
            </button>
          )
        ))}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold min-w-[200px]">
                    Features
                  </th>
                  {plans.map(plan => (
                    <th 
                      key={plan.id} 
                      className={`text-center p-4 font-semibold min-w-[180px] cursor-pointer transition-colors ${
                        selectedPlanId === plan.id 
                          ? "bg-primary/10 border-b-2 border-primary" 
                          : "hover:bg-muted/30"
                      }`}
                      onClick={() => onPlanSelect?.(plan.id)}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {getPlanIcon(plan.name)}
                        <span>{plan.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getFilteredFeatures().map(feature => (
                  <tr key={feature} className="border-b hover:bg-muted/20">
                    <td className="p-4 font-medium">
                      <div className="flex items-center space-x-2">
                                                 {getCategoryIcon(
                           Object.entries(featureCategories).find(([, features]) => 
                             features.includes(feature)
                           )?.[0] || "other"
                         )}
                        <span>{feature}</span>
                      </div>
                    </td>
                    {plans.map(plan => (
                      <td 
                        key={plan.id} 
                        className={`text-center p-4 ${
                          selectedPlanId === plan.id ? "bg-primary/5" : ""
                        }`}
                      >
                        {plan.features.includes(feature) ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Plan Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map(plan => (
          <Card 
            key={plan.id}
            className={`cursor-pointer transition-all ${
              selectedPlanId === plan.id 
                ? "ring-2 ring-primary border-primary" 
                : "hover:border-primary/50"
            }`}
            onClick={() => onPlanSelect?.(plan.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                {getPlanIcon(plan.name)}
                <CardTitle className="text-lg">{plan.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Features:</span>
                  <Badge variant="secondary">{plan.features.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="font-semibold">₹{plan.price}/{plan.billingCycle}</span>
                </div>
                {plan.maxUsers && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Users:</span>
                    <span className="text-sm">{plan.maxUsers}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 