"use client";

import { useState } from "react";

interface Rule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
}

let nextId = 4;

export default function AutomationPage() {
  const [rules, setRules] = useState<Rule[]>([
    { id: "1", name: "Low Stock Alert", trigger: "Stock below reorder level", action: "Send email notification", active: true },
    { id: "2", name: "Invoice Overdue", trigger: "Invoice due date passed", action: "Send payment reminder", active: true },
    { id: "3", name: "New Lead Assignment", trigger: "Lead score > 80", action: "Assign to sales rep", active: false },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", trigger: "", action: "" });

  const toggle = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  const remove = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const addRule = () => {
    if (!newRule.name || !newRule.trigger || !newRule.action) return;
    setRules((prev) => [...prev, { ...newRule, id: String(nextId++), active: true }]);
    setNewRule({ name: "", trigger: "", action: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Automation</h1>
          <p className="text-gray-400 text-sm mt-1">Automate repetitive tasks and workflows.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Add Rule
        </button>
      </div>

      {showForm && (
        <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6 space-y-4">
          <h3 className="text-white font-semibold">New Automation Rule</h3>
          <input
            placeholder="Rule name"
            value={newRule.name}
            onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            placeholder="Trigger condition"
            value={newRule.trigger}
            onChange={(e) => setNewRule((p) => ({ ...p, trigger: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            placeholder="Action to perform"
            value={newRule.action}
            onChange={(e) => setNewRule((p) => ({ ...p, action: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <button onClick={addRule} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              Save Rule
            </button>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Automation Rules ({rules.length})</h2>
        </div>
        {rules.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No automation rules yet. Create your first rule above.</p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                <div className="flex-1">
                  <p className="text-white font-medium">{rule.name}</p>
                  <p className="text-gray-400 text-sm mt-0.5">When {rule.trigger} → {rule.action}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggle(rule.id)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${rule.active ? "bg-indigo-600" : "bg-white/20"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${rule.active ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                  <button
                    onClick={() => remove(rule.id)}
                    className="text-red-400 hover:text-red-300 text-xs font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
