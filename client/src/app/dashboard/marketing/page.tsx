"use client";

export default function MarketingPage() {
  const campaigns = [
    { name: "Summer Sale", sent: 1240, opened: 680, clicked: 320, rate: 26 },
    { name: "New Product Launch", sent: 980, opened: 510, clicked: 210, rate: 21 },
    { name: "Customer Rewards", sent: 650, opened: 390, clicked: 180, rate: 28 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Marketing</h1>
        <p className="text-gray-400 text-sm mt-1">Track campaigns and engagement.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4">
          <p className="text-gray-400 text-xs">Total Sent</p>
          <p className="text-2xl font-bold text-white mt-1">2,870</p>
        </div>
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4">
          <p className="text-gray-400 text-xs">Avg Open Rate</p>
          <p className="text-2xl font-bold text-white mt-1">24%</p>
        </div>
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4">
          <p className="text-gray-400 text-xs">Avg Click Rate</p>
          <p className="text-2xl font-bold text-white mt-1">11%</p>
        </div>
      </div>

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Campaigns</h2>
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
                <tr key={c.name} className="border-b border-white/5 text-white">
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
      </div>
    </div>
  );
}
