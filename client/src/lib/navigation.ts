import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  FileText,
  HandCoins,
  LayoutGrid,
  Package,
  Receipt,
  ScanLine,
  Settings,
  ShoppingCart,
  Smartphone,
  Store,
  TrendingDown,
  Truck,
  User,
  Users,
  Wallet,
  Bell,
} from "lucide-react";

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Matched prefixes so nested routes keep the parent highlighted. */
  matchPrefixes?: string[];
  children?: NavChild[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  {
    id: "main",
    label: "Main",
    items: [{ id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutGrid }],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { id: "pos", label: "Point of Sale", href: "/dashboard/sales/new", icon: ScanLine },
      {
        id: "sales",
        label: "Sales",
        href: "/dashboard/sales",
        icon: ShoppingCart,
        matchPrefixes: ["/dashboard/sales", "/dashboard/orders"],
        children: [
          { label: "All Sales", href: "/dashboard/sales" },
          { label: "Point of Sale", href: "/dashboard/sales/new" },
          { label: "Orders", href: "/dashboard/orders" },
        ],
      },
      {
        id: "customers",
        label: "Customers",
        href: "/dashboard/customers",
        icon: User,
        children: [{ label: "All Customers", href: "/dashboard/customers" }],
      },
      {
        id: "credit",
        label: "Credit",
        href: "/dashboard/credit",
        icon: HandCoins,
        children: [
          { label: "Overview", href: "/dashboard/credit" },
          { label: "Transactions", href: "/dashboard/credit/transactions" },
        ],
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    items: [
      {
        id: "products",
        label: "Items & Products",
        href: "/dashboard/products",
        icon: Package,
        matchPrefixes: ["/dashboard/products", "/dashboard/categories"],
        children: [
          { label: "All Products", href: "/dashboard/products" },
          { label: "Categories", href: "/dashboard/categories" },
        ],
      },
      {
        id: "inventory",
        label: "Inventory",
        href: "/dashboard/inventory",
        icon: Boxes,
        matchPrefixes: ["/dashboard/inventory", "/dashboard/stocks"],
        children: [{ label: "Stock Levels", href: "/dashboard/inventory" }],
      },
      {
        id: "transfers",
        label: "Stock Transfers",
        href: "/dashboard/transfers",
        icon: Truck,
        children: [
          { label: "Movement history", href: "/dashboard/transfers" },
          { label: "Stock levels", href: "/dashboard/inventory" },
        ],
      },
      { id: "suppliers", label: "Suppliers", href: "/dashboard/suppliers", icon: Store },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      {
        id: "expenses",
        label: "Expenses",
        href: "/dashboard/expenses",
        icon: TrendingDown,
        children: [
          { label: "All Expenses", href: "/dashboard/expenses" },
          { label: "Categories", href: "/dashboard/expenses/categories" },
        ],
      },
      {
        id: "budgets",
        label: "Budgets",
        href: "/dashboard/budgets",
        icon: Wallet,
        children: [{ label: "Restock plan", href: "/dashboard/budgets" }],
      },
      {
        id: "mpesa",
        label: "M-Pesa",
        href: "/dashboard/payments",
        icon: Smartphone,
        matchPrefixes: ["/dashboard/payments"],
        children: [
          { label: "Payments", href: "/dashboard/payments" },
          { label: "Agents", href: "/dashboard/payments/agents" },
          { label: "Transactions", href: "/dashboard/payments/transactions" },
          { label: "Reports", href: "/dashboard/payments/reports" },
        ],
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      {
        id: "reports",
        label: "Reports",
        href: "/dashboard/reports",
        icon: BarChart3,
        matchPrefixes: ["/dashboard/reports", "/dashboard/revenue", "/reports"],
        children: [
          { label: "Overview", href: "/dashboard/reports" },
          { label: "Revenue", href: "/dashboard/revenue" },
        ],
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      {
        id: "documents",
        label: "Documents",
        href: "/documents",
        icon: FileText,
        children: [
          { label: "All Documents", href: "/documents" },
          { label: "Expiring Soon", href: "/documents/expiring" },
        ],
      },      {
        id: "notifications",
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        children: [
          { label: "Inbox", href: "/notifications" },
        ],
      },
      {
        id: "users",
        label: "Users",
        href: "/users",
        icon: Users,
        matchPrefixes: ["/users"],
        children: [{ label: "All Users", href: "/users" }],
      },
      {
        id: "business",
        label: "Business",
        href: "/dashboard/shops",
        icon: Building2,
        matchPrefixes: ["/dashboard/shops"],
        children: [{ label: "Branches", href: "/dashboard/shops" }],
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        id: "settings",
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        matchPrefixes: ["/dashboard/settings", "/settings"],
        children: [{ label: "General", href: "/dashboard/settings" }],
      },
    ],
  },
];

/** Legacy / top-level routes that must highlight a nav item. */
const ALIAS_TARGETS: Array<{ prefix: string; itemId: string }> = [
  { prefix: "/products", itemId: "products" },
  { prefix: "/inventory", itemId: "inventory" },
  { prefix: "/customers", itemId: "customers" },
  { prefix: "/reports", itemId: "reports" },
  { prefix: "/settings", itemId: "settings" },
  { prefix: "/documents", itemId: "documents" },
  { prefix: "/notifications", itemId: "notifications" },
  { prefix: "/dashboard/orders", itemId: "sales" },
  { prefix: "/dashboard/dispatch", itemId: "transfers" },
];

const ALL_ITEMS: Array<{ group: NavGroup; item: NavItem }> = NAVIGATION.flatMap((group) =>
  group.items.map((item) => ({ group, item }))
);

/**
 * Specificity of a nav item for the given path. The most specific match wins,
 * so `/dashboard/sales/new` activates Point of Sale rather than Sales, and
 * `/dashboard` only activates Dashboard.
 */
function matchScore(pathname: string, item: NavItem): number {
  if (pathname === item.href) return item.href.length + 1;
  if (pathname.startsWith(`${item.href}/`)) return item.href.length;

  let best = 0;
  for (const prefix of item.matchPrefixes ?? []) {
    if (pathname === prefix) best = Math.max(best, prefix.length + 1);
    else if (pathname.startsWith(`${prefix}/`)) best = Math.max(best, prefix.length);
  }
  return best;
}

/** True when the path sits anywhere inside the item's section. */
export function isNavItemInPath(pathname: string, item: NavItem): boolean {
  return matchScore(pathname, item) > 0;
}

export function findActiveNav(pathname: string): { group: NavGroup; item: NavItem } | null {
  let best: { group: NavGroup; item: NavItem; score: number } | null = null;

  for (const entry of ALL_ITEMS) {
    const score = matchScore(pathname, entry.item);
    if (score > 0 && (!best || score > best.score)) best = { ...entry, score };
  }
  if (best) return { group: best.group, item: best.item };

  for (const alias of ALIAS_TARGETS) {
    if (pathname === alias.prefix || pathname.startsWith(`${alias.prefix}/`)) {
      const found = ALL_ITEMS.find((entry) => entry.item.id === alias.itemId);
      if (found) return found;
    }
  }
  return null;
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  return findActiveNav(pathname)?.item.id === item.id;
}

export function isNavChildActive(pathname: string, child: NavChild): boolean {
  return pathname === child.href;
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  sales: "Sales",
  new: "New",
  customers: "Customers",
  credit: "Credit",
  transactions: "Transactions",
  products: "Items & Products",
  categories: "Categories",
  inventory: "Inventory",
  stocks: "Stocks",
  low: "Low Stock",
  audit: "Stock Audit",
  transfers: "Stock Transfers",
  suppliers: "Suppliers",
  expenses: "Expenses",
  budgets: "Budgets",
  payments: "M-Pesa",
  invoices: "Invoices",
  agents: "Agents",
  reports: "Reports",
  revenue: "Revenue",
  analytics: "Analytics",
  documents: "Documents",
  expiring: "Expiring Soon",
  notifications: "Notifications",
  users: "Users",
  shops: "Business",
  types: "Branch Types",
  settings: "Settings",
  releases: "App Releases",
  orders: "Orders",
  dispatch: "Dispatch",
  marketing: "Marketing",
  automation: "Automation",
  account: "Account",
  security: "Security",
  profile: "Profile",
  edit: "Edit",
};

export interface Crumb {
  label: string;
  href?: string;
}

export function segmentLabel(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ??
    segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

/** Nav targets that sit exactly on the given path (item href, prefix, or child). */
function exactNavTarget(path: string) {
  const entry = ALL_ITEMS.find(
    (candidate) =>
      candidate.item.href === path || (candidate.item.matchPrefixes ?? []).includes(path)
  );
  const child = ALL_ITEMS.flatMap((candidate) => candidate.item.children ?? []).find(
    (candidate) => candidate.href === path
  );
  return { entry, child };
}

/**
 * Breadcrumbs for the topbar. Ancestors resolve to nav item labels (linked to
 * their canonical href); the final crumb resolves to the most specific child so
 * `/dashboard/sales/new` reads "Sales / Point of Sale" while section roots keep
 * their own name ("Sales", not "All Sales").
 */
export function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Home", href: "/dashboard" }];

  const crumbs: Crumb[] = segments.length > 1 ? [{ label: "Home", href: "/dashboard" }] : [];
  let acc = "";

  segments.forEach((segment, index) => {
    acc += `/${segment}`;
    const isLast = index === segments.length - 1;
    const { entry, child } = exactNavTarget(acc);

    const label = entry?.item.href === acc
      ? entry.item.label
      : isLast
        ? child?.label ?? entry?.item.label ?? segmentLabel(segment)
        : entry?.item.label ?? segmentLabel(segment);

    const previous = crumbs[crumbs.length - 1];
    if (previous && previous.label === label && previous.href === (isLast ? undefined : entry?.item.href ?? acc)) {
      return;
    }

    crumbs.push({ label, href: isLast ? undefined : entry?.item.href ?? acc });
  });

  return crumbs;
}

export interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: "New Sale (POS)", href: "/dashboard/sales/new", icon: ScanLine, keywords: "pos till checkout checkout sale" },
  { label: "Record Sale", href: "/dashboard/sales", icon: Receipt, keywords: "sale invoice revenue" },
  { label: "Add Customer", href: "/dashboard/customers/new", icon: User, keywords: "customer client contact" },
  { label: "Add Product", href: "/dashboard/inventory/new", icon: Package, keywords: "item product sku catalog" },
  { label: "Stock Movements", href: "/dashboard/transfers", icon: Truck, keywords: "transfer movement branch stock history" },
  { label: "Add Supplier", href: "/dashboard/suppliers", icon: Store, keywords: "supplier vendor" },
  { label: "Record Expense", href: "/dashboard/expenses/new", icon: TrendingDown, keywords: "expense spend cost" },
  { label: "Restock Budget", href: "/dashboard/budgets", icon: Wallet, keywords: "budget plan allocation purchase order" },
  { label: "Create Invoice", href: "/dashboard/payments", icon: CreditCard, keywords: "invoice payment receivable mpesa" },
  { label: "View Reports", href: "/dashboard/reports", icon: BarChart3, keywords: "report export summary analytics" },
  { label: "Invite User", href: "/users/new", icon: Users, keywords: "user team member invite staff" },
];
