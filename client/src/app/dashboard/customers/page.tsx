"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchFrequentCustomers, formatCurrency } from "@/lib/data";
import {
  PageHeader, StatCard, Card, SearchBar, Table, Btn, Avatar, Badge
} from "@/components/dashboard/ui";
import { Users as UsersIcon, RefreshCw, Loader2 } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const freq = await fetchFrequentCustomers();
      setCustomers(Array.isArray(freq) ? freq : []);
    } catch { setCustomers([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c: any) =>
    (c.name || c.customer_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Customers" subtitle="Your most valuable customers">
        <Btn outline color="var(--color-muted-foreground)" onClick={load}><RefreshCw className="h-3 w-3" /> Refresh</Btn>
      </PageHeader>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Total Customers" value={String(filtered.length)} icon={<UsersIcon className="h-4 w-4" />} />
      </div>
      <Card className="mb-3">
        <SearchBar placeholder="Search customers..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <Table cols={["Customer", "Orders", "Total Spent", "Loyalty"]}
          rows={filtered.map((c: any) => [
            <div key="n" className="flex items-center gap-2">
              <Avatar name={c.name || c.customer_name} size={28} />
              <span className="font-medium">{c.name || c.customer_name || "Unknown"}</span>
            </div>,
            <span key="o" className="font-bold">{c.total_orders || 0}</span>,
            <span key="s" className="font-bold text-success">{formatCurrency(c.total_spent || 0)}</span>,
            <Badge key="l" label={c.total_orders > 10 ? "Gold" : c.total_orders > 5 ? "Silver" : "Bronze"}
              color={c.total_orders > 10 ? "var(--color-warning)" : c.total_orders > 5 ? "var(--color-accent-foreground)" : "var(--color-primary)"} />,
          ])}
          empty="No customer data yet." />
      )}
    </div>
  );
}
