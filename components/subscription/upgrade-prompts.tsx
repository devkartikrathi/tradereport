"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Star, Zap, Shield, Target, BarChart3, Brain, TrendingUp } from "lucide-react";

interface UpgradePromptProps {
  featureName: string;
  title?: string;
  description?: string;
  onUpgrade?: () => void;
  variant?: "default" | "premium" | "urgent";
  showBenefits?: boolean;
  className?: string;
}

interface SubscriptionBenefitsProps {
  currentPlan?: string;
  onUpgrade?: () => void;
  className?: string;
}

interface FeaturePreviewProps {
  featureName: string;
  title: string;
  description: string;
  benefits: string[];
  onUpgrade?: () => void;
  className?: string;
}

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  ai_coaching: <Brain className="h-5 w-5" />,
  behavioral_analysis: <BarChart3 className="h-5 w-5" />,
  risk_management: <Shield className="h-5 w-5" />,
  performance_goals: <Target className="h-5 w-5" />,
  live_monitoring: <TrendingUp className="h-5 w-5" />,
  trade_validator: <Zap className="h-5 w-5" />,
};

const FEATURE_BENEFITS: Record<string, string[]> = {
  ai_coaching: [
    "Personalized AI trading coach",
    "Real-time market insights",
    "Performance optimization tips",
    "Risk assessment guidance"
  ],
  behavioral_analysis: [
    "Advanced trading psychology insights",
    "Behavioral pattern recognition",
    "Emotional trading analysis",
    "Decision-making optimization"
  ],
  risk_management: [
    "Comprehensive risk assessment",
    "Portfolio protection strategies",
    "Position sizing recommendations",
    "Risk-reward optimization"
  ],
  performance_goals: [
    "Goal-based trading strategies",
    "Progress tracking and analytics",
    "Performance benchmarking",
    "Achievement milestones"
  ],
  live_monitoring: [
    "Real-time portfolio monitoring",
    "Live trade tracking",
    "Instant alerts and notifications",
    "Performance dashboards"
  ],
  trade_validator: [
    "Advanced trade validation",
    "Risk assessment tools",
    "Trade optimization suggestions",
    "Compliance checking"
  ]
};

