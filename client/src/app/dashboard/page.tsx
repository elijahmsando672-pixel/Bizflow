"use client";

import { useAuth } from "@/lib/auth-context";
import dynamic from "next/dynamic";
import {
  TrendingUp,
  DollarSign,
  Package,
  Smartphone,
  TrendingDown,
  AlertTriangle,
  Eye,
  Plus,
  RefreshCw,
  ZoomOut,
  ZoomIn,
} from "lucide-react";

const Chart = dynamic(() => import("@/components/dashboard/SalesChart"), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 animate-pulse">
      <div className="h-[250px] bg-gray-700/30 rounded-xl" />
    </div>
  ),
});

const statistics = [
  { label: "Sales", value: "19,900", icon: TrendingUp, color: "teal" },
  { label: "Revenue", value: "~97,615", icon: DollarSign, color: "green" },
  { label: "Items in stock value", value: "624,388", icon: Package, color: "lime" },
  { label: "M-Pesa commission", value: "1,870", icon: Smartphone, color: "green" },
  { label: "M-Pesa cash", value: "14,265", icon: DollarSign, color: "orange" },
];

function getColorClasses(color: string) {
  const colors: Record<string, string> = {
    teal: "bg-teal-900 text-teal-400",
    green: "bg-green-900 text-green-400",
    lime: "bg-lime-900 text-lime-400",
    orange: "bg-orange-900 text-orange-400",
  };
  return colors[color] || colors.teal;
}

export default function DashboardPage() {
  const { user, selectedShop } = useAuth();

  return (
    <div className="space-y-6">
      {/* Today's Sales */}
      <div className="space-y-1">
        <div className="text-gray-400 text-sm">Today's Sales</div>
        <div className="text-gray-500 text-xs">Thu Jun 25, 2026</div>
        <div className="text-4xl font-bold text-white">KES 120.00</div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button className="bg-teal-900 hover:bg-teal-800 text-teal-300 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium">
          <Eye size={20} />
          View Sales
        </button>
        <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-gray-700">
          <Plus size={20} />
          New Sale
        </button>
        <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-gray-700">
          <Plus size={20} />
          New Stock
        </button>
      </div>

      {/* Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">Statistics</h3>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm font-semibold">&#8593; 159.96%</span>
            <span className="text-gray-400 text-sm">this month</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statistics.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center gap-4"
              >
                <div className={`${getColorClasses(stat.color)} p-3 rounded-lg flex-shrink-0`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-white text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-3 bg-gray-800 px-4 py-3 rounded-lg w-fit">
        <span className="text-gray-400 text-sm">2026-06-01 ~ 2026-06-25</span>
        <button className="text-gray-400 hover:text-white">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* More Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-900 p-2 rounded-lg">
              <TrendingDown size={24} className="text-red-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Expenses</p>
              <p className="text-white text-xl font-bold">41,799</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-teal-900 p-2 rounded-lg">
              <Package size={24} className="text-teal-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Purchased stock</p>
              <p className="text-white text-xl font-bold">75,716</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-900 p-2 rounded-lg">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Items out of stock</p>
              <p className="text-white text-xl font-bold">396</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-900 p-2 rounded-lg">
              <Smartphone size={24} className="text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">M-Pesa float</p>
              <p className="text-white text-xl font-bold">5,835</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Overview Chart */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold">Sales Overview</h3>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div />
            <div className="flex gap-2">
              <button className="text-gray-400 hover:text-white">
                <ZoomOut size={18} />
              </button>
              <button className="text-gray-400 hover:text-white">
                <ZoomIn size={18} />
              </button>
            </div>
          </div>
          <Chart />
        </div>
      </div>

      {/* M-Pesa Section */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" id="mpesa" className="w-4 h-4" defaultChecked />
          <label htmlFor="mpesa" className="text-white font-medium">
            M-Pesa
          </label>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-gray-400 text-sm">Commission</p>
            <p className="text-white font-bold">KES 1,870</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Deposits</p>
            <p className="text-white font-bold">KES 83,585</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Withdrawals</p>
            <p className="text-white font-bold">KES 92,480</p>
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="flex items-center justify-between text-gray-400 text-sm">
        <span>Transactions</span>
        <span>217</span>
      </div>
    </div>
  );
}
