"use client";

import { useCallback, useState } from "react";
import { Download } from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalesReportView } from "@/components/reports/report-views";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Range {
  start: string;
  end: string;
}

function rangeForDays(days: number): Range {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "12m", days: 365 },
];

function activePreset(range: Range): string | null {
  const match = PRESETS.find((preset) => {
    const expected = rangeForDays(preset.days);
    return expected.start === range.start && expected.end === range.end;
  });
  return match?.label ?? null;
}

export default function RevenuePage() {
  const toast = useToast();
  const [range, setRange] = useState<Range>(() => rangeForDays(30));
  const [rows, setRows] = useState<unknown[]>([]);

  const capture = useCallback((next: unknown[]) => setRows(Array.isArray(next) ? next : []), []);

  const exportCsv = () => {
    if (rows.length === 0) {
      toast.error("There is nothing to export yet");
      return;
    }
    const columns = Object.keys(rows[0] as Record<string, unknown>).map((key) => ({
      header: key.replace(/[_-]+/g, " "),
      value: (row: Record<string, unknown>) => row[key] as string | number | null,
    }));
    downloadCsv(`bizflow-revenue-${range.start}-to-${range.end}`, rows as Record<string, unknown>[], columns);
  };

  const apply = (next: Partial<Range>) => setRange((prev) => ({ ...prev, ...next }));
  const preset = activePreset(range);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Revenue"
        description="Sales performance, average order value, and your best customers and products."
        actions={
          <Button size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((option) => (
            <Button
              key={option.label}
              size="sm"
              variant={preset === option.label ? "default" : "outline"}
              onClick={() => setRange(rangeForDays(option.days))}
              aria-pressed={preset === option.label}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex items-end gap-2 sm:ml-auto">
          <div className="space-y-1.5">
            <Label htmlFor="revenue-start" className="text-xs">
              From
            </Label>
            <Input
              id="revenue-start"
              type="date"
              value={range.start}
              max={range.end}
              onChange={(event) => apply({ start: event.target.value })}
              className="h-8 w-36 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="revenue-end" className="text-xs">
              To
            </Label>
            <Input
              id="revenue-end"
              type="date"
              value={range.end}
              min={range.start}
              onChange={(event) => apply({ end: event.target.value })}
              className="h-8 w-36 text-xs"
            />
          </div>
        </div>
      </div>

      {range.start > range.end ? (
        <p className={cn("text-xs text-destructive")} role="alert">
          The start date is after the end date — the report may be empty.
        </p>
      ) : null}

      <SalesReportView key={`${range.start}-${range.end}`} range={range} onData={capture} />
    </div>
  );
}
