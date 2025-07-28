import { auth, currentUser } from "@clerk/nextjs/server";
import Sidebar from "@/components/navigation/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Lightbulb,
  BarChart3,
  Activity,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import ResetDataButton from "@/components/reset-data-button";

interface BehavioralInsight {
  id: string;
  patternType: string;
  severity: string;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  recommendations: Record<string, unknown>;
  isAcknowledged: boolean;
  createdAt: Date;
}

interface CoachingGoal {
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

interface CoachingRecommendation {
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

export default async function BehavioralPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Sign in to view this page</div>;
  }

  const user = await currentUser();

  // Get or create user and their behavioral data
  let userRecord = null;
  let behavioralInsights: BehavioralInsight[] = [];
  let coachingData = {
    goals: [] as CoachingGoal[],
    recommendations: [] as CoachingRecommendation[],
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
    behavioralInsights = [];

    // Fetch coaching data from API
    try {
      const coachingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/behavioral/coaching`, {
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
  const totalInsights = behavioralInsights.length;
  const criticalInsights = behavioralInsights.filter(insight => insight.severity === 'critical').length;
  const highPriorityInsights = behavioralInsights.filter(insight => insight.severity === 'high').length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPatternTypeIcon = (patternType: string) => {
    switch (patternType) {
      case 'emotional': return <Brain className="h-4 w-4" />;
      case 'risk_taking': return <AlertTriangle className="h-4 w-4" />;
      case 'consistency': return <Activity className="h-4 w-4" />;
      case 'discipline': return <Target className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar>
        <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Behavioral Insights</h1>
              <p className="text-muted-foreground">
                Understand your trading patterns and improve your behavior
              </p>
            </div>
            <ResetDataButton />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInsights}</div>
                <p className="text-xs text-muted-foreground">
                  Behavioral patterns detected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{criticalInsights}</div>
                <p className="text-xs text-muted-foreground">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{highPriorityInsights}</div>
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
          <Tabs defaultValue="insights" className="space-y-4">
            <TabsList>
              <TabsTrigger value="insights">Behavioral Insights</TabsTrigger>
              <TabsTrigger value="coaching">Coaching Plan</TabsTrigger>
              <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Behavioral Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {behavioralInsights.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No behavioral insights available yet. Upload trading data to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {behavioralInsights.map((insight) => (
                        <div
                          key={insight.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getPatternTypeIcon(insight.patternType)}
                              <h3 className="font-semibold">{insight.title}</h3>
                              <Badge
                                className={`${getSeverityColor(insight.severity)} text-white`}
                              >
                                {insight.severity}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(insight.createdAt), 'MMM dd, yyyy')}
                              </span>
                              {insight.isAcknowledged && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {insight.description}
                          </p>
                          {!insight.isAcknowledged && (
                            <Button size="sm" variant="outline">
                              Acknowledge
                            </Button>
                          )}
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
                    Coaching Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {coachingData.recommendations.length === 0 ? (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No coaching recommendations available. Generate a coaching plan to get started.
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
                                className={`${
                                  recommendation.priority === 'critical' ? 'bg-red-500' :
                                  recommendation.priority === 'high' ? 'bg-orange-500' :
                                  recommendation.priority === 'medium' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                } text-white`}
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
                    Goals & Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {coachingData.goals.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No behavioral goals set yet. Generate a coaching plan to create goals.
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
                              <span>Current: {goal.currentValue}</span>
                              <span>Target: {goal.targetValue}</span>
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
      </Sidebar>
    </div>
  );
} 