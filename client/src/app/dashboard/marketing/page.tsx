"use client";

import { useState } from "react";

interface Campaign {
  id: string;
  name: string;
  sent: number;
  opened: number;
  clicked: number;
  rate: number;
}

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: "1", name: "Summer Sale", sent: 1240, opened: 680, clicked: 320, rate: 26 },
    { id: "2", name: "New Product Launch", sent: 980, opened: 510, clicked: 210, rate: 21 },
    { id: "3", name: "Customer Rewards", sent: 650, opened: 390, clicked: 180, rate: 28 },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [newCamp, setNewCamp] = useState({ name: "" });

  const totals = {
    sent: campaigns.reduce((s, c) => s + c.sent, 0),
    opened: campaigns.reduce((s, c) => s + c.opened, 0),
    clicked: campaigns.reduce((s, c) => s + c.clicked, 0),
  };

  const addCampaign = () => {
    if (!newCamp.name) return;
    const id = String(Date.now());
    setCampaigns((prev) => [...prev, { id, name: newCamp.name, sent: 0, opened: 0, clicked: 0, rate: 0 }]);
    setNewCamp({ name: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing</h1>
          <p className="text-gray-400 text-sm mt-1">Track campaigns and engagement.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + New Campaign
        </button>
      </div>

      {showForm && (
        <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6 space-y-4">
          <h3 className="text-white font-semibold">Create Campaign</h3>
          <input
            placeholder="Campaign name"
            value={newCamp.name}
            onChange={(e) => setNewCamp({ name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <button onClick={addCampaign} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              Create
            </button>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4">
          <p className="text-gray-400 text-xs">Total Sent</p>
          <p className="text-2xl font-bold text-white mt-1">{totals.sent.toLocaleString()}</p>
        </div>
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4">
          <p className="text-gray-400 text-xs">Avg Open Rate</p>
          <p className="text-2xl font-bold text-white mt-1">
            {totals.sent ? Math.round((totals.opened / totals.sent) * 100) : 0}%
          </p>
        </div>
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4">
          <p className="text-gray-400 text-xs">Avg Click Rate</p>
          <p className="text-2xl font-bold text-white mt-1">
            {totals.sent ? Math.round((totals.clicked / totals.sent) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Campaigns ({campaigns.length})</h2>
        {campaigns.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No campaigns yet. Create your first campaign above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left py-3">Campaign</th>
                  <th className="text-left py-3">Sent</th>
                  <th className="text-left py-3">Opened</th>
                  <th className="text-left py-3">Clicked</th>
                  <th className="text-left py-3">Rate</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 text-white">
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3 text-gray-400">{c.sent}</td>
                    <td className="py-3 text-gray-400">{c.opened}</td>
                    <td className="py-3 text-gray-400">{c.clicked}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 bg-white/10 rounded-full w-24">
                          <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${c.rate}%` }} />
                        </div>
                        <span className="text-gray-400">{c.rate}%</span>
                      </div>
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
