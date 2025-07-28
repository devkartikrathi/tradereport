"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, RotateCcw, Shield, Target, TrendingUp } from "lucide-react";
import Sidebar from "@/components/navigation/sidebar";

interface TradingRules {
  maxDailyTrades: number;
  maxDailyLoss: number;
  riskRewardRatio: number;
}

interface TradingRulesFormData {
  maxDailyTrades: string;
  maxDailyLoss: string;
  riskRewardRatio: string;
}

interface ValidationErrors {
  maxDailyTrades?: string;
  maxDailyLoss?: string;
  riskRewardRatio?: string;
}

export default function TradingRulesPage() {
  const [formData, setFormData] = useState<TradingRulesFormData>({
    maxDailyTrades: "10",
    maxDailyLoss: "1000",
    riskRewardRatio: "2.0"
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTradingRules();
  }, []);

  const fetchTradingRules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trading-rules');
      if (response.ok) {
        const rules: TradingRules = await response.json();
        setFormData({
          maxDailyTrades: rules.maxDailyTrades.toString(),
          maxDailyLoss: rules.maxDailyLoss.toString(),
          riskRewardRatio: rules.riskRewardRatio.toString()
        });
      } else {
        // Use default values if no rules exist
        setFormData({
          maxDailyTrades: "10",
          maxDailyLoss: "1000",
          riskRewardRatio: "2.0"
        });
      }
    } catch (error) {
      console.error('Error fetching trading rules:', error);
      setMessage({ type: 'error', text: 'Failed to load trading rules' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate max daily trades
    const maxDailyTrades = parseInt(formData.maxDailyTrades);
    if (isNaN(maxDailyTrades) || maxDailyTrades < 1 || maxDailyTrades > 50) {
      newErrors.maxDailyTrades = 'Must be a number between 1 and 50';
    }

    // Validate max daily loss
    const maxDailyLoss = parseFloat(formData.maxDailyLoss);
    if (isNaN(maxDailyLoss) || maxDailyLoss < 100 || maxDailyLoss > 100000) {
      newErrors.maxDailyLoss = 'Must be between ₹100 and ₹1,00,000';
    }

    // Validate risk-reward ratio
    const riskRewardRatio = parseFloat(formData.riskRewardRatio);
    if (isNaN(riskRewardRatio) || riskRewardRatio < 0.5 || riskRewardRatio > 10.0) {
      newErrors.riskRewardRatio = 'Must be between 0.5 and 10.0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/trading-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDailyTrades: parseInt(formData.maxDailyTrades),
          maxDailyLoss: parseFloat(formData.maxDailyLoss),
          riskRewardRatio: parseFloat(formData.riskRewardRatio)
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Trading rules saved successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to save trading rules' });
      }
    } catch (error) {
      console.error('Error saving trading rules:', error);
      setMessage({ type: 'error', text: 'Failed to save trading rules' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      maxDailyTrades: "10",
      maxDailyLoss: "1000",
      riskRewardRatio: "2.0"
    });
    setErrors({});
    setMessage(null);
  };

  const handleInputChange = (field: keyof TradingRulesFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  if (isLoading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading trading rules...</span>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Trading Rules</h1>
            <p className="text-muted-foreground">
              Set your personal trading rules to help maintain discipline and manage risk.
            </p>
          </div>

          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Management Rules
              </CardTitle>
              <CardDescription>
                Configure your daily trading limits and risk parameters to maintain discipline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="maxDailyTrades" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      <Target className="h-4 w-4" />
                      Maximum Daily Trades
                    </label>
                    <Input
                      id="maxDailyTrades"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.maxDailyTrades}
                      onChange={(e) => handleInputChange('maxDailyTrades', e.target.value)}
                      placeholder="10"
                      className={errors.maxDailyTrades ? 'border-red-500' : ''}
                    />
                    {errors.maxDailyTrades && (
                      <p className="text-sm text-red-500">{errors.maxDailyTrades}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Maximum number of trades you can take per day (1-50)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="maxDailyLoss" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      <Shield className="h-4 w-4" />
                      Maximum Daily Loss
                    </label>
                    <Input
                      id="maxDailyLoss"
                      type="number"
                      min="100"
                      max="100000"
                      step="100"
                      value={formData.maxDailyLoss}
                      onChange={(e) => handleInputChange('maxDailyLoss', e.target.value)}
                      placeholder="1000"
                      className={errors.maxDailyLoss ? 'border-red-500' : ''}
                    />
                    {errors.maxDailyLoss && (
                      <p className="text-sm text-red-500">{errors.maxDailyLoss}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Maximum loss you can incur per day (₹100 - ₹1,00,000)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="riskRewardRatio" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      <TrendingUp className="h-4 w-4" />
                      Risk-Reward Ratio
                    </label>
                    <Input
                      id="riskRewardRatio"
                      type="number"
                      min="0.5"
                      max="10.0"
                      step="0.1"
                      value={formData.riskRewardRatio}
                      onChange={(e) => handleInputChange('riskRewardRatio', e.target.value)}
                      placeholder="2.0"
                      className={errors.riskRewardRatio ? 'border-red-500' : ''}
                    />
                    {errors.riskRewardRatio && (
                      <p className="text-sm text-red-500">{errors.riskRewardRatio}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Minimum risk-reward ratio for your trades (0.5 - 10.0)
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Rules'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to Defaults
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Rules Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formData.maxDailyTrades}</div>
                  <div className="text-sm text-blue-600">Daily Trades</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(formData.maxDailyLoss)}</div>
                  <div className="text-sm text-green-600">Daily Loss Limit</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formData.riskRewardRatio}</div>
                  <div className="text-sm text-purple-600">Risk-Reward Ratio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Sidebar>
  );
} 