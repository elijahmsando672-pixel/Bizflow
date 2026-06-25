"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

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

  if (!mounted || isLoading) {
    return null;
  }

  if (!token || !selectedShop) {
    return null;
  }

  return <>{children}</>;
}
