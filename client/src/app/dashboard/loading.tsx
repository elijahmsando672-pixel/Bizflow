export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-950 p-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-800 rounded-lg" />
        <div className="h-4 w-72 bg-gray-800/50 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/60 space-y-4">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-gray-700 rounded" />
              <div className="h-10 w-10 bg-gray-700 rounded-xl" />
            </div>
            <div className="h-8 w-32 bg-gray-700 rounded" />
            <div className="h-4 w-20 bg-gray-700/50 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gray-800/50 rounded-2xl p-6 border border-gray-700/60">
          <div className="h-6 w-48 bg-gray-700 rounded mb-6" />
          <div className="h-[320px] bg-gray-700/30 rounded-xl" />
        </div>
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/60">
          <div className="h-6 w-32 bg-gray-700 rounded mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-700/30 rounded-xl p-4 space-y-2">
                <div className="h-4 w-28 bg-gray-700 rounded" />
                <div className="h-3 w-40 bg-gray-700/50 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
