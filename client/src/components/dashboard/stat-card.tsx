"use client";

export function StatCard({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#121A2B] p-6 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-400 text-sm">{title}</div>
        <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
          {icon}
        </div>
      </div>
      <h2 className="text-3xl font-bold mb-2">{value}</h2>
      <p className="text-green-400 text-sm">{change}</p>
    </div>
  );
}
