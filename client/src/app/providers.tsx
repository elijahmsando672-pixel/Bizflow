"use client";

import { type ReactNode } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/lib/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainLayout>
          {children}
        </MainLayout>
      </ToastProvider>
    </ThemeProvider>
  );
}
