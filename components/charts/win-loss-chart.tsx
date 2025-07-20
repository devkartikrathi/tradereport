"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
} from "recharts";

import { PieChart as PieChartIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WinLossPoint } from "@/lib/types";

interface WinLossChartProps {
  data: WinLossPoint[];
  title?: string;
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
}) => {
  if (!active || !payload || !payload[0]) {
    return null;
  }

  const data = payload[0].payload as WinLossPoint;
  
  // Calculate total from all data points
  const allData = payload[0].payload.parent?.data || [];
  const total = Array.isArray(allData) ? 
    allData.reduce((sum: number, item: WinLossPoint) => sum + item.value, 0) : 
    data.value;
  
  const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';

  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium">{data.name}</p>
      <p className="text-sm text-primary">
        Count: <span className="font-bold">{data.value}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Percentage: <span className="font-bold">{percentage}%</span>
      </p>
    </div>
  );
};

export default function WinLossChart({
  data,
  title = "Win/Loss Distribution",
}: WinLossChartProps) {
  // Validate and filter data
  const validData = data.filter(item => 
    item && 
    typeof item.value === 'number' && 
    item.value > 0 && 
    typeof item.name === 'string' &&
    typeof item.color === 'string'
  );

  // If no valid data, show empty state
  if (validData.length === 0) {
    return (
      <Card className="chart-enter hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderLabel = (entry: WinLossPoint) => {
    const total = validData.reduce((sum, item) => sum + item.value, 0);
    const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
    return `${percentage}%`;
  };

  return (
    <Card className="chart-enter hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={validData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {validData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
