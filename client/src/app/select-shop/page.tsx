"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Building2, ArrowRight, Store, RotateCcw, LogOut, Loader2 } from "lucide-react";

export default function SelectShopPage() {
  const { shops, setSelectedShop, business, isLoading, token, fetchShops, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login");
    }
  }, [isLoading, token, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center shadow-md shadow-primary/20 animate-pulse">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Loading shops...</p>
        </div>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Store className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">No shops found</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your business has no shops available. Try again, or sign out and back in.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => fetchShops()}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="h-4 w-4" /> Retry
            </button>
            <button
              onClick={() => { logout(); router.replace("/login"); }}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const shopColors = [
    "#4dd0e1",
    "#4caf50",
    "#e44d7b",
    "#f5a623",
    "#4dd0e1",
    "#4caf50",
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center shadow-md shadow-primary/20">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {business?.name || "Your Business"}
          </h1>
          <p className="text-muted-foreground">Select a shop to start managing</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shops.map((shop, index) => (
            <button
              key={shop.id}
              onClick={() => {
                setSelectedShop(shop);
                router.push("/dashboard");
              }}
              className="group bg-card rounded-md p-6 shadow-sm hover:shadow-modal transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-border text-left"
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className="p-4 rounded-md group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${shopColors[index % shopColors.length]}1f` }}
                >
                  <Store className="w-8 h-8" style={{ color: shopColors[index % shopColors.length] }} />
                </div>
                <div className="text-center">
                  <h3 className="text-foreground font-semibold text-lg">{shop.name}</h3>
                  {shop.location && (
                    <p className="text-muted-foreground text-sm mt-1">{shop.location}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Enter <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
