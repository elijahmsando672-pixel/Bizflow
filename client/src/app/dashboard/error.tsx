"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0B1020] flex items-center justify-center p-6">
      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-8 max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-14 w-14 bg-red-500/10 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Something went wrong</h2>
        <p className="text-sm text-gray-400">
          {error.message || "An unexpected error occurred loading the dashboard."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
