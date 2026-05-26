"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  max_users: number;
  max_products: number;
}

interface CurrentSub {
  id: string;
  status: string;
  plan_name: string;
  plan_price: number;
  current_period_end: string;
  trial_ends_at: string;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<CurrentSub | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.subscriptions.getPlans() as Promise<Plan[]>,
      api.subscriptions.getCurrent() as Promise<CurrentSub>,
    ])
      .then(([p, c]) => { setPlans(p); setCurrent(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your subscription and billing.</p>
      </div>

      {current && (
        <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Current Plan</p>
          <p className="text-xl font-bold text-white">{current.plan_name || current.status}</p>
          {current.current_period_end && (
            <p className="text-gray-400 text-sm mt-1">
              Renews {new Date(current.current_period_end).toLocaleDateString()}
            </p>
          )}
          {current.trial_ends_at && (
            <p className="text-yellow-400 text-sm mt-1">
              Trial ends {new Date(current.trial_ends_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-[#121A2B] rounded-2xl border border-white/10 p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            <p className="text-gray-400 text-sm mt-1 flex-1">{plan.description}</p>
            <p className="text-3xl font-bold text-white mt-4">{formatCurrency(plan.price)}<span className="text-sm text-gray-400 font-normal">/mo</span></p>
            <ul className="mt-4 space-y-2">
              {plan.features?.map((f: string, i: number) => (
                <li key={i} className="text-gray-400 text-sm flex items-center gap-2">
                  <span className="text-green-400">✓</span>{f}
                </li>
              ))}
            </ul>
            <button className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition-colors">
              {current?.plan_name === plan.name ? "Current Plan" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
