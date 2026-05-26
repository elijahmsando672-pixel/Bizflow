"use client";

import { useState } from "react";

interface Rule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
}

const defaultRules: Rule[] = [
  { id: "1", name: "Low Stock Alert", trigger: "Stock below reorder level", action: "Send email notification", active: true },
  { id: "2", name: "Invoice Overdue", trigger: "Invoice due date passed", action: "Send payment reminder", active: true },
  { id: "3", name: "New Lead Assignment", trigger: "Lead score > 80", action: "Assign to sales rep", active: false },
];

export default function AutomationPage() {
  const [rules, setRules] = useState<Rule[]>(defaultRules);

  const toggle = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Automation</h1>
        <p className="text-gray-400 text-sm mt-1">Automate repetitive tasks and workflows.</p>
      </div>

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Automation Rules</h2>
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
              <div>
                <p className="text-white font-medium">{rule.name}</p>
                <p className="text-gray-400 text-sm mt-0.5">When {rule.trigger} → {rule.action}</p>
              </div>
              <button
                onClick={() => toggle(rule.id)}
                className={`relative w-12 h-6 rounded-full transition-colors ${rule.active ? "bg-indigo-600" : "bg-white/20"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${rule.active ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
