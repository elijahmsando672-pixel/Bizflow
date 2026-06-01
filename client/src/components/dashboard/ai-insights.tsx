"use client";

function InsightCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-card p-4 rounded-xl border border-border">
      <h3 className="font-semibold mb-2 text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
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
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-semibold text-card-foreground mb-6">AI Insights</h2>
      <div className="space-y-4">
        {insights.map((item) => (
          <InsightCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
}
