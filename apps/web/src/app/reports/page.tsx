'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import { financeApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => financeApi.getSummary(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  const incomeCategories = summary?.byCategory.filter((c) => c.type === 'INCOME') ?? [];
  const expenseCategories = summary?.byCategory.filter((c) => c.type === 'EXPENSE') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500">Financial reports and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-slate-500">Total Income</span>
          </div>
          <div className="text-2xl font-bold text-green-600">${(summary?.total.income ?? 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-slate-500">Total Expenses</span>
          </div>
          <div className="text-2xl font-bold text-red-600">${(summary?.total.expense ?? 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-slate-500">Net Profit</span>
          </div>
          <div className="text-2xl font-bold text-primary-600">${(summary?.total.profit ?? 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Income by Category</h2>
          {incomeCategories.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeCategories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">No income data</div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Expense by Category</h2>
          {expenseCategories.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseCategories.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">No expense data</div>
          )}
        </div>
      </div>
    </div>
  );
}
