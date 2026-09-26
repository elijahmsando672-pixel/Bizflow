"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, Store } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Branch/location switcher; reflects the shop selected in auth context. */
export function LocationSwitcher() {
  const { shops, selectedShop, setSelectedShop } = useAuth();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hidden h-9 max-w-[200px] items-center gap-2 rounded-md border border-border bg-card px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50 sm:inline-flex"
        >
          <Store className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="truncate">{selectedShop?.name ?? "Select location"}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Location</DropdownMenuLabel>
        {shops.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">No locations available yet.</div>
        ) : (
          shops.map((shop) => (
            <DropdownMenuItem key={shop.id} onSelect={() => setSelectedShop(shop)}>
              <Store className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span className="flex-1 truncate">{shop.name}</span>
              {selectedShop?.id === shop.id ? <Check className="h-4 w-4 text-primary" aria-hidden /> : null}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/select-shop")}>
          <Plus className="h-4 w-4" aria-hidden />
          Add or switch location
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LocationSwitcherMobile() {
  const { selectedShop } = useAuth();
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground sm:hidden">
      <Store className="h-4 w-4 text-primary" aria-hidden />
      <span className="max-w-[120px] truncate">{selectedShop?.name ?? "Location"}</span>
    </span>
  );
}
