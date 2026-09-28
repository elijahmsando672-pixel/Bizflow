"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";

/** Route transition + first data fetch. Never a blank frame. */
export function WorkspaceLoading() {
  return (
    <div className="bw-root flex items-center justify-center px-4">
      <div className="bw-panel flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl px-6 py-10 text-center">
        <div className="relative">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-[#4dd0e133]" />
          <span className="relative block h-16 w-16 overflow-hidden rounded-2xl bg-white/85 shadow-sm">
            <Image src="/logo.png" alt="BizFlow" fill sizes="64px" className="object-contain" />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Loader2 className="bw-ink-soft h-4 w-4 animate-spin" aria-hidden />
          <p className="bw-ink-soft text-sm font-medium">Preparing your business workspace…</p>
        </div>
      </div>
    </div>
  );
}
