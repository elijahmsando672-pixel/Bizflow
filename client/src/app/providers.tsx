"use client";

import { type ReactNode } from "react";
import { AppFrame } from "@/components/layout/app-frame";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/lib/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppFrame>{children}</AppFrame>
      </ToastProvider>
    </ThemeProvider>
  );
}
