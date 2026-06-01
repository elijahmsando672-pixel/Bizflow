"use client";

import { useState } from "react";
import { Calculator, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import api from "@/lib/api";
import type { RestockBudgetData } from "@/types";

export function RestockBudget({
  data,
  onCreated,
}: {
  data: RestockBudgetData | null;
  onCreated: () => void;
}) {
  const [multiplier, setMultiplier] = useState("2");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [selectedVendor] = useState<string>("");

  async function handleCreate() {
    if (!data?.items?.length) return;
    setLoading(true);
    try {
      await api.dashboard.createRestockBudget({
        items: data.items.map((i) => ({
          product_id: i.id, name: i.name, cost_price: i.cost_price,
          stock_qty: i.stock_qty, reorder_level: i.reorder_level,
        })),
        vendor_id: selectedVendor || null,
        multiplier: parseFloat(multiplier),
      });
      setCreated(true);
      onCreated();
      setTimeout(() => setCreated(false), 3000);
    } catch {
      // handled by caller
    } finally {
      setLoading(false);
    }
  }

  if (!data?.items?.length) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="flex items-center gap-2 text-card-foreground font-semibold mb-2">
          <Calculator className="h-5 w-5 text-primary" /> Restock Budget
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">No items need restocking</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="flex items-center gap-2 text-card-foreground font-semibold mb-1">
        <Calculator className="h-5 w-5 text-primary" /> Restock Budget Calculator
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {data.itemCount} items need restocking &middot; Total estimated: {formatCurrency(data.totalBudget)}
      </p>
      <div className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">Stock Multiplier</label>
            <input
              type="number"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              min="1" max="5" step="0.5"
              className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:border-primary"
            />
            <p className="text-xs text-muted-foreground/70 mt-1">Target = reorder level &times; multiplier - current stock</p>
          </div>
          <button
            onClick={handleCreate}
            disabled={loading || created}
            className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 px-4 py-2.5 rounded-xl text-sm font-medium transition"
          >
            {created ? (
              <><CheckCircle className="h-4 w-4 mr-2 inline" /> Created!</>
            ) : loading ? (
              "Creating..."
            ) : (
              <><Calculator className="h-4 w-4 mr-2 inline" /> Create PO</>
            )}
          </button>
        </div>
        <div className="border border-border rounded-xl max-h-48 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left py-3 px-3">Product</th>
                <th className="text-right py-3">Current</th>
                <th className="text-right py-3">Target</th>
                <th className="text-right py-3">Order Qty</th>
                <th className="text-right py-3 pr-3">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => {
                const targetQty = Math.ceil(item.reorder_level * parseFloat(multiplier));
                const orderQty = Math.max(0, targetQty - item.stock_qty);
                const estCost = orderQty * (item.cost_price || 0);
                return (
                  <tr key={`${item.id}-${i}`} className="border-b border-border/50">
                    <td className="py-3 px-3 font-medium text-card-foreground text-sm">{item.name}</td>
                    <td className="py-3 text-right text-card-foreground/70">{item.stock_qty}</td>
                    <td className="py-3 text-right text-card-foreground/70">{targetQty}</td>
                    <td className="py-3 text-right font-semibold text-card-foreground">{orderQty}</td>
                    <td className="py-3 text-right pr-3 text-muted-foreground">{formatCurrency(estCost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
