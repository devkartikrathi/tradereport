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
import { DailyPnLPoint } from "@/lib/types";

interface DailyPnLChartProps {
  data: DailyPnLPoint[];
  title?: string;
  height?: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || !payload[0] || !label) {
    return null;
  }
  const data = payload[0].payload;
  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium">{formatDate(label)}</p>
      <p
        className={`text-sm ${
          data.pnl >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        Daily P&L:{" "}
        <span className="font-bold">{formatCurrency(data.pnl)}</span>
      </p>
    </div>
  );
};

export default function DailyPnLChart({
  data,
  title = "Daily P&L",
  height = 300,
}: DailyPnLChartProps) {
  return (
    <Card className="chart-enter hover-lift">
      <CardHeader>
        <div className="flex items-center">
          <BarChart3 className="mr-2 h-4 w-4" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              className="text-muted-foreground"
            />
            <YAxis
              tickFormatter={formatCurrency}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="pnl"
              fill="hsl(var(--primary))"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
