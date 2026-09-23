"use client";

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
import { StatCard } from "@/components/modules/stat-card";
import { StatusBadge, type StatusTone } from "@/components/modules/status-badge";
import { useToast } from "@/components/ui/toast";
import { team, getInitials } from "@/lib/modules-data";

const statusTone: Record<string, StatusTone> = {
  Active: "success",
  Invited: "warning",
};

export default function TeamPage() {
  const toast = useToast();
  const active = team.filter((m) => m.status === "Active");
  const invited = team.filter((m) => m.status === "Invited");
  const avgLoad = Math.round(team.reduce((sum, m) => sum + m.load, 0) / team.length);

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle={`${team.length} members · ${invited.length} pending invite`}
        actions={
          <Button onClick={() => toast.info("Invites are sent by email once the production API is hooked up.")}>
            <Plus className="h-4 w-4" />
            Invite Member
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total members" value={String(team.length)} />
        <StatCard label="Active" value={String(active.length)} sub={`${Math.round((active.length / team.length) * 100)}% of all`} />
        <StatCard label="Avg. workload" value={`${avgLoad}%`} sub="Across active members" />
        <StatCard label="Pending invites" value={String(invited.length)} sub="Awaiting response" />
      </div>

      <Table className="rounded-none border-0">
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="hidden lg:table-cell">Email</TableHead>
            <TableHead className="hidden md:table-cell">Projects</TableHead>
            <TableHead className="w-[18%]">Workload</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(member.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{member.name}</p>
                    <p className="truncate text-xs text-muted-foreground md:hidden">{member.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{member.role}</TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">{member.email}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{member.projects}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${member.load}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{member.load}%</span>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge tone={statusTone[member.status]}>{member.status}</StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}