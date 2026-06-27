"use client";

export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/60 space-y-3">
            <div className="flex justify-between">
              <div className="w-10 h-10 bg-gray-700 rounded-lg" />
              <div className="w-14 h-4 bg-gray-700/50 rounded" />
            </div>
            <div className="h-7 w-3/4 bg-gray-700 rounded" />
            <div className="h-4 w-1/2 bg-gray-700/50 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-gray-800/50 rounded-xl p-5 border border-gray-700/60">
          <div className="h-5 w-40 bg-gray-700 rounded mb-5" />
          <div className="flex gap-2 h-40 items-end">
            {[45, 65, 35, 80, 55, 40, 70].map((h, i) => (
              <div key={i} className="flex-1 bg-gray-700 rounded-t-lg" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/60">
          <div className="h-5 w-32 bg-gray-700 rounded mb-5" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-700/40 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/60">
            <div className="h-5 w-36 bg-gray-700 rounded mb-4" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex justify-between mb-3">
                <div className="h-4 w-2/3 bg-gray-700/50 rounded" />
                <div className="h-4 w-1/6 bg-gray-700/50 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
