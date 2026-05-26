'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown, Package, Users, CheckSquare, AlertTriangle, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi, inventoryApi, tasksApi } from '@/lib/api';
import { useMemo } from 'react';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl" />)}
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon }: {
  title: string; value: string; change?: string; trend?: 'up' | 'down' | 'neutral'; icon: React.ReactNode;
}) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500';
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-slate-500">{icon}</div>
        {change && <span className={`text-sm ${trendColor}`}>{change}</span>}
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-500">{title}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardApi.getOverview(),
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: () => dashboardApi.getChartData(30),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: lowStock, isLoading: stockLoading } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: () => inventoryApi.getLowStock(),
  });

  const { data: tasksRaw, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks-active'],
    queryFn: () => tasksApi.getTasks(),
  });

  const isLoading = overviewLoading || chartLoading || statsLoading || stockLoading || tasksLoading;

  const allTasks = Array.isArray(tasksRaw) ? tasksRaw : (tasksRaw?.data ?? []);
  const pendingTasks = useMemo(
    () => allTasks.filter((t: any) => t.status !== 'DONE'),
    [allTasks],
  );

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of your business performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`$${(stats?.revenue.current ?? 0).toLocaleString()}`}
          change={stats ? `${stats.revenue.change >= 0 ? '+' : ''}${stats.revenue.change.toFixed(1)}%` : undefined}
          trend={stats && stats.revenue.change >= 0 ? 'up' : 'down'}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Total Expenses"
          value={`$${(stats?.expenses.current ?? 0).toLocaleString()}`}
          change={stats ? `${stats.expenses.change >= 0 ? '+' : ''}${stats.expenses.change.toFixed(1)}%` : undefined}
          trend={stats && stats.expenses.change < 0 ? 'up' : 'down'}
          icon={<TrendingDown className="w-5 h-5" />}
        />
        <StatCard
          title="Net Profit"
          value={`$${(stats?.profit.current ?? 0).toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Active Tasks"
          value={String(pendingTasks.length)}
          change={pendingTasks.length > 0 ? `${pendingTasks.length} pending` : 'All done'}
          trend={pendingTasks.length > 0 ? 'neutral' : 'up'}
          icon={<CheckSquare className="w-5 h-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue vs Expenses (30 days)</h2>
          {chartData && chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="income" stroke="#0ea5e9" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">No chart data available</div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          {overview && overview.recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {overview.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {tx.type === 'INCOME' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{tx.description || tx.type}</div>
                      <div className="text-sm text-slate-500">{new Date(tx.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className={`font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">No recent transactions</div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Low Stock Alert</h2>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          {lowStock && lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between items-center">
                  <span className="text-slate-600">{p.name}</span>
                  <span className="text-red-600 font-medium">{p.stock} left</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-slate-400 text-sm">All products well stocked</div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Customers</h2>
            <Users className="w-5 h-5 text-primary-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{overview?.counts.customers ?? 0}</div>
          <div className="text-sm text-slate-500">Total customers</div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pending Tasks</h2>
            <CheckSquare className="w-5 h-5 text-primary-500" />
          </div>
          {pendingTasks.length > 0 ? (
            <div className="space-y-3">
              {pendingTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    t.priority === 'URGENT' ? 'bg-red-500' : t.priority === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-slate-600 text-sm truncate">{t.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-slate-400 text-sm">No pending tasks</div>
          )}
        </div>
      </div>
    </div>
  );
}
