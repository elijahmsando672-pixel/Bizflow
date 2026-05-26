"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_qty: number;
  reorder_level: number;
  category_name: string;
  is_active: boolean;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.products.getAll()
      .then((data: any) => setProducts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const lowStock = products.filter(p => p.stock_qty <= p.reorder_level);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Inventory</h1>
        <p className="text-gray-400 text-sm mt-1">Monitor stock levels and inventory.</p>
      </div>

      <div className="flex gap-4">
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4 flex-1">
          <p className="text-gray-400 text-xs">Total Products</p>
          <p className="text-2xl font-bold text-white mt-1">{loading ? "—" : products.length}</p>
        </div>
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4 flex-1">
          <p className="text-gray-400 text-xs">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{loading ? "—" : lowStock.length}</p>
        </div>
      </div>

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">{lowStock.length > 0 ? "⚠️ Low Stock Alert" : "All Items"}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="text-left py-3">Product</th>
                <th className="text-left py-3">SKU</th>
                <th className="text-left py-3">Category</th>
                <th className="text-left py-3">Stock</th>
                <th className="text-left py-3">Reorder At</th>
              </tr>
            </thead>
            <tbody>
              {(loading ? Array(5).fill(null) : (lowStock.length > 0 ? lowStock : products)).map((p: Product | null, i: number) => (
                <tr key={p?.id || i} className="border-b border-white/5 text-white">
                  <td className="py-3">{p ? <span className="font-medium">{p.name}</span> : <div className="h-4 w-32 bg-white/10 animate-pulse rounded" />}</td>
                  <td className="py-3 text-gray-400">{p?.sku || "—"}</td>
                  <td className="py-3 text-gray-400">{p?.category_name || "—"}</td>
                  <td className="py-3">
                    {p && <span className={p.stock_qty <= p.reorder_level ? "text-red-400 font-medium" : "text-gray-400"}>{p.stock_qty}</span>}
                  </td>
                  <td className="py-3 text-gray-400">{p?.reorder_level || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
