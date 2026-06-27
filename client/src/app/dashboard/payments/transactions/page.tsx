"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import {
  PageHeader, Card, SearchBar, Select, Table, Btn, Badge
} from "@/components/ui/dashboard-ui";
import { RefreshCw, Loader2 } from "lucide-react";

interface MpesaTransaction {
  id: string;
  entry_type: "inflow" | "outflow";
  amount: number;
  date: string;
  description: string;
  category: string;
  reference: string;
  payment_method: string;
  created_at: string;
}

interface TxResponse {
  transactions: MpesaTransaction[];
  total_inflow: number;
  total_outflow: number;
  net: number;
}

export default function PaymentTransactionsPage() {
  const [data, setData] = useState<TxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("status", typeFilter);
      if (search) params.set("search", search);
      const result = await api.payments.mpesa.getTransactions(params.toString()) as TxResponse;
      setData(result);
    } catch { setData(null); } finally { setLoading(false); }
  }, [typeFilter, search]);

  useEffect(() => { load(); }, [load]);

  const txs = data?.transactions ?? [];

  return (
    <div>
      <PageHeader title="M-Pesa Transactions" subtitle="All mobile money transactions">
        <Btn outline color="var(--color-muted-foreground)" onClick={load}><RefreshCw className="h-3 w-3" /> Refresh</Btn>
      </PageHeader>
      <div className="flex flex-wrap gap-3 mb-4">
        <Card accent="var(--color-success)" className="flex-1 min-w-[150px]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Inflow</div>
          <div className="text-[22px] font-extrabold text-success">{formatCurrency(data?.total_inflow ?? 0)}</div>
        </Card>
        <Card accent="var(--color-destructive)" className="flex-1 min-w-[150px]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Outflow</div>
          <div className="text-[22px] font-extrabold text-destructive">{formatCurrency(data?.total_outflow ?? 0)}</div>
        </Card>
        <Card accent="var(--color-primary)" className="flex-1 min-w-[150px]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Net</div>
          <div className="text-[22px] font-extrabold" style={{ color: "var(--color-primary)" }}>{formatCurrency(data?.net ?? 0)}</div>
        </Card>
      </div>
      <Card className="mb-3">
        <div className="flex gap-3 flex-wrap">
          <SearchBar placeholder="Search by description or reference..." value={search} onChange={setSearch} />
          <Select options={[{ label: "All Types", value: "ALL" }, { label: "Inflow", value: "inflow" }, { label: "Outflow", value: "outflow" }]} value={typeFilter} onChange={setTypeFilter} />
        </div>
      </Card>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <Table cols={["Date", "Description", "Type", "Amount", "Category", "Reference"]}
          rows={txs.map((t) => [
            <span key="d" className="text-muted-foreground text-xs">{t.date ? new Date(t.date).toLocaleDateString("en-GB") : "-"}</span>,
            <span key="desc" className="font-medium">{t.description || "N/A"}</span>,
            <Badge key="ty" label={t.entry_type === "inflow" ? "INFLOW" : "OUTFLOW"} color={t.entry_type === "inflow" ? "var(--color-success)" : "var(--color-destructive)"} />,
            <span key="am" className={`font-bold ${t.entry_type === "inflow" ? "text-success" : "text-destructive"}`}>{formatCurrency(parseFloat(String(t.amount)) || 0)}</span>,
            <span key="cat" className="text-muted-foreground text-xs">{t.category || "-"}</span>,
            <span key="ref" className="text-muted-foreground text-xs font-mono">{t.reference?.slice?.(0, 12) || "-"}</span>,
          ])}
          empty="No M-Pesa transactions found." />
      )}
    </div>
  );
}
