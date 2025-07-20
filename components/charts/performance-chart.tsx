"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
  Cell,
} from "recharts";

import { Clock, Calendar } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HourlyPerformancePoint, WeeklyPerformancePoint } from "@/lib/types";

interface PerformanceChartProps {
  data: HourlyPerformancePoint[] | WeeklyPerformancePoint[];
  type: 'hourly' | 'weekly';
  title?: string;
  height?: number;
}

const formatCurrency = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '₹0';
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || !payload[0] || !label) {
    return null;
  }

  const data = payload[0].payload as HourlyPerformancePoint | WeeklyPerformancePoint;
  
  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium">
        {'hour' in data ? `Time: ${data.hour}` : `Day: ${data.day}`}
      </p>
      <p className="text-sm text-primary">
        Avg P&L: <span className="font-bold">{formatCurrency(data.avgPnL)}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Total P&L: <span className="font-bold">{formatCurrency(data.totalPnL)}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Trades: <span className="font-bold">{data.trades}</span>
      </p>
    </div>
  );
};

export default function PerformanceChart({
  data,
  type,
  title,
  height = 300,
}: PerformanceChartProps) {
  const defaultTitle = type === 'hourly' ? 'Hourly Performance' : 'Weekly Performance';
  const icon = type === 'hourly' ? Clock : Calendar;
  const IconComponent = icon;

  // Validate and filter data
  const validData = data.filter(item => 
    item && 
    typeof item.avgPnL === 'number' && 
    !isNaN(item.avgPnL) &&
    typeof item.trades === 'number' &&
    item.trades > 0
  );

  // If no valid data, show empty state
  if (validData.length === 0) {
    return (
      <Card className="chart-enter hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {title || defaultTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <IconComponent className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No {type} performance data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine bar color based on performance
  const getBarColor = (value: number) => {
    return value >= 0 ? "#22c55e" : "#ef4444";
  };

  const dataKey = type === 'hourly' ? 'hour' : 'day';

  return (
    <Card className="chart-enter hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className="h-5 w-5" />
          {title || defaultTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={validData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={dataKey}
              className="text-muted-foreground"
            />
            <YAxis
              tickFormatter={formatCurrency}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="avgPnL"
              radius={[2, 2, 0, 0]}
            >
              {validData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.avgPnL)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}