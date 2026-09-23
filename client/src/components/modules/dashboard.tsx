"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/modules/status-badge";
import { ChartTooltip, KpiSparkline } from "@/components/modules/charts";
import { useAuth } from "@/lib/auth-context";
import {
  kpis,
  revenueSeries,
  recentActivity,
  projects,
  tasks,
  getInitials,
  type TaskPriority,
} from "@/lib/modules-data";
import { cn } from "@/lib/utils";

const priorityTone: Record<TaskPriority, StatusTone> = {
  High: "destructive",
  Medium: "warning",
  Low: "outline",
};

export function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Good morning, {firstName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {today} · Here&apos;s what&apos;s happening across EmohTech Solutions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/modules/invoices">New Invoice</Link>
          </Button>
          <Button asChild>
            <Link href="/modules/projects">New Project</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.id} className="p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                  kpi.trend === "up"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {kpi.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {kpi.delta}%
              </span>
            </div>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{kpi.value}</p>
            <div className="mt-3">
              <KpiSparkline data={kpi.spark} gradientId={`spark-${kpi.id}`} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base">Revenue</CardTitle>
            <CardDescription>Last 12 months at a glance</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    tickFormatter={(v: number) => `${v}k`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)" }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>
              <Link href="/modules/tasks" className="text-primary hover:underline">
                View all
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {getInitials(activity.actor)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-muted-foreground">
                    <span className="font-medium text-foreground">{activity.actor}</span> {activity.action}{" "}
                    <span className="font-medium text-foreground">{activity.target}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between p-5 pb-2">
            <CardTitle className="text-base">Active Projects</CardTitle>
            <Link href="/modules/projects" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-2">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
                  <StatusBadge tone={projectTone(project.status)}>{project.status}</StatusBadge>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">{project.progress}%</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {project.client} · due {project.due}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between p-5 pb-2">
            <CardTitle className="text-base">Tasks Due Soon</CardTitle>
            <Link href="/modules/tasks" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-2">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    task.status === "Done" ? "bg-emerald-500" : task.status === "In Progress" ? "bg-primary" : "bg-muted-foreground/40"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{task.project}</p>
                </div>
                <StatusBadge tone={priorityTone[task.priority]}>{task.priority}</StatusBadge>
                <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">{task.due}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function projectTone(status: string): StatusTone {
  if (status === "Complete") return "success";
  if (status === "On Track") return "default";
  if (status === "At Risk") return "warning";
  return "destructive";
}