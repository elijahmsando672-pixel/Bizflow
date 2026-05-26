export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading BizFlow...</p>
      </div>
    </div>
  );
}
