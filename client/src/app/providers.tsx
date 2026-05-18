"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/lib/theme-provider";
import { useAuth } from "@/lib/auth-context";

function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { subscription, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const authPages = ["/login", "/signup", "/reset-password", "/accept-invite", "/subscription"];
  const isAuthPage = authPages.includes(pathname);

  useEffect(() => {
    if (isLoading || isAuthPage || !user) return;

    if (subscription) {
      const isExpired =
        subscription.status === "expired" ||
        subscription.status === "cancelled" ||
        (subscription.status === "trial" &&
          subscription.trial_ends_at &&
          new Date(subscription.trial_ends_at) < new Date());

      if (isExpired) {
        router.push("/subscription");
      }
    }
  }, [subscription, isLoading, user, isAuthPage, router]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const authPages = ["/login", "/signup", "/reset-password", "/accept-invite"];
  const isAuthPage = authPages.includes(pathname);
  const isDashboard = pathname.startsWith("/dashboard");

  if (isAuthPage) {
    return (
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    );
  }

  if (isDashboard) {
    return (
      <ThemeProvider>
        <ToastProvider>
          <SubscriptionGuard>
            {children}
          </SubscriptionGuard>
        </ToastProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <MainLayout>
          <SubscriptionGuard>
            {children}
          </SubscriptionGuard>
        </MainLayout>
      </ToastProvider>
    </ThemeProvider>
  );
}
