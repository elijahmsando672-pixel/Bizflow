import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  Building2,
  HandCoins,
  LayoutGrid,
  Settings,
  ShoppingCart,
  Smartphone,
  Store,
  Tags,
  TrendingDown,
  Truck,
  User,
  Users,
} from "lucide-react";

export interface BusinessModule {
  id: string;
  label: string;
  /**
   * Canonical BizFlow route. Alias pages such as `/sales` or `/dispatch` are never
   * linked directly — several of them forward to the wrong section.
   */
  href: string;
  icon: LucideIcon;
  /** Icon chip tint. Only the chip carries the colour; the card stays translucent. */
  tint: string;
}

/**
 * The launcher grid, in display order.
 *
 * Dispatch and Transfers both resolve to `/dashboard/transfers`: stock movement
 * between shops is the only dispatch/fulfilment surface the app has, and the
 * existing `/dispatch` alias already points there.
 */
export const BUSINESS_MODULES: BusinessModule[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutGrid, tint: "#3b82f6" },
  { id: "sales", label: "Sales", href: "/dashboard/sales", icon: ShoppingCart, tint: "#16a34a" },
  { id: "payments", label: "Payments", href: "/dashboard/payments", icon: Smartphone, tint: "#0891b2" },
  { id: "dispatch", label: "Dispatch", href: "/dashboard/transfers", icon: Truck, tint: "#14b8a6" },
  { id: "credit", label: "Credit", href: "/dashboard/credit", icon: HandCoins, tint: "#7c5cd6" },
  { id: "expenses", label: "Expenses", href: "/dashboard/expenses", icon: TrendingDown, tint: "#dc2626" },
  { id: "shops", label: "Shops", href: "/dashboard/shops", icon: Store, tint: "#ea580c" },
  { id: "inventory", label: "Inventory", href: "/dashboard/inventory", icon: Boxes, tint: "#4f46e5" },
  { id: "transfers", label: "Transfers", href: "/dashboard/transfers", icon: ArrowLeftRight, tint: "#0d9488" },
  { id: "categories", label: "Categories", href: "/dashboard/categories", icon: Tags, tint: "#ca8a04" },
  { id: "reports", label: "Reports", href: "/dashboard/reports", icon: BarChart3, tint: "#15803d" },
  { id: "customers", label: "Customers", href: "/dashboard/customers", icon: User, tint: "#db2777" },
  { id: "users", label: "Users", href: "/users", icon: Users, tint: "#8b5cf6" },
  { id: "suppliers", label: "Suppliers", href: "/dashboard/suppliers", icon: Building2, tint: "#059669" },
  { id: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings, tint: "#475569" },
];

/**
 * Guards the `?next=` hop between the launcher and the shop picker: only
 * same-origin absolute paths are honoured, so `//evil.example` cannot be used
 * to bounce a signed-in user off-site.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}
