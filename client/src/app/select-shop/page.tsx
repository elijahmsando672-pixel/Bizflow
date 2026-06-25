"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth, type Shop } from "@/lib/auth-context";
import { Building2, ArrowRight, Store } from "lucide-react";

export default function SelectShopPage() {
  const { shops, selectedShop, setSelectedShop, business, isLoading, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login");
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    if (!isLoading && shops.length === 1) {
      setSelectedShop(shops[0]);
      router.push("/dashboard");
    }
  }, [isLoading, shops, setSelectedShop, router]);

  if (isLoading || shops.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
            <Store className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500">Loading shops...</p>
        </div>
      </div>
    );
  }

  const shopColors = [
    "from-blue-500 to-blue-600",
    "from-green-500 to-emerald-600",
    "from-purple-500 to-purple-600",
    "from-orange-500 to-orange-600",
    "from-teal-500 to-cyan-500",
    "from-pink-500 to-rose-600",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-50">
      <div className="max-w-4xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {business?.name || "Your Business"}
          </h1>
          <p className="text-gray-500">Select a shop to start managing</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shops.map((shop, index) => (
            <button
              key={shop.id}
              onClick={() => {
                setSelectedShop(shop);
                router.push("/dashboard");
              }}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100 text-left"
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`bg-gradient-to-br ${shopColors[index % shopColors.length]} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <Store className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-gray-800 font-semibold text-lg">{shop.name}</h3>
                  {shop.location && (
                    <p className="text-gray-500 text-sm mt-1">{shop.location}</p>
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
