"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IndianRupee,
  TrendingUp,
  Receipt,
  Clock,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { useCyclesList } from "@/hooks/use-cycles";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(252, 87%, 64%)",
  "hsl(173, 80%, 40%)",
  "hsl(337, 84%, 58%)",
  "hsl(43, 96%, 56%)",
  "hsl(199, 89%, 48%)",
  "hsl(27, 98%, 54%)",
  "hsl(142, 71%, 45%)",
  "hsl(280, 65%, 60%)",
];

export default function DashboardPage() {
  const [cycleId, setCycleId] = useState<string | undefined>();
  const { data: cyclesData } = useCyclesList();
  const { data, isLoading } = useDashboard(cycleId);

  const kpiCards = [
    {
      title: "Total Expenses",
      value: formatCurrency(data?.totalExpenses || 0),
      icon: IndianRupee,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Transactions",
      value: String(data?.transactionCount || 0),
      icon: Receipt,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      title: "Total Received",
      value: formatCurrency(data?.totalReceived || 0),
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Pending Amount",
      value: formatCurrency(data?.pendingAmount || 0),
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];

  const categoryChartData = (data?.categorySpending || []).map((c) => ({
    name: c.categoryName || "Unknown",
    value: c.total,
    icon: c.categoryIcon,
  }));

  const memberChartData = (data?.memberSpending || []).map((m) => ({
    name: m.memberName || "Unknown",
    amount: m.totalAmount,
    received: m.totalReceived,
    pending: m.totalAmount - m.totalReceived,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of your expense tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="gap-1.5 h-10">
            <Link href="/expenses/new">
              <Plus className="h-4 w-4" />
              Add Expense
            </Link>
          </Button>
          <Combobox
            options={[
              { label: "All Cycles", value: "all" },
              ...(cyclesData?.data?.map((c) => ({ label: c.name, value: c.id })) || []),
            ]}
            value={cycleId || "all"}
            onChange={(v) => setCycleId(v === "all" ? undefined : v)}
            placeholder="All Cycles"
            className="w-full sm:w-[200px]"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))
          : kpiCards.map((kpi) => (
              <Card key={kpi.title} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {kpi.title}
                    </p>
                    <div className={`${kpi.bg} ${kpi.color} rounded-lg p-2`}>
                      <kpi.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight font-mono">
                    {kpi.value}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : categoryChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No expense data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Member Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Spending by Member (Received vs Pending)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : memberChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No split data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={memberChartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <RechartsTooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="received"
                    name="Received"
                    fill="hsl(142, 71%, 45%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="pending"
                    name="Pending"
                    fill="hsl(27, 98%, 54%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Expenses</CardTitle>
            <Button variant="ghost" size="sm" asChild className="gap-1.5">
              <Link href="/expenses">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.recentExpenses?.length ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No recent expenses
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentExpenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                      {e.categoryIcon || "📦"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{e.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(e.date)}</span>
                        <span>•</span>
                        <span>{e.paymentMethodName}</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-sm shrink-0 ml-4">
                    {formatCurrency(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
