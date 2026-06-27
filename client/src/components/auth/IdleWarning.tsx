"use client";

import { useAuth } from "@/lib/auth-context";
import { Clock, LogOut } from "lucide-react";

export default function IdleWarning() {
  const { showIdleWarning, resetIdleTimer, logout } = useAuth();

  if (!showIdleWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
          <Clock className="h-7 w-7 text-warning" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Session Expiring</h2>
        <p className="text-sm text-muted-foreground mb-6">
          You have been inactive for a while. Your session will expire in 1 minute unless you continue browsing.
        </p>
        <div className="flex gap-3">
          <button
            onClick={resetIdleTimer}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Stay Logged In
          </button>
          <button
            onClick={logout}
            className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground font-medium text-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
