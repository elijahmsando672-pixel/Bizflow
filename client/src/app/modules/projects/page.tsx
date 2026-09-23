"use client";

import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";
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
import { StatCard } from "@/components/modules/stat-card";
import { StatusBadge, type StatusTone } from "@/components/modules/status-badge";
import { projects } from "@/lib/modules-data";

const statusTone: Record<string, StatusTone> = {
  "On Track": "default",
  "At Risk": "warning",
  Delayed: "destructive",
  Complete: "success",
};

export default function ProjectsPage() {
  const active = projects.filter((p) => p.status !== "Complete").length;
  const onTrack = projects.filter((p) => p.status === "On Track").length;
  const atRisk = projects.filter((p) => p.status === "At Risk").length;
  const delayed = projects.filter((p) => p.status === "Delayed").length;

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${active} active · ${projects.length - active} complete`}
        actions={
          <Button asChild>
            <Link href="/modules/projects">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active projects" value={String(active)} />
        <StatCard
          label="On track"
          value={String(onTrack)}
          sub={`${Math.round((onTrack / Math.max(active, 1)) * 100)}% of active`}
        />
        <StatCard label="At risk" value={String(atRisk)} sub="Needs attention" />
        <StatCard label="Delayed" value={String(delayed)} sub="Pushed timelines" />
      </div>

      <Table className="rounded-none border-0">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[28%]">Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="w-[22%]">Progress</TableHead>
            <TableHead className="hidden md:table-cell">Due date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium text-foreground">{project.name}</TableCell>
              <TableCell className="text-muted-foreground">{project.client}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${project.progress}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">{project.progress}%</span>
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{project.due}</TableCell>
              <TableCell>
                <StatusBadge tone={statusTone[project.status]}>{project.status}</StatusBadge>
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  aria-label="Project actions"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}