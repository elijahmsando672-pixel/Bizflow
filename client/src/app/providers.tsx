"use client";

import { useEffect, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { MainLayout } from "@/components/layout/MainLayout";
import { ToastProvider } from "@/components/ui/toast";
import LoginPage from "@/app/login/page";

function AuthContent({ children }: { children: ReactNode }) {
  const { isLoading, user, token } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && (!token || !user)) {
      router.push("/login");
    }
  }, [mounted, isLoading, token, user, router]);

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!token || !user) {
    return null;
  }

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthContent>{children}</AuthContent>
      </ToastProvider>
    </AuthProvider>
  );
}