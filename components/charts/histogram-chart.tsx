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
} from "recharts";

import { BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistogramPoint } from "@/lib/types";

interface HistogramChartProps {
  data: HistogramPoint[];
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

  const data = payload[0].payload as HistogramPoint;
  
  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium">Range: {data.range}</p>
      <p className="text-sm text-primary">
        Trades: <span className="font-bold">{data.count}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        From {formatCurrency(data.minValue)} to {formatCurrency(data.maxValue)}
      </p>
    </div>
  );
};

export default function HistogramChart({
  data,
  title = "Profit/Loss Distribution",
  height = 300,
}: HistogramChartProps) {
  // Validate and filter data
  const validData = data.filter(item => 
    item && 
    typeof item.count === 'number' && 
    item.count > 0 &&
    typeof item.range === 'string' &&
    item.range.length > 0
  );

  // If no valid data, show empty state
  if (validData.length === 0) {
    return (
      <Card className="chart-enter hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No distribution data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="chart-enter hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
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
              dataKey="range"
              className="text-muted-foreground"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}