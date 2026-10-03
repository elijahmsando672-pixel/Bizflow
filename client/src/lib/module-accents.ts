import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  FileText,
  HandCoins,
  LayoutGrid,
  Package,
  ScanLine,
  ShoppingCart,
  Smartphone,
  Store,
  TrendingDown,
  Truck,
  Users,
  Wallet,
  BarChart3,
  Boxes,
  Settings,
  User,
} from "lucide-react";

/**
 * Module accents follow the BizFlow design language: every module owns one
 * hue, used for its icon, hero banner, active state and status pills — never
 * as a full-page background.
 */
export type ModuleTone =
  | "blue"
  | "green"
  | "teal"
  | "cyan"
  | "purple"
  | "coral"
  | "orange"
  | "gold"
  | "slate";

interface AccentClasses {
  /** Gradient fill for the hero banner. */
  hero: string;
  /** Translucent badge that holds the module icon on the hero. */
  heroIcon: string;
  /** Soft tinted icon chip used on white surfaces (stat cards, lists). */
  chip: string;
  /** Solid foreground colour for accents on light surfaces. */
  text: string;
}

const ACCENTS: Record<ModuleTone, AccentClasses> = {
  blue: {
    hero: "bg-gradient-to-br from-[#4a8bf0] to-[#2f63c4]",
    heroIcon: "bg-white/20 text-white ring-1 ring-inset ring-white/25",
    chip: "bg-[#4a8bf0]/12 text-[#2f63c4] dark:bg-[#4a8bf0]/20 dark:text-[#9cc2ff]",
    text: "text-[#2f63c4] dark:text-[#9cc2ff]",
  },
  green: {
    hero: "bg-gradient-to-br from-[#4cb96a] to-[#2e8f4c]",
    heroIcon: "bg-white/20 text-white ring-1 ring-inset ring-white/25",
    chip: "bg-[#4cb96a]/12 text-[#2e8f4c] dark:bg-[#4cb96a]/20 dark:text-[#8fd9a6]",
    text: "text-[#2e8f4c] dark:text-[#8fd9a6]",
  },
  teal: {
    hero: "bg-gradient-to-br from-[#2fc4cf] to-[#129aa6]",
    heroIcon: "bg-white/20 text-white ring-1 ring-inset ring-white/25",
    chip: "bg-[#2fc4cf]/12 text-[#129aa6] dark:bg-[#2fc4cf]/20 dark:text-[#7fe3ef]",
    text: "text-[#129aa6] dark:text-[#7fe3ef]",
  },
  cyan: {
    hero: "bg-gradient-to-br from-[#3ab8e0] to-[#1893bd]",
    heroIcon: "bg-white/20 text-white ring-1 ring-inset ring-white/25",
    chip: "bg-[#3ab8e0]/12 text-[#1893bd] dark:bg-[#3ab8e0]/20 dark:text-[#8fd8ef]",
    text: "text-[#1893bd] dark:text-[#8fd8ef]",
  },
  purple: {
    hero: "bg-gradient-to-br from-[#9a6bf0] to-[#6f43d6]",
    heroIcon: "bg-white/20 text-white ring-1 ring-inset ring-white/25",
    chip: "bg-[#9a6bf0]/12 text-[#6f43d6] dark:bg-[#9a6bf0]/20 dark:text-[#c6a9fb]",
    text: "text-[#6f43d6] dark:text-[#c6a9fb]",
  },
  coral: {
    hero: "bg-gradient-to-br from-[#f4796f] to-[#d94f45]",
    heroIcon: "bg-white/20 text-white ring-1 ring-inset ring-white/25",
    chip: "bg-[#f4796f]/12 text-[#cf4a40] dark:bg-[#f4796f]/20 dark:text-[#f7a89f]",
    text: "text-[#cf4a40] dark:text-[#f7a89f]",
  },
  orange: {
    hero: "bg-gradient-to-br from-[#f9a83c] to-[#dd7f10]",
    heroIcon: "bg-white/20 text-white ring-1 ring-inset ring-white/25",
    chip: "bg-[#f9a83c]/12 text-[#c26c07] dark:bg-[#f9a83c]/20 dark:text-[#fbc778]",
    text: "text-[#c26c07] dark:text-[#fbc778]",
  },
  gold: {
    hero: "bg-gradient-to-br from-[#eec54a] to-[#d1a017]",
    heroIcon: "bg-white/20 text-white ring-1 ring-inset ring-white/25",
    chip: "bg-[#eec54a]/14 text-[#a9801a] dark:bg-[#eec54a]/20 dark:text-[#f3d887]",
    text: "text-[#a9801a] dark:text-[#f3d887]",
  },
  slate: {
    hero: "bg-gradient-to-br from-[#6b7280] to-[#3f4756]",
    heroIcon: "bg-white/20 text-white ring-1 ring-inset ring-white/25",
    chip: "bg-[#6b7280]/12 text-[#3f4756] dark:bg-[#6b7280]/20 dark:text-[#c3c8d1]",
    text: "text-[#3f4756] dark:text-[#c3c8d1]",
  },
};

