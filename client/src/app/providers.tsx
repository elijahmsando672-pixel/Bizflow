"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <MainLayout>{children}</MainLayout>
    </ToastProvider>
  );
}