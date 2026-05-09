"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/lib/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  const authPages = ["/login", "/signup", "/reset-password", "/accept-invite"];
  const isAuthPage = authPages.includes(pathname);

  if (isAuthPage) {
    return (
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <MainLayout>{children}</MainLayout>
      </ToastProvider>
    </ThemeProvider>
  );
}