const DEFAULT_TONE: ModuleTone = "blue";

export function moduleAccent(tone: ModuleTone = DEFAULT_TONE): AccentClasses {
  return ACCENTS[tone];
}

export interface ModuleDescriptor {
  /** Navigation item id — keeps the accent in step with the sidebar entry. */
  id: string;
  label: string;
  icon: LucideIcon;
  tone: ModuleTone;
}

/**
 * Single source of truth for module identity. `PageHeader` looks the hero up
 * by `module` id, so pages never hard-code a colour or an icon twice.
 */
export const MODULES: Record<string, ModuleDescriptor> = {
  dashboard: { id: "dashboard", label: "Dashboard", icon: LayoutGrid, tone: "blue" },
  pos: { id: "pos", label: "Point of Sale", icon: ScanLine, tone: "green" },
  sales: { id: "sales", label: "Sales", icon: ShoppingCart, tone: "green" },
  orders: { id: "sales", label: "Orders", icon: ShoppingCart, tone: "green" },
  customers: { id: "customers", label: "Customers", icon: User, tone: "coral" },
  credit: { id: "credit", label: "Credit", icon: HandCoins, tone: "purple" },
  products: { id: "products", label: "Items & Products", icon: Package, tone: "blue" },
  categories: { id: "categories", label: "Categories", icon: Package, tone: "gold" },
  inventory: { id: "inventory", label: "Inventory", icon: Boxes, tone: "blue" },
  transfers: { id: "transfers", label: "Stock Transfers", icon: Truck, tone: "cyan" },
  suppliers: { id: "suppliers", label: "Suppliers", icon: Store, tone: "green" },
  expenses: { id: "expenses", label: "Expenses", icon: TrendingDown, tone: "coral" },
  budgets: { id: "budgets", label: "Budgets", icon: Wallet, tone: "gold" },
  payments: { id: "payments", label: "M-Pesa", icon: Smartphone, tone: "teal" },
  reports: { id: "reports", label: "Reports", icon: BarChart3, tone: "green" },
  revenue: { id: "reports", label: "Revenue", icon: BarChart3, tone: "green" },
  documents: { id: "documents", label: "Documents", icon: FileText, tone: "blue" },
  notifications: { id: "notifications", label: "Notifications", icon: Bell, tone: "gold" },
  users: { id: "users", label: "Users", icon: Users, tone: "purple" },
  shops: { id: "shops", label: "Branches", icon: Building2, tone: "orange" },
  settings: { id: "settings", label: "Settings", icon: Settings, tone: "slate" },
};

export function moduleDescriptor(id: string): ModuleDescriptor | undefined {
  return MODULES[id];
}