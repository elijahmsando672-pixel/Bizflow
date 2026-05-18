"use client";

function InsightCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
      <h3 className="font-semibold mb-2 text-white">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
}

const insights = [
  { title: "Sales Growth", desc: "Revenue trend is positive this period." },
  { title: "Top Products", desc: "Your best-selling items are driving revenue." },
  { title: "Customer Activity", desc: "Returning customer rate is healthy." },
];

export function AIInsights() {
  return (
    <div className="bg-[#121A2B] rounded-2xl p-6 border border-white/10">
      <h2 className="text-lg font-semibold text-white mb-6">AI Insights</h2>
      <div className="space-y-4">
        {insights.map((item) => (
          <InsightCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
}
