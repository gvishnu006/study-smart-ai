"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatHours } from "@/lib/utils";

interface Point {
  label: string;
  minutes: number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lift">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{formatHours(payload[0].value / 60)}</p>
    </div>
  );
}

export function StudyHoursChart({
  daily,
  weekly,
  monthly,
}: {
  daily: Point[];
  weekly: Point[];
  monthly: Point[];
}) {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const data = range === "daily" ? daily : range === "weekly" ? weekly : monthly;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Study hours</CardTitle>
        <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
          <TabsList className="h-8">
            <TabsTrigger value="daily" className="px-2.5 py-1 text-xs">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="px-2.5 py-1 text-xs">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="px-2.5 py-1 text-xs">
              Monthly
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: number) => `${Math.round(v / 60)}h`}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                content={<ChartTooltip />}
              />
              <Bar
                dataKey="minutes"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SubjectPie({
  distribution,
}: {
  distribution: { name: string; value: number; color: string }[];
}) {
  if (distribution.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subject distribution</CardTitle>
        </CardHeader>
        <CardContent className="grid h-64 place-items-center text-sm text-muted-foreground">
          No sessions recorded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                dataKey="value"
                nameKey="name"
                innerRadius={54}
                outerRadius={84}
                paddingAngle={2}
                stroke="none"
              >
                {distribution.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value: string) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lift">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">
                        {formatHours(Number(item.value) / 60)}
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