export function UpgradePrompt({ 
  featureName, 
  title, 
  description, 
  onUpgrade, 
  variant = "default",
  showBenefits = true,
  className = "" 
}: UpgradePromptProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const defaultTitle = title || "Upgrade to Premium";
  const defaultDescription = description || "Unlock advanced features and insights to improve your trading performance.";
  
  const getVariantStyles = () => {
    switch (variant) {
      case "premium":
        return "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-500";
      case "urgent":
        return "bg-gradient-to-r from-red-600 to-orange-600 text-white border-red-500";
      default:
        return "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500";
    }
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default upgrade flow
      window.location.href = "/pricing";
    }
    setIsDialogOpen(false);
  };

  return (
    <div className={`rounded-lg border p-6 ${getVariantStyles()} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {FEATURE_ICONS[featureName] || <Star className="h-5 w-5" />}
            <Badge variant="secondary" className="bg-white/20 text-white">
              Premium Feature
            </Badge>
          </div>
          <h3 className="text-lg font-semibold mb-2">{defaultTitle}</h3>
          <p className="text-sm opacity-90 mb-4">{defaultDescription}</p>
          
          {showBenefits && FEATURE_BENEFITS[featureName] && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">What you'll get:</h4>
              <ul className="space-y-1">
                {FEATURE_BENEFITS[featureName].map((benefit, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <Check className="h-3 w-3" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsDialogOpen(true)}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              Learn More
            </Button>
            <Button 
              onClick={handleUpgrade}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {FEATURE_ICONS[featureName] || <Star className="h-5 w-5" />}
              {defaultTitle}
            </DialogTitle>
            <DialogDescription>
              {defaultDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Feature Benefits</h4>
              <div className="grid gap-3">
                {FEATURE_BENEFITS[featureName]?.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Why Upgrade?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Access to advanced analytics and insights</li>
                <li>• Personalized recommendations and coaching</li>
                <li>• Enhanced risk management tools</li>
                <li>• Priority support and updates</li>
              </ul>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpgrade} className="flex-1">
                Upgrade to Premium
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function SubscriptionBenefits({ currentPlan, onUpgrade, className = "" }: SubscriptionBenefitsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const benefits = [
    {
      title: "AI-Powered Insights",
      description: "Get personalized trading recommendations and market analysis",
      icon: <Brain className="h-6 w-6" />
    },
    {
      title: "Advanced Analytics",
      description: "Deep dive into your trading patterns and performance metrics",
      icon: <BarChart3 className="h-6 w-6" />
    },
    {
      title: "Risk Management",
      description: "Comprehensive tools to protect your portfolio and optimize risk",
      icon: <Shield className="h-6 w-6" />
    },
    {
      title: "Goal Tracking",
      description: "Set and track your trading goals with detailed progress analytics",
      icon: <Target className="h-6 w-6" />
    },
    {
      title: "Live Monitoring",
      description: "Real-time portfolio tracking and instant alerts",
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      title: "Trade Validation",
      description: "Advanced tools to validate and optimize your trades",
      icon: <Zap className="h-6 w-6" />
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Premium Features</h2>
        <p className="text-gray-600">
          Unlock the full potential of your trading with our premium features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {benefits.map((benefit, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  {benefit.icon}
                </div>
                <CardTitle className="text-lg">{benefit.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{benefit.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button onClick={() => setIsDialogOpen(true)} size="lg">
          View All Plans
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
            <DialogDescription>
              Select the plan that best fits your trading needs
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly (Save 20%)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic</CardTitle>
                    <CardDescription>Essential features for beginners</CardDescription>
                    <div className="text-2xl font-bold">$9<span className="text-sm font-normal">/month</span></div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Basic analytics
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Trade tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Basic reports
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-500 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500">Most Popular</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle>Pro</CardTitle>
                    <CardDescription>Advanced features for serious traders</CardDescription>
                    <div className="text-2xl font-bold">$29<span className="text-sm font-normal">/month</span></div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        All Basic features
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        AI coaching
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Behavioral analysis
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Risk management
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Enterprise</CardTitle>
                    <CardDescription>Complete solution for professionals</CardDescription>
                    <div className="text-2xl font-bold">$99<span className="text-sm font-normal">/month</span></div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        All Pro features
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Live monitoring
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Advanced validation
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Priority support
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="yearly" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic</CardTitle>
                    <CardDescription>Essential features for beginners</CardDescription>
                    <div className="text-2xl font-bold">$87<span className="text-sm font-normal">/year</span></div>
                    <div className="text-sm text-green-600">Save $21/year</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Basic analytics
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Trade tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Basic reports
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-500 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500">Most Popular</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle>Pro</CardTitle>
                    <CardDescription>Advanced features for serious traders</CardDescription>
                    <div className="text-2xl font-bold">$279<span className="text-sm font-normal">/year</span></div>
                    <div className="text-sm text-green-600">Save $69/year</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        All Basic features
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        AI coaching
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Behavioral analysis
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Risk management
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Enterprise</CardTitle>
                    <CardDescription>Complete solution for professionals</CardDescription>
                    <div className="text-2xl font-bold">$949<span className="text-sm font-normal">/year</span></div>
                    <div className="text-sm text-green-600">Save $239/year</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        All Pro features
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Live monitoring
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Advanced validation
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Priority support
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={() => {
              if (onUpgrade) onUpgrade();
              setIsDialogOpen(false);
            }} className="flex-1">
              Choose Plan
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FeaturePreview({ 
  featureName, 
  title, 
  description, 
  benefits, 
  onUpgrade, 
  className = "" 
}: FeaturePreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {FEATURE_ICONS[featureName] || <Star className="h-5 w-5" />}
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <Badge variant="secondary">Preview</Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Key Benefits:</h4>
              <ul className="space-y-1">
                {benefits.map((benefit, index) => (
                  <li key={index} className="text-sm flex items-center gap-2 text-gray-600">
                    <Check className="h-3 w-3 text-green-600" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-2">
              <Button 
                onClick={() => setIsPreviewOpen(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Preview Feature
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {FEATURE_ICONS[featureName] || <Star className="h-5 w-5" />}
              {title} - Preview
            </DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Feature Overview</h4>
              <p className="text-sm text-gray-600 mb-3">{description}</p>
              
              <div className="space-y-2">
                <h5 className="font-medium text-sm">What you'll get:</h5>
                <ul className="space-y-1">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Ready to unlock this feature?</h4>
              <p className="text-sm text-blue-800 mb-3">
                Upgrade to premium to access {title.toLowerCase()} and all other advanced features.
              </p>
              <Button 
                onClick={() => {
                  if (onUpgrade) onUpgrade();
                  setIsPreviewOpen(false);
                }}
                className="w-full"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 