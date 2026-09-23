"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge, type StatusTone } from "@/components/modules/status-badge";
import { tasks, type TaskPriority, type TaskStatus } from "@/lib/modules-data";
import { cn } from "@/lib/utils";

const priorityTone: Record<TaskPriority, StatusTone> = {
  High: "destructive",
  Medium: "warning",
  Low: "outline",
};

const statusTone: Record<TaskStatus, StatusTone> = {
  "To Do": "neutral",
  "In Progress": "default",
  Done: "success",
};

type Filter = "All" | TaskStatus;
const filters: Filter[] = ["All", "To Do", "In Progress", "Done"];

export default function TasksPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const visible = tasks.filter((t) => filter === "All" || t.status === filter);

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${tasks.filter((t) => t.status !== "Done").length} open · ${tasks.filter((t) => t.status === "Done").length} done`}
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const count = f === "All" ? tasks.length : tasks.filter((t) => t.status === f).length;
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {f}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Table className="rounded-none border-0">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[34%]">Task</TableHead>
            <TableHead>Project</TableHead>
            <TableHead className="hidden md:table-cell">Assignee</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="hidden lg:table-cell">Due date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium text-foreground">{task.title}</TableCell>
              <TableCell className="text-muted-foreground">{task.project}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{task.assignee}</TableCell>
              <TableCell>
                <StatusBadge tone={priorityTone[task.priority]}>{task.priority}</StatusBadge>
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">{task.due}</TableCell>
              <TableCell>
                <StatusBadge tone={statusTone[task.status]}>{task.status}</StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}