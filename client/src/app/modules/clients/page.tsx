"use client";

import { Plus, Mail, Phone } from "lucide-react";
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
import { clients, getInitials, formatMoney } from "@/lib/modules-data";

const statusTone: Record<string, StatusTone> = {
  Active: "success",
  Inactive: "neutral",
};

export default function ClientsPage() {
  const totalValue = clients.reduce((sum, c) => sum + c.total, 0);
  const active = clients.filter((c) => c.status === "Active").length;
  const avgProjects = Math.round((clients.reduce((sum, c) => sum + c.projects, 0) / clients.length) * 10) / 10;

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} clients · ${active} active`}
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total clients" value={String(clients.length)} />
        <StatCard label="Active" value={String(active)} sub={`${Math.round((active / clients.length) * 100)}% of all`} />
        <StatCard label="Lifetime value" value={formatMoney(totalValue)} sub="Across all projects" />
        <StatCard label="Avg. projects / client" value={String(avgProjects)} />
      </div>

      <Table className="rounded-none border-0">
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="hidden md:table-cell">Projects</TableHead>
            <TableHead className="hidden sm:table-cell">Total value</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(client.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{client.company}</p>
                    <p className="truncate text-xs text-muted-foreground">{client.name}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <Phone className="h-3 w-3 shrink-0" />
                  {client.phone}
                </p>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{client.projects}</TableCell>
              <TableCell className="hidden tabular-nums text-muted-foreground sm:table-cell">
                {formatMoney(client.total)}
              </TableCell>
              <TableCell>
                <StatusBadge tone={statusTone[client.status]}>{client.status}</StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}