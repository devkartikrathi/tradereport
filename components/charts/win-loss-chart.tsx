"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";
import { WinLossPoint } from "@/lib/types";

interface WinLossChartProps {
  data: WinLossPoint[];
  title?: string;
}

export default function WinLossChart({
  data,
  title = "Win/Loss Distribution",
}: WinLossChartProps) {
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: unknown;
  }) => {
    if (active && payload && Array.isArray(payload) && payload.length) {
      const data = payload[0].payload;
      const total = data.value + (payload[1]?.payload?.value || 0);
      const percentage =
        total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

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
    }
    return null;
  };

  const renderLabel = (entry: WinLossPoint) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
    return `${percentage}%`;
  };

  if (!data || data.length === 0) {
    return (
      <Card className="chart-enter hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="chart-enter hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
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
