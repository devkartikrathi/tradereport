"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/navigation/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Target,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Lightbulb,
  Activity,
  Percent,
  DollarSign,
  Shield,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { PageLoading } from "@/components/ui/loading";

interface PerformanceGoal {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetValue: number;
  currentValue: number;
  startDate: string;
  targetDate?: string;
  isActive: boolean;
  progress: number;
  insights?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface GoalFormData {
  title: string;
  description: string;
  category: string;
  targetValue: string;
  targetDate: string;
}

export default function PerformanceGoalsPage() {
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: "",
    description: "",
    category: "profit_target",
    targetValue: "",
    targetDate: "",
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getPerformanceGoals();
      
      if (!result.success || result.error) {
        throw new Error(result.error || "Failed to fetch goals");
      }

      setGoals(result.data as PerformanceGoal[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      apiClient.handleError({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const goalData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        targetValue: parseFloat(formData.targetValue),
        targetDate: formData.targetDate || undefined,
      };

      const result = editingGoal 
        ? await apiClient.updatePerformanceGoal(editingGoal.id, goalData)
        : await apiClient.createPerformanceGoal(goalData);

      if (!result.success || result.error) {
        throw new Error(result.error || "Failed to save goal");
      }

      setShowForm(false);
      setEditingGoal(null);
      resetForm();
      fetchGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save goal");
      apiClient.handleError({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      const result = await apiClient.deletePerformanceGoal(goalId);
      
      if (!result.success || result.error) {
        throw new Error(result.error || "Failed to delete goal");
      }

      fetchGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete goal");
      apiClient.handleError({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "profit_target",
      targetValue: "",
      targetDate: "",
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "profit_target":
        return <DollarSign className="h-4 w-4" />;
      case "win_rate":
        return <Percent className="h-4 w-4" />;
      case "risk_management":
        return <Shield className="h-4 w-4" />;
      case "consistency":
        return <Activity className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "profit_target":
        return "bg-green-100 text-green-800";
      case "win_rate":
        return "bg-blue-100 text-blue-800";
      case "risk_management":
        return "bg-orange-100 text-orange-800";
      case "consistency":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-yellow-500";
    if (progress >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <Sidebar>
        <PageLoading 
          title="Loading Performance Goals"
          description="Please wait while we fetch your goals"
        />
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Performance Goals</h1>
            <p className="text-muted-foreground">
              Set and track your trading performance targets
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Goals</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.filter(goal => goal.isActive).map((goal) => (
                <Card key={goal.id} className="relative">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(goal.category)}
                        <Badge className={getCategoryColor(goal.category)}>
                          {goal.category.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingGoal(goal);
                            setFormData({
                              title: goal.title,
                              description: goal.description || "",
                              category: goal.category,
                              targetValue: goal.targetValue.toString(),
                              targetDate: goal.targetDate || "",
                            });
                            setShowForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground">
                        {goal.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{goal.progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(goal.progress)}`}
                          style={{ width: `${Math.min(goal.progress, 100)}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Current</span>
                          <div className="font-semibold">
                            {goal.category === "profit_target" 
                              ? formatCurrency(goal.currentValue)
                              : `${goal.currentValue.toFixed(1)}%`
                            }
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target</span>
                          <div className="font-semibold">
                            {goal.category === "profit_target" 
                              ? formatCurrency(goal.targetValue)
                              : `${goal.targetValue.toFixed(1)}%`
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Started: {format(new Date(goal.startDate), "MMM dd, yyyy")}
                        {goal.targetDate && (
                          <span className="ml-2">
                            • Target: {format(new Date(goal.targetDate), "MMM dd, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.filter(goal => !goal.isActive).map((goal) => (
                <Card key={goal.id} className="relative opacity-75">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <Badge className={getCategoryColor(goal.category)}>
                          {goal.category.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground">
                        {goal.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Final Progress</span>
                        <span>{goal.progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${Math.min(goal.progress, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Completed: {format(new Date(goal.updatedAt), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>AI-Powered Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  AI insights about your goal progress will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Goal Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {editingGoal ? "Edit Goal" : "Add New Goal"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter goal title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter goal description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profit_target">Profit Target</SelectItem>
                      <SelectItem value="win_rate">Win Rate</SelectItem>
                      <SelectItem value="risk_management">Risk Management</SelectItem>
                      <SelectItem value="consistency">Consistency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Value</label>
                  <Input
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    placeholder="Enter target value"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Date (Optional)</label>
                  <Input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">
                    {editingGoal ? "Update Goal" : "Create Goal"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingGoal(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
} 