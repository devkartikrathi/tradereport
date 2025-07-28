import { auth, currentUser } from "@clerk/nextjs/server";
import Sidebar from "@/components/navigation/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Lightbulb,
  BarChart3,
  Activity,
  Calendar,
  Percent,
  DollarSign,
  Shield,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import ResetDataButton from "@/components/reset-data-button";

interface PerformanceGoal {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  targetDate?: Date;
  isActive: boolean;
  progress: number;
  insights?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface GoalInsight {
  id: string;
  insightType: string;
  title: string;
  description: string;
  confidence: number;
  priority: string;
  actionableSteps: string[];
  expectedImpact: string;
}

export default async function PerformanceGoalsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Sign in to view this page</div>;
  }

  const user = await currentUser();

  // Get or create user and their performance goals data
  let userRecord = null;
  let goals: PerformanceGoal[] = [];
  let insights: GoalInsight[] = [];

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
    goals = [];

    // Fetch insights from API (simplified for now)
    insights = [];

  } catch (error) {
    console.error("Error fetching/creating user:", error);
  }

  // Calculate summary statistics
  const totalGoals = goals.length;
  const activeGoals = goals.filter(goal => goal.isActive).length;
  const completedGoals = goals.filter(goal => goal.progress >= 100).length;
  const averageProgress = goals.length > 0 
    ? goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length 
    : 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'profit_target':
        return DollarSign;
      case 'win_rate':
        return Percent;
      case 'risk_management':
        return Shield;
      case 'consistency':
        return Activity;
      default:
        return Target;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'profit_target':
        return 'bg-green-500';
      case 'win_rate':
        return 'bg-blue-500';
      case 'risk_management':
        return 'bg-orange-500';
      case 'consistency':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
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
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Performance Goals</h1>
                <p className="text-muted-foreground">
                  Set and track your trading performance goals
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Goal
                </Button>
                <ResetDataButton />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalGoals}</div>
                  <p className="text-xs text-muted-foreground">
                    Goals created
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                  <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{activeGoals}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently tracking
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{completedGoals}</div>
                  <p className="text-xs text-muted-foreground">
                    Goals achieved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {averageProgress.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average completion
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="goals" className="space-y-4">
              <TabsList>
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="goals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Performance Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {goals.length === 0 ? (
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                          No performance goals set yet. Create your first goal to get started.
                        </p>
                        <Button className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Create First Goal
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {goals.map((goal) => {
                          const CategoryIcon = getCategoryIcon(goal.category);
                          return (
                            <div
                              key={goal.id}
                              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <CategoryIcon className="h-5 w-5" />
                                  <h3 className="font-semibold">{goal.title}</h3>
                                  <Badge
                                    className={`${getCategoryColor(goal.category)} text-white`}
                                  >
                                    {goal.category.replace('_', ' ')}
                                  </Badge>
                                  {goal.isActive ? (
                                    <Badge className="bg-green-500 text-white">
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {goal.description && (
                                <p className="text-sm text-muted-foreground mb-3">
                                  {goal.description}
                                </p>
                              )}

                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Progress</span>
                                  <span>{goal.progress.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${getProgressColor(goal.progress)}`}
                                    style={{ width: `${goal.progress}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Current: {goal.currentValue.toFixed(2)}</span>
                                  <span>Target: {goal.targetValue.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Started: {format(new Date(goal.startDate), 'MMM dd, yyyy')}</span>
                                  </div>
                                  {goal.targetDate && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>Due: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}</span>
                                    </div>
                                  )}
                                </div>
                                <Button size="sm" variant="outline">
                                  View Insights
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      AI Goal Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {insights.length === 0 ? (
                      <div className="text-center py-8">
                        <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No AI insights available yet. Create goals to get personalized insights.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {insights.map((insight) => (
                          <div
                            key={insight.id}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{insight.title}</h3>
                                <Badge
                                  className={`${getPriorityColor(insight.priority)} text-white`}
                                >
                                  {insight.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {insight.confidence.toFixed(0)}% confidence
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {insight.description}
                            </p>
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Actionable Steps:</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {insight.actionableSteps.map((step, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm">
                                <span className="font-medium">Expected Impact:</span>{' '}
                                {insight.expectedImpact}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Goal Progress Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {goals.length === 0 ? (
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No goals to track yet. Create goals to see progress analytics.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {goals.map((goal) => {
                          const CategoryIcon = getCategoryIcon(goal.category);
                          return (
                            <div
                              key={goal.id}
                              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <CategoryIcon className="h-5 w-5" />
                                <h3 className="font-semibold">{goal.title}</h3>
                                <Badge
                                  className={`${getCategoryColor(goal.category)} text-white`}
                                >
                                  {goal.category.replace('_', ' ')}
                                </Badge>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span>Current Progress</span>
                                  <span className="font-medium">{goal.progress.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${getProgressColor(goal.progress)}`}
                                    style={{ width: `${goal.progress}%` }}
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Current Value:</span>
                                    <div className="font-medium">{goal.currentValue.toFixed(2)}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Target Value:</span>
                                    <div className="font-medium">{goal.targetValue.toFixed(2)}</div>
                                  </div>
                                </div>

                                {goal.targetDate && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Target Date: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
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