"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUp, ArrowDown, X, AlertTriangle, CheckCircle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
}

interface SubscriptionData {
  id: string;
  status: string;
  planId: string;
  plan: Plan;
  isActive: boolean;
}

interface SubscriptionManagementProps {
  subscription: SubscriptionData | null;
  availablePlans: Plan[];
  onSubscriptionUpdate: () => void;
}

export default function SubscriptionManagement({ 
  subscription, 
  availablePlans, 
  onSubscriptionUpdate 
}: SubscriptionManagementProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionResult, setActionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const currentPlan = subscription?.plan;
  const upgradePlans = availablePlans.filter(plan => 
    plan.price > (currentPlan?.price || 0) && plan.id !== currentPlan?.id
  );
  const downgradePlans = availablePlans.filter(plan => 
    plan.price < (currentPlan?.price || 0) && plan.id !== currentPlan?.id
  );

  const handleSubscriptionAction = async (action: string, planId?: string) => {
    try {
      setLoading(true);
      setActionResult(null);

      const response = await fetch("/api/subscriptions/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          planId
        })
      });

      const data = await response.json();

      if (data.success) {
        setActionResult({
          success: true,
          message: data.message
        });
        onSubscriptionUpdate();
        
        // Close dialogs
        setShowUpgradeDialog(false);
        setShowDowngradeDialog(false);
        setShowCancelDialog(false);
        setSelectedPlan("");
      } else {
        setActionResult({
          success: false,
          message: data.error || "Action failed"
        });
      }
    } catch {
      setActionResult({
        success: false,
        message: "An error occurred while processing your request"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    if (selectedPlan) {
      handleSubscriptionAction("upgrade", selectedPlan);
    }
  };

  const handleDowngrade = () => {
    if (selectedPlan) {
      handleSubscriptionAction("downgrade", selectedPlan);
    }
  };

  const handleCancel = () => {
    handleSubscriptionAction("cancel");
  };

  const handleRenew = () => {
    handleSubscriptionAction("renew");
  };

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Active Subscription
            </h3>
            <p className="text-gray-600 mb-4">
              You need an active subscription to manage your plan.
            </p>
            <Button asChild>
              <a href="/pricing">View Plans</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Plan Info */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Current Plan</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">{currentPlan?.name}</p>
                <p className="text-sm text-gray-600">
                  ₹{currentPlan?.price}/{currentPlan?.billingCycle}
                </p>
              </div>
              <Badge className={subscription.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {subscription.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Action Result */}
          {actionResult && (
            <div className={`p-4 rounded-lg ${
              actionResult.success 
                ? "bg-green-50 border border-green-200" 
                : "bg-red-50 border border-red-200"
            }`}>
              <div className="flex items-center gap-2">
                {actionResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={actionResult.success ? "text-green-800" : "text-red-800"}>
                  {actionResult.message}
                </span>
              </div>
            </div>
          )}

          {/* Management Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upgrade Plan */}
            {upgradePlans.length > 0 && (
              <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upgrade Your Plan</DialogTitle>
                    <DialogDescription>
                      Choose a plan with more features and higher limits.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan to upgrade to" />
                      </SelectTrigger>
                      <SelectContent>
                        {upgradePlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ₹{plan.price}/{plan.billingCycle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedPlan && (
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">Plan Features</h4>
                        <ul className="space-y-1 text-sm">
                          {upgradePlans.find(p => p.id === selectedPlan)?.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpgrade} 
                      disabled={!selectedPlan || loading}
                    >
                      {loading ? "Upgrading..." : "Upgrade"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Downgrade Plan */}
            {downgradePlans.length > 0 && (
              <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Downgrade Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Downgrade Your Plan</DialogTitle>
                    <DialogDescription>
                      Choose a plan with fewer features and lower cost.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan to downgrade to" />
                      </SelectTrigger>
                      <SelectContent>
                        {downgradePlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ₹{plan.price}/{plan.billingCycle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedPlan && (
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">Plan Features</h4>
                        <ul className="space-y-1 text-sm">
                          {downgradePlans.find(p => p.id === selectedPlan)?.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDowngradeDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleDowngrade} 
                      disabled={!selectedPlan || loading}
                    >
                      {loading ? "Downgrading..." : "Downgrade"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Renew Subscription */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleRenew}
              disabled={loading}
            >
              {loading ? "Renewing..." : "Renew Subscription"}
            </Button>

            {/* Cancel Subscription */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                  <X className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleCancel}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={loading}
                  >
                    {loading ? "Canceling..." : "Cancel Subscription"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Important Notes</h4>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Plan changes will take effect at the end of your current billing period</li>
                                     <li>• Canceling will stop automatic renewals but you&apos;ll keep access until the period ends</li>
                  <li>• You can reactivate your subscription at any time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 