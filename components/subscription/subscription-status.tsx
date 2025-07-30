"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, XCircle, Clock, Crown } from "lucide-react";

interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodEnd: string;
  planId: string;
  plan: {
    name: string;
    description: string;
    price: number;
    currency: string;
    billingCycle: string;
    features: string[];
  };
  features: string[];
  daysUntilRenewal: number | null;
  isActive: boolean;
}

interface SubscriptionStatusProps {
  userId: string;
}

export default function SubscriptionStatus({ userId }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [userId]);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/subscriptions/status");
      
      if (!response.ok) {
        throw new Error("Failed to fetch subscription status");
      }

      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "CANCELED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "PAST_DUE":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "CANCELED":
        return "bg-red-100 text-red-800";
      case "PAST_DUE":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "CANCELED":
        return "Canceled";
      case "PAST_DUE":
        return "Past Due";
      case "INCOMPLETE":
        return "Incomplete";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">
            <p>Error loading subscription status: {error}</p>
            <Button 
              onClick={fetchSubscriptionStatus}
              variant="outline"
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Active Subscription
            </h3>
            <p className="text-gray-600 mb-4">
              You don&apos;t have an active subscription. Choose a plan to get started.
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
        <div className="flex items-center justify-between">
          <CardTitle>Subscription Status</CardTitle>
          <Badge className={getStatusColor(subscription.status)}>
            {getStatusIcon(subscription.status)}
            <span className="ml-1">{getStatusText(subscription.status)}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Plan */}
          <div>
            <h3 className="text-lg font-semibold mb-2">{subscription.plan.name}</h3>
            <p className="text-gray-600 mb-2">{subscription.plan.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>
                ₹{subscription.plan.price}/{subscription.plan.billingCycle}
              </span>
              <span>•</span>
              <span className="capitalize">{subscription.plan.billingCycle} billing</span>
            </div>
          </div>

          {/* Subscription Period */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              Current period ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </span>
          </div>

          {/* Days until renewal */}
          {subscription.daysUntilRenewal !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                {subscription.daysUntilRenewal > 0 
                  ? `${subscription.daysUntilRenewal} days until renewal`
                  : "Renewal due today"
                }
              </span>
            </div>
          )}

          {/* Features */}
          <div>
            <h4 className="font-medium mb-2">Plan Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {subscription.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" asChild>
              <a href="/pricing">Change Plan</a>
            </Button>
            {subscription.status === "ACTIVE" && (
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 