import { auth, currentUser } from "@clerk/nextjs/server";
import Sidebar from "@/components/navigation/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Lightbulb,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import ResetDataButton from "@/components/reset-data-button";
import { FeatureGating } from "@/components/subscription/feature-gating";

interface RiskAssessment {
  id: string;
  assessmentType: string;
  riskScore: number;
  recommendations: Record<string, unknown>;
  positionSizingAnalysis: Record<string, unknown>;
  riskRewardAnalysis: Record<string, unknown>;
  stopLossStrategies: Record<string, unknown>;
  createdAt: Date;
}

interface RiskGoal {
  id: string;
  category: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  deadline: Date;
  isCompleted: boolean;
  progress: number;
}

interface RiskCoachingRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  actionSteps: string[];
  expectedOutcome: string;
  timeframe: string;
  isImplemented: boolean;
}

export default async function RiskManagementPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Sign in to view this page</div>;
  }

  const user = await currentUser();

  // Get or create user and their risk management data
  let userRecord = null;
  let riskAssessments: RiskAssessment[] = [];
  let coachingData = {
    goals: [] as RiskGoal[],
    recommendations: [] as RiskCoachingRecommendation[],
    progressTracking: [],
    overallProgress: 0
  };

  try {
    userRecord = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        analytics: true,
      },
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
          analytics: true,
        },
      });
    }

    // For now, we'll use an empty array since the Prisma client needs to be regenerated
    riskAssessments = [];

    // Fetch coaching data from API
    try {
      const coachingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/risk-management/coaching`, {
        headers: {
          'Cookie': `__session=${userId}` // This is a simplified approach
        }
      });
      
      if (coachingResponse.ok) {
        const coachingResult = await coachingResponse.json();
        coachingData = coachingResult;
      }
    } catch (error) {
      console.error('Error fetching coaching data:', error);
    }

  } catch (error) {
    console.error("Error fetching/creating user:", error);
  }

  // Calculate summary statistics
  const totalAssessments = riskAssessments.length;
  const highRiskAssessments = riskAssessments.filter(assessment => assessment.riskScore > 70).length;
  const mediumRiskAssessments = riskAssessments.filter(assessment => assessment.riskScore > 40 && assessment.riskScore <= 70).length;

  const getRiskScoreColor = (score: number) => {
    if (score > 70) return 'bg-red-500';
    if (score > 40) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getRiskScoreLabel = (score: number) => {
    if (score > 70) return 'High Risk';
    if (score > 40) return 'Medium Risk';
    return 'Low Risk';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar>
        <FeatureGating featureName="risk_management">
          <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Risk Management</h1>
                <p className="text-muted-foreground">
                  Analyze and improve your risk management practices
                </p>
              </div>
              <ResetDataButton />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Risk Assessments</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAssessments}</div>
                  <p className="text-xs text-muted-foreground">
                    Total assessments completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{highRiskAssessments}</div>
                  <p className="text-xs text-muted-foreground">
                    Require immediate attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{mediumRiskAssessments}</div>
                  <p className="text-xs text-muted-foreground">
                    Need improvement focus
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progress</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {coachingData.overallProgress.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Overall improvement
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="analysis" className="space-y-4">
              <TabsList>
                <TabsTrigger value="analysis">Risk Analysis</TabsTrigger>
                <TabsTrigger value="coaching">Risk Coaching</TabsTrigger>
                <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Risk Management Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {riskAssessments.length === 0 ? (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No risk assessments available yet. Upload trading data to get started.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {riskAssessments.map((assessment) => (
                          <div
                            key={assessment.id}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{assessment.assessmentType}</h3>
                                <Badge
                                  className={`${getRiskScoreColor(assessment.riskScore)} text-white`}
                                >
                                  {getRiskScoreLabel(assessment.riskScore)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(assessment.createdAt), 'MMM dd, yyyy')}
                                </span>
                                <span className="text-sm font-medium">
                                  Score: {assessment.riskScore.toFixed(1)}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Risk Score</span>
                                <span>{assessment.riskScore.toFixed(1)}/100</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${getRiskScoreColor(assessment.riskScore)}`}
                                  style={{ width: `${assessment.riskScore}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="coaching" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Risk Management Coaching
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {coachingData.recommendations.length === 0 ? (
                      <div className="text-center py-8">
                        <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No risk management recommendations available. Generate a coaching plan to get started.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {coachingData.recommendations.map((recommendation) => (
                          <div
                            key={recommendation.id}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{recommendation.title}</h3>
                                <Badge
                                  className={`${getPriorityColor(recommendation.priority)} text-white`}
                                >
                                  {recommendation.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {recommendation.timeframe}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {recommendation.description}
                            </p>
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Action Steps:</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {recommendation.actionSteps.map((step, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm">
                                <span className="font-medium">Expected Outcome:</span>{' '}
                                {recommendation.expectedOutcome}
                              </p>
                            </div>
                            {!recommendation.isImplemented && (
                              <Button size="sm" variant="outline" className="mt-3">
                                Mark as Implemented
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Risk Management Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {coachingData.goals.length === 0 ? (
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No risk management goals set yet. Generate a coaching plan to create goals.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {coachingData.goals.map((goal) => (
                          <div
                            key={goal.id}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{goal.title}</h3>
                                {goal.isCompleted && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  Due: {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {goal.description}
                            </p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{goal.progress.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${goal.progress}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Current: {goal.currentValue.toFixed(2)}</span>
                                <span>Target: {goal.targetValue.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </FeatureGating>
      </Sidebar>
    </div>
  );
} 