export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0B1020] p-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-white/10 rounded-lg" />
        <div className="h-4 w-72 bg-white/5 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#121A2B] rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-white/10 rounded" />
              <div className="h-10 w-10 bg-white/10 rounded-xl" />
            </div>
            <div className="h-8 w-32 bg-white/10 rounded" />
            <div className="h-4 w-20 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-[#121A2B] rounded-2xl p-6 border border-white/10">
          <div className="h-6 w-48 bg-white/10 rounded mb-6" />
          <div className="h-[320px] bg-white/5 rounded-xl" />
        </div>
        <div className="bg-[#121A2B] rounded-2xl p-6 border border-white/10">
          <div className="h-6 w-32 bg-white/10 rounded mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="h-4 w-28 bg-white/10 rounded" />
                <div className="h-3 w-40 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-[#121A2B] rounded-2xl p-6 border border-white/10">
            <div className="h-5 w-36 bg-white/10 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white/10 rounded-xl" />
                    <div className="space-y-1">
                      <div className="h-4 w-28 bg-white/10 rounded" />
                      <div className="h-3 w-20 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
