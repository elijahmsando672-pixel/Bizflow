"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Store } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, selectedShop, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login");
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    if (!isLoading && token && !selectedShop) {
      router.replace("/select-shop");
    }
  }, [isLoading, token, selectedShop, router]);

  if (!mounted || isLoading || !token || !selectedShop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center shadow-md shadow-primary/20 animate-pulse">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Loading BizFlow...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
