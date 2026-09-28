"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

interface WorkspaceErrorProps {
  onRetry: () => void;
}

export function WorkspaceError({ onRetry }: WorkspaceErrorProps) {
  return (
    <div className="bw-root flex items-center justify-center px-4">
      <div className="bw-panel w-full max-w-sm rounded-3xl px-6 py-10 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dc26261f] text-[#dc2626]">
          <TriangleAlert className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="bw-ink text-base font-bold">Unable to load your business workspace.</h1>
        <p className="bw-ink-soft mt-1.5 text-sm">Check your connection and try again.</p>
        <button
          type="button"
          onClick={onRetry}
          className="bw-chip mt-5 inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Retry
        </button>
      </div>
    </div>
  );
}
