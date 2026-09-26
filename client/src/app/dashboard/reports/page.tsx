"use client";

import { useCallback, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  CashflowReportView,
  InventoryReportView,
  ProfitLossReport,
  SalesReportView,
  TaxSummaryReport,
} from "@/components/reports/report-views";
import { cn } from "@/lib/utils";

type ReportTab = "profit-loss" | "sales" | "inventory" | "cashflow" | "tax";

const TABS: ReadonlyArray<{ value: ReportTab; label: string }> = [
  { value: "profit-loss", label: "Profit & loss" },
  { value: "sales", label: "Sales" },
  { value: "inventory", label: "Inventory" },
  { value: "cashflow", label: "Cashflow" },
  { value: "tax", label: "Tax" },
];

const RANGE_PRESETS = [
  { label: "This month", days: 0, months: 0 },
  { label: "Last 30 days", days: 30, months: 0 },
  { label: "This quarter", days: 0, months: 3 },
  { label: "This year", days: 0, months: 12 },
];

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<ReportTab>("profit-loss");
  const [start, setStart] = useState(() => isoDate(new Date(new Date().getFullYear(), 0, 1)));
  const [end, setEnd] = useState(() => isoDate(new Date()));
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [rows, setRows] = useState<unknown[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);

  const capture = useCallback((next: unknown[]) => setRows(Array.isArray(next) ? next : []), []);

  const applyPreset = (preset: (typeof RANGE_PRESETS)[number]) => {
    const now = new Date();
    const from = new Date(now);
    if (preset.months > 0) from.setMonth(from.getMonth() - preset.months);
    else from.setDate(from.getDate() - preset.days);
    setStart(isoDate(from));
    setEnd(isoDate(now));
  };

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current, current - 1, current - 2];
  }, []);

  const exportCsv = () => {
    if (rows.length === 0) {
      toast.error("There is nothing to export for this report yet");
      return;
    }
    const columns = Object.keys(rows[0] as Record<string, unknown>).map((key) => ({
      header: key.replace(/[_-]+/g, " "),
      value: (row: Record<string, unknown>) => row[key] as string | number | null,
    }));
    downloadCsv(`bizflow-${tab}-${start}-to-${end}`, rows as Record<string, unknown>[], columns);
    toast.success("Report exported");
  };

  const refresh = () => setRefreshToken((token) => token + 1);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        description="Profit and loss, sales performance, stock value, cashflow, and VAT."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Refresh
            </Button>
            <Button size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </Button>
          </>
        }
      />

      <Panel>
        <PanelBody className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          {tab === "tax" ? (
            <div className="space-y-1.5">
              <label htmlFor="report-year" className="text-xs font-medium text-muted-foreground">
                Tax year
              </label>
              <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                {yearOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setYear(option)}
                    aria-pressed={year === option}
                    className={cn(
                      "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                      year === option
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-1.5">
                <label htmlFor="report-start" className="text-xs font-medium text-muted-foreground">
                  From
                </label>
                <Input
                  id="report-start"
                  type="date"
                  value={start}
                  max={end}
                  onChange={(event) => setStart(event.target.value)}
                  className="h-9 w-full sm:w-44"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="report-end" className="text-xs font-medium text-muted-foreground">
                  To
                </label>
                <Input
                  id="report-end"
                  type="date"
                  value={end}
                  min={start}
                  onChange={(event) => setEnd(event.target.value)}
                  className="h-9 w-full sm:w-44"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                {RANGE_PRESETS.map((preset) => (
                  <Button key={preset.label} variant="outline" size="sm" onClick={() => applyPreset(preset)}>
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {tab === "tax" ? `Year ${year}` : `${formatDate(start)} – ${formatDate(end)}`}
          </p>
        </PanelBody>
      </Panel>

      <Tabs value={tab} onValueChange={(value) => setTab(value as ReportTab)}>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList>
            {TABS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="profit-loss">
          <ProfitLossReport
            key={`pl-${start}-${end}-${refreshToken}`}
            range={{ start, end }}
            onData={capture}
          />
        </TabsContent>
        <TabsContent value="sales">
          <SalesReportView
            key={`sales-${start}-${end}-${refreshToken}`}
            range={{ start, end }}
            onData={capture}
          />
        </TabsContent>
        <TabsContent value="inventory">
          <InventoryReportView key={`inv-${refreshToken}`} onData={capture} />
        </TabsContent>
        <TabsContent value="cashflow">
          <CashflowReportView
            key={`cf-${start}-${end}-${refreshToken}`}
            range={{ start, end }}
            onData={capture}
          />
        </TabsContent>
        <TabsContent value="tax">
          <TaxSummaryReport key={`tax-${year}-${refreshToken}`} year={year} onData={capture} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
