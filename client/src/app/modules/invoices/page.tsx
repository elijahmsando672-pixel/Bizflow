"use client";

import { Plus, Download } from "lucide-react";
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
import { invoices, formatMoney, type InvoiceStatus } from "@/lib/modules-data";

const statusTone: Record<InvoiceStatus, StatusTone> = {
  Paid: "success",
  Pending: "warning",
  Overdue: "destructive",
  Draft: "outline",
};

export default function InvoicesPage() {
  const total = invoices.reduce((sum, i) => sum + i.amount, 0);
  const paid = invoices.filter((i) => i.status === "Paid");
  const pending = invoices.filter((i) => i.status === "Pending");
  const overdue = invoices.filter((i) => i.status === "Overdue");
  const paidTotal = paid.reduce((sum, i) => sum + i.amount, 0);
  const pendingTotal = pending.reduce((sum, i) => sum + i.amount, 0);
  const overdueTotal = overdue.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoices · ${formatMoney(total)} billed`}
        actions={
          <>
            <Button asChild variant="outline">
              <span>
                <Download className="h-4 w-4" />
                Export
              </span>
            </Button>
            <Button>
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total billed" value={formatMoney(total)} sub="All time" />
        <StatCard label="Paid" value={formatMoney(paidTotal)} sub={`${paid.length} invoices`} />
        <StatCard label="Pending" value={formatMoney(pendingTotal)} sub={`${pending.length} awaiting payment`} />
        <StatCard label="Overdue" value={formatMoney(overdueTotal)} sub={`${overdue.length} need follow-up`} />
      </div>

      <Table className="rounded-none border-0">
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="hidden md:table-cell">Issued</TableHead>
            <TableHead className="hidden lg:table-cell">Due</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium text-foreground">{invoice.number}</TableCell>
              <TableCell className="text-muted-foreground">{invoice.client}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{invoice.issued}</TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">{invoice.due}</TableCell>
              <TableCell className="text-right tabular-nums text-foreground">
                {formatMoney(invoice.amount)}
              </TableCell>
              <TableCell>
                <StatusBadge tone={statusTone[invoice.status]}>{invoice.status}</StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}