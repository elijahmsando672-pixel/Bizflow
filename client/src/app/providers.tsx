"use client";

import { useEffect, ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}