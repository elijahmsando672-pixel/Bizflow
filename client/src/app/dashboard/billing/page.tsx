"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

interface CurrentSub {
  id: string;
  status: string;
  plan_name: string;
  plan_price: number;
  current_period_end: string;
  trial_ends_at: string;
  plan_id: string;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<CurrentSub | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, c] = await Promise.all([
        api.subscriptions.getPlans() as Promise<Plan[]>,
        api.subscriptions.getCurrent() as Promise<CurrentSub>,
      ]);
      setPlans(p.filter((pl) => pl.name !== "Free Trial"));
      setCurrent(c);
    } catch {
      setError("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleActivate = async (planId: string) => {
    setActivating(planId);
    setError(null);
    try {
      await api.subscriptions.activate(planId);
      await load();
    } catch {
      setError("Failed to activate plan. Please try again.");
    } finally {
      setActivating(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    setError(null);
    try {
      await api.subscriptions.cancel();
      await load();
    } catch {
      setError("Failed to cancel subscription");
    }
  };

  if (loading) {
    return <div className="space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your subscription and billing.</p>
        </div>
        <Link
          href="/subscription"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          Full Billing Portal
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {current && current.status !== "no_subscription" && (
        <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Current Plan</p>
              <p className="text-xl font-bold text-white">{current.plan_name || current.status}</p>
              {current.current_period_end && (
                <p className="text-gray-400 text-sm mt-1">Renews {new Date(current.current_period_end).toLocaleDateString()}</p>
              )}
              {current.trial_ends_at && current.status === "trial" && (
                <p className="text-yellow-400 text-sm mt-1">Trial ends {new Date(current.trial_ends_at).toLocaleDateString()}</p>
              )}
            </div>
            {current.status === "active" && (
              <button
                onClick={handleCancel}
                className="text-red-400 hover:text-red-300 text-sm font-medium border border-red-400/30 hover:border-red-400/50 px-4 py-2 rounded-xl transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {plans.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-gray-400">No plans available</div>
        )}
        {plans.map((plan) => {
          const isCurrent = current?.plan_id === plan.id && current?.status === "active";
          return (
            <div key={plan.id} className="bg-[#121A2B] rounded-2xl border border-white/10 p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="text-gray-400 text-sm mt-1 flex-1">{plan.description}</p>
              <p className="text-3xl font-bold text-white mt-4">
                {formatCurrency(plan.price)}
                <span className="text-sm text-gray-400 font-normal">/mo</span>
              </p>
              <ul className="mt-4 space-y-2">
                {(plan.features || []).map((f: string, i: number) => (
                  <li key={i} className="text-gray-400 text-sm flex items-center gap-2">
                    <span className="text-green-400">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleActivate(plan.id)}
                disabled={isCurrent || activating === plan.id}
                className={`mt-6 w-full font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 ${
                  isCurrent
                    ? "bg-white/10 text-gray-400 cursor-default"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {activating === plan.id ? "Activating..." : isCurrent ? "Current Plan" : `Choose ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
