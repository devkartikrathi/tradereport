"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Target, Lightbulb, RefreshCw, AlertTriangle, CheckCircle, XCircle, Brain, Zap, Shield } from "lucide-react";
import Sidebar from "@/components/navigation/sidebar";
import { FeatureGating } from "@/components/subscription/feature-gating";

interface CoachingInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  actionable: boolean;
}

interface CoachingData {
  strengths: CoachingInsight[];
  weaknesses: CoachingInsight[];
  recommendations: string[];
  lastUpdated: string;
  dataPoints: number;
}

export default function CoachingPage() {
  const [coachingData, setCoachingData] = useState<CoachingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoachingData();
  }, []);

  const fetchCoachingData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coaching');
      if (response.ok) {
        const data = await response.json();
        setCoachingData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load coaching insights');
      }
    } catch (error) {
      console.error('Error fetching coaching data:', error);
      setError('Failed to load coaching insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCoachingData();
    setIsRefreshing(false);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <XCircle className="h-4 w-4" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'risk management':
        return <Shield className="h-4 w-4" />;
      case 'timing':
        return <Zap className="h-4 w-4" />;
      case 'psychology':
        return <Brain className="h-4 w-4" />;
      case 'strategy':
        return <Target className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analyzing Your Trading</h2>
            <p className="text-muted-foreground">AI is analyzing your trading patterns...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <FeatureGating featureName="ai_coaching">
        <div className="container mx-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">AI Coaching Corner</h1>
              <p className="text-muted-foreground">
                Personalized insights to improve your trading performance
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isRefreshing ? 'Refreshing...' : 'Refresh Insights'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {coachingData && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Strengths Found</p>
                        <p className="text-2xl font-bold">{coachingData.strengths.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Areas to Improve</p>
                        <p className="text-2xl font-bold">{coachingData.weaknesses.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Recommendations</p>
                        <p className="text-2xl font-bold">{coachingData.recommendations.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Strengths Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Your Trading Strengths
                  </CardTitle>
                  <CardDescription>
                    Areas where you excel and should continue to leverage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {coachingData.strengths.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Strengths Identified Yet</h3>
                      <p className="text-muted-foreground">
                        Upload more trading data to discover your strengths
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {coachingData.strengths.map((strength) => (
                        <div key={strength.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(strength.category)}
                              <h4 className="font-semibold text-green-800">{strength.title}</h4>
                            </div>
                            <Badge variant="secondary" className="capitalize">
                              {strength.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-green-700 mb-3">{strength.description}</p>
                          {strength.actionable && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span>Actionable insight</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weaknesses Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Areas for Improvement
                  </CardTitle>
                  <CardDescription>
                    Focus areas that can significantly improve your trading performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {coachingData.weaknesses.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Weaknesses Identified</h3>
                      <p className="text-muted-foreground">
                        Great job! Your trading patterns look solid
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {coachingData.weaknesses.map((weakness) => (
                        <div key={weakness.id} className="border rounded-lg p-4 bg-red-50 border-red-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(weakness.category)}
                              <h4 className="font-semibold text-red-800">{weakness.title}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize">
                                {weakness.category}
                              </Badge>
                              <Badge className={getImpactColor(weakness.impact)}>
                                {getImpactIcon(weakness.impact)}
                                <span className="ml-1 capitalize">{weakness.impact} impact</span>
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-red-700 mb-3">{weakness.description}</p>
                          {weakness.actionable && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <Target className="h-3 w-3" />
                              <span>Focus area for improvement</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    Actionable Recommendations
                  </CardTitle>
                  <CardDescription>
                    Specific steps you can take to improve your trading performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {coachingData.recommendations.length === 0 ? (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                      <p className="text-muted-foreground">
                        Upload more trading data to get personalized recommendations
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {coachingData.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <p className="text-sm text-yellow-800">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Data Points Analyzed</p>
                      <p className="font-semibold">{coachingData.dataPoints.toLocaleString()} trades</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Updated</p>
                      <p className="font-semibold">
                        {new Date(coachingData.lastUpdated).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
      </FeatureGating>
    </Sidebar>
  );
} 