"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loader2 } from "lucide-react";

export function LoginContent({ children }: { children: React.ReactNode }) {
  const { isLoading, user, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    const isLoginPage = pathname === "/login";

    if (!token || !user) {
      if (!isLoginPage) {
        router.push("/login");
      }
    } else if (isLoginPage) {
      router.push("/");
    }
  }, [mounted, isLoading, token, user, pathname, router]);

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!token || !user) {
    return children;
  }

  return <MainLayout>{children}</MainLayout>;
}