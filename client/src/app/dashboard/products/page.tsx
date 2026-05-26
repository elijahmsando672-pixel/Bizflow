"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import Link from "next/link";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.products.getAll()
      .then((data: any) => setProducts(data))
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const totalValue = products.reduce((sum, p) => sum + (p.selling_price * p.stock_qty), 0);

  if (loading) {
    return <div className="space-y-4">
      {[1, 2].map((i) => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-gray-400 text-sm mt-1">{products.length} products, {formatCurrency(totalValue)} total value</p>
        </div>
        <Link
          href="/products"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          Manage Products
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
        {products.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No products yet.</p>
        ) : (
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
                {products.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b border-white/5 text-white">
                    <td className="py-3 font-medium">{p.name}</td>
                    <td className="py-3 text-gray-400">{p.sku}</td>
                    <td className="py-3 text-gray-400">{p.category_name || "—"}</td>
                    <td className="py-3 text-gray-400">{formatCurrency(p.selling_price)}</td>
                    <td className="py-3">
                      <span className={p.stock_qty <= 10 ? "text-red-400" : "text-gray-400"}>{p.stock_qty}</span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${p.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
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
