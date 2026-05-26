"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";

interface Product {
  id: string;
  name: string;
  sku: string;
  selling_price: number;
  stock_qty: number;
  category_name: string;
  is_active: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.products.getAll()
      .then((data: any) => setProducts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalValue = products.reduce((sum, p) => sum + (p.selling_price * p.stock_qty), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <p className="text-gray-400 text-sm mt-1">{loading ? "" : `${products.length} products, ${formatCurrency(totalValue)} total value`}</p>
      </div>

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="text-left py-3">Name</th>
                <th className="text-left py-3">SKU</th>
                <th className="text-left py-3">Category</th>
                <th className="text-left py-3">Price</th>
                <th className="text-left py-3">Stock</th>
                <th className="text-left py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(loading ? Array(5).fill(null) : products).map((p: Product | null, i: number) => (
                <tr key={p?.id || i} className="border-b border-white/5 text-white">
                  <td className="py-3 font-medium">{p?.name || <div className="h-4 w-32 bg-white/10 animate-pulse rounded" />}</td>
                  <td className="py-3 text-gray-400">{p?.sku || "—"}</td>
                  <td className="py-3 text-gray-400">{p?.category_name || "—"}</td>
                  <td className="py-3 text-gray-400">{p ? formatCurrency(p.selling_price) : "—"}</td>
                  <td className="py-3">
                    {p && <span className={p.stock_qty <= 10 ? "text-red-400" : "text-gray-400"}>{p.stock_qty}</span>}
                  </td>
                  <td className="py-3">
                    {p && <span className={`px-2 py-0.5 rounded text-xs ${p.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
