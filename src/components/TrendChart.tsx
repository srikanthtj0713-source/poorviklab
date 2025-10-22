import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendData {
  date: string;
  value: number;
  testName: string;
}

interface TrendChartProps {
  data: TrendData[];
  testName: string;
  unit: string;
  normalRange: string;
}

export function TrendChart({ data, testName, unit, normalRange }: TrendChartProps) {
  if (data.length < 2) return null;

  const latestValue = data[data.length - 1]?.value;
  const previousValue = data[data.length - 2]?.value;
  const trend = latestValue > previousValue ? 'up' : latestValue < previousValue ? 'down' : 'stable';

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#ef4444';
      case 'down': return '#22c55e';
      default: return '#6b7280';
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{testName} Trend</span>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-sm text-muted-foreground">
              {trend === 'stable' ? 'No change' : `Trending ${trend}`}
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          Normal range: {normalRange} {unit}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: `${unit}`, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number) => [`${value} ${unit}`, testName]}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={getTrendColor()}
              strokeWidth={2}
              dot={{ fill: getTrendColor(), strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}