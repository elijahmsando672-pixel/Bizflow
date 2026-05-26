"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.products.getAll()
      .then((data: any) => setProducts(data))
      .catch(() => setError("Failed to load inventory"))
      .finally(() => setLoading(false));
  }, []);

  const lowStock = products.filter((p) => p.stock_qty <= p.reorder_level);

  if (loading) {
    return <div className="space-y-4">
      {[1, 2].map((i) => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor stock levels and inventory.</p>
        </div>
        <Link
          href="/inventory"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          Manage Inventory
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="flex gap-4">
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4 flex-1">
          <p className="text-gray-400 text-xs">Total Products</p>
          <p className="text-2xl font-bold text-white mt-1">{products.length}</p>
        </div>
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4 flex-1">
          <p className="text-gray-400 text-xs">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{lowStock.length}</p>
        </div>
      </div>

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          {lowStock.length > 0 ? `Low Stock Alert (${lowStock.length})` : "All Inventory Items"}
        </h2>
        {products.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No products in inventory yet.</p>
        ) : (
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
                {(lowStock.length > 0 ? lowStock : products).slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b border-white/5 text-white">
                    <td className="py-3 font-medium">{p.name}</td>
                    <td className="py-3 text-gray-400">{p.sku}</td>
                    <td className="py-3 text-gray-400">{p.category_name || "—"}</td>
                    <td className="py-3">
                      <span className={p.stock_qty <= p.reorder_level ? "text-red-400 font-medium" : "text-gray-400"}>
                        {p.stock_qty}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">{p.reorder_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
