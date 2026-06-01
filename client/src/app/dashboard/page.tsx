"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import {
  fetchDashboardData,
  fetchLowStock,
  fetchTopProducts,
  fetchFrequentCustomers,
  formatCurrency,
} from "@/lib/data";
import type { DashboardData, LowStockItem, TopProduct } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── THEME ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#070b14",
  bgCard: "var(--color-card)",
  bgCard2: "var(--color-card)",
  bgCard3: "var(--color-muted)",
  border: "var(--color-border)",
  border2: "var(--color-border)",
  text: "var(--color-foreground)",
  text2: "var(--color-card-foreground)",
  muted: "var(--color-muted-foreground)",
  indigo: "var(--color-primary)",
  indigo2: "var(--color-accent-foreground)",
  indigo3: "var(--color-accent-foreground)",
  blue: "var(--color-primary)",
  green: "var(--color-success)",
  emerald: "var(--color-success)",
  orange: "var(--color-warning)",
  amber: "var(--color-warning)",
  red: "var(--color-destructive)",
  purple: "var(--color-primary)",
  violet: "var(--color-accent-foreground)",
  pink: "#ec4899",
  teal: "var(--color-success)",
  cyan: "var(--color-accent-foreground)",
};

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const radius = { sm: 8, md: 12, lg: 16 };
const shadow = "0 1px 3px rgba(0,0,0,.3), 0 1px 2px rgba(0,0,0,.2)";
const glow = (c: string) => `0 0 20px ${c}22, 0 0 40px ${c}11`;
const transition = "all .2s cubic-bezier(.4,0,.2,1)";

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
const Card = ({ children, style, acolsent, hover }: any) => (
  <div className="relative overflow-hidden rounded-xl border bg-card p-[18px_20px] shadow-card"
    style={{
      ...(acolsent ? { borderTop: `2px solid ${acolsent}` } : {}),
      ...(hover ? { cursor: "pointer" } : {}),
      transition: "all .2s cubic-bezier(.4,0,.2,1)",
      ...style
    }}
    onMouseEnter={e => { if (hover) { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
    onMouseLeave={e => { if (hover) { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = ""; }}}
  >
    {acolsent && <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t" style={{ background: `linear-gradient(90deg, ${acolsent}, ${acolsent}44)` }} />}
    {children}
  </div>
);

const StatCard = ({ label, value, sub, icon, acolsent, wide, style }: any) => {
  const c = acolsent || "var(--color-primary)";
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-card"
      style={{
        flex: wide ? "1 1 100%" : "1 1 calc(50% - 8px)",
        minWidth: 140,
        transition: "all .2s cubic-bezier(.4,0,.2,1)",
        ...style
      }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${c}, ${c}33)` }} />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>{label}</div>
          <div className="text-[22px] font-extrabold leading-tight" style={{ color: c }}>{value}</div>
          {sub && <div className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: c }} />{sub}
          </div>}
        </div>
        {icon && <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border text-lg" style={{
          background: `${c}22`,
          borderColor: `${c}22`,
        }}>{icon}</div>}
      </div>
    </div>
  );
};

const Btn = ({ children, color, outline, onClick, small, style, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-[18px] py-[9px] text-[13px] font-semibold transition-all duration-200",
      small && "px-[14px] py-[6px] text-xs",
      disabled && "cursor-not-allowed opacity-40",
    )}
    style={{
      background: outline ? "transparent" : `linear-gradient(135deg, ${color || "var(--color-primary)"}, ${color || "var(--color-primary)"}dd)`,
      color: outline ? (color || "var(--color-primary)") : "#fff",
      border: `1px solid ${outline ? `${color || "var(--color-primary)"}44` : "transparent"}`,
      ...style
    }}
  >
    {children}
  </button>
);

const Badge = ({ label, color, glow: g }: any) => {
  const c = color || "var(--color-primary)";
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-[10px] py-[2px] text-[11px] font-semibold"
      style={{
        background: `linear-gradient(135deg, ${c}18, ${c}08)`,
        color: c,
        borderColor: `${c}22`,
        boxShadow: g ? `0 0 12px ${c}22` : "none",
      }}
    >{label}</span>
  );
};

const SearchBar = ({ placeholder, value, onChange }: any) => (
  <div className="relative flex-1">
    <svg className="absolute left-[11px] top-1/2 -translate-y-1/2" style={{ color: "var(--color-muted-foreground)", width: 15, height: 15, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
    <Input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-lg pl-[34px] text-[13px]"
      style={{ background: "var(--color-muted)" }}
    />
  </div>
);

const Select = ({ options, value, onChange, style }: any) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="cursor-pointer rounded-lg border px-3 py-[9px] text-[13px] outline-none transition-all"
    style={{
      background: "var(--color-muted)",
      borderColor: "var(--color-border)",
      color: "var(--color-foreground)",
      ...style
    }}
  >
    {options.map((o: any) => <option key={o.value || o} value={o.value || o} style={{ background: "var(--color-card)" }}>{o.label || o}</option>)}
  </select>
);

const Table = ({ cols, rows, headers, empty }: any) => {
  const h = cols || headers || [];
  return (
  <div className="overflow-hidden rounded-xl border bg-card shadow-card">
    <table className="w-full border-collapse">
      <thead>
        <tr style={{ background: "color-mix(in srgb, var(--color-primary) 8%, transparent)" }}>
          {h.map((c: string) => (
            <th key={c} className="px-4 py-[14px] text-left text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--color-muted-foreground)", borderBottom: "1px solid var(--color-border)" }}
            >{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(!rows || rows.length === 0) ? (
          <tr><td colSpan={h.length}>
            <div className="px-5 py-[50px] text-center">
              <div className="mb-3 text-[32px] opacity-30">📋</div>
              <div className="text-[13px]" style={{ color: "var(--color-muted-foreground)" }}>{empty || "No data found."}</div>
            </div>
          </td></tr>
        ) : rows.map((r: any[], i: number) => (
          <tr key={i} className="transition-all" style={{
            borderBottom: i < rows.length - 1 ? "1px solid var(--color-border)" : "none",
            background: i % 2 === 0 ? "transparent" : "color-mix(in srgb, var(--color-primary) 4%, transparent)",
          }}>
            {r.map((cell: any, j: number) => (
              <td key={j} className="px-4 py-[13px] text-[13px]" style={{ color: "var(--color-foreground)" }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  );
};

const PageHeader = ({ title, subtitle, children }: any) => (
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
    <div>
      <h1 className="m-0 text-[26px] font-extrabold tracking-tight" style={{ color: "var(--color-foreground)", letterSpacing: "-.3px" }}>{title}</h1>
      {subtitle && <p className="mt-1 text-[13px] font-normal" style={{ color: "var(--color-muted-foreground)" }}>{subtitle}</p>}
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const Avatar = ({ name, color, size }: any) => {
  const s = size || 32;
  const colors = ["var(--color-primary)", "var(--color-success)", "var(--color-primary)", "#ec4899", "var(--color-warning)", "var(--color-success)", "var(--color-accent-foreground)", "var(--color-primary)"];
  const bg = color || colors[(name || "U").charCodeAt(0) % colors.length];
  return (
    <div className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: s, height: s,
        background: `linear-gradient(135deg, ${bg}, ${bg})`,
        fontSize: Math.max(10, s * .38),
        boxShadow: `0 0 0 2px ${bg}22`,
      }}>
      {(name || "U")[0].toUpperCase()}
    </div>
  );
};

// ─── MODAL ────────────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, wide }: any) => (
  <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose?.()}>
    <DialogContent className={cn(wide && "max-w-[600px]")}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      {children}
    </DialogContent>
  </Dialog>
);

const InputField = ({ label, value, onChange, placeholder, type, icon, readOnly, rows }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; icon?: string; readOnly?: boolean; rows?: number }) => (
  <div className="mb-3.5">
    {label && <label className="mb-1 block text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-[11px] text-sm opacity-60" style={{ top: rows ? 12 : "50%", transform: rows ? "none" : "translateY(-50%)" }}>{icon}</span>}
      {rows ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full resize-y rounded-lg border px-3 py-[9px] text-[13px] outline-none transition-all"
          style={{
            background: "var(--color-muted)",
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
            paddingLeft: icon ? 30 : 12,
          }}
        />
      ) : (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          type={type || "text"}
          readOnly={readOnly}
          className={cn("rounded-lg text-[13px]", icon && "pl-[30px]")}
          style={{ background: "var(--color-muted)", opacity: readOnly ? .6 : 1 }}
        />
      )}
    </div>
  </div>
);

// ─── NAV CONSTANTS ────────────────────────────────────────────────────────────
const PAGE_ICONS: Record<string, string> = {
  dashboard: "📊", analytics: "📈", "activity-feed": "📋", "quick-actions": "⚡",
  sales: "🛒", orders: "📋", quotations: "📄", returns: "↩️", receipts: "🧾",
  payments: "💳", "pending-payments": "⏳", refunds: "💸", chargebacks: "🔄",
  "payment-methods": "💳", "payment-analytics": "📊",
  inventory: "📦", "stock-levels": "📊", categories: "🏷️", barcodes: "📱",
  "stock-adjustments": "⚖️", transfers: "🔄",
  customers: "👥", loyalty: "⭐", "credit-accounts": "💰",
  reviews: "⭐", messages: "💬",
  suppliers: "🏭", "purchase-orders": "📋", "supplier-deliveries": "🚚", "supplier-payments": "💳",
  dispatch: "🚚", "logistics-deliveries": "📦", tracking: "📍", "shipping-partners": "🤝",
  expenses: "📉", revenue: "📈", "profit-loss": "📊", "cash-flow": "💵", "tax-reports": "🧾",
  reports: "📈", "inventory-reports": "📦", "customer-reports": "👥",
  "financial-reports": "💰", "export-center": "📤",
  shops: "🏪", "branch-performance": "📊", "shop-transfers": "🔄", "staff-assignment": "👤",
  users: "👤", roles: "🔐", "activity-logs": "📋", "security-settings": "🛡️",
  settings: "⚙️", "payment-settings": "💳", integrations: "🔗",
  notifications: "🔔", "backup-restore": "💾",
};
const PAGE_COLORS: Record<string, string> = {
  dashboard: C.indigo, analytics: C.purple, "activity-feed": C.teal, "quick-actions": C.orange,
  sales: C.green, orders: C.blue, quotations: C.amber, returns: C.orange, receipts: C.cyan,
  payments: C.cyan, "pending-payments": C.orange, refunds: C.red, chargebacks: C.pink,
  "payment-methods": C.indigo, "payment-analytics": C.purple,
  inventory: C.indigo, "stock-levels": C.teal, categories: C.orange, barcodes: C.cyan,
  "stock-adjustments": C.amber, transfers: C.green,
  customers: C.pink, loyalty: C.amber, "credit-accounts": C.purple,
  reviews: C.amber, messages: C.cyan,
  suppliers: C.green, "purchase-orders": C.blue, "supplier-deliveries": C.teal, "supplier-payments": C.cyan,
  dispatch: C.teal, "logistics-deliveries": C.green, tracking: C.orange, "shipping-partners": C.purple,
  expenses: C.red, revenue: C.green, "profit-loss": C.indigo, "cash-flow": C.teal, "tax-reports": C.orange,
  reports: C.green, "inventory-reports": C.purple, "customer-reports": C.pink,
  "financial-reports": C.indigo, "export-center": C.cyan,
  shops: C.orange, "branch-performance": C.green, "shop-transfers": C.blue, "staff-assignment": C.purple,
  users: C.purple, roles: C.indigo, "activity-logs": C.teal, "security-settings": C.red,
  settings: "#6b7a99", "payment-settings": C.cyan, integrations: C.purple,
  notifications: C.amber, "backup-restore": C.green,
};

// ─── SIDEBAR GROUPS ───────────────────────────────────────────────────────────
const SIDEBAR_GROUPS = [
  { label: "DASHBOARD", items: [
    { id: "dashboard", label: "Overview", icon: "📊" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "activity-feed", label: "Activity Feed", icon: "📋" },
    { id: "quick-actions", label: "Quick Actions", icon: "⚡" },
  ]},
  { label: "SALES", items: [
    { id: "sales", label: "New Sale (POS)", icon: "🛒" },
    { id: "orders", label: "Orders", icon: "📋" },
    { id: "quotations", label: "Quotations", icon: "📄" },
    { id: "returns", label: "Returns", icon: "↩️" },
    { id: "receipts", label: "Receipts", icon: "🧾" },
  ]},
  { label: "PAYMENTS", items: [
    { id: "payments", label: "Transactions", icon: "💳" },
    { id: "pending-payments", label: "Pending Payments", icon: "⏳" },
    { id: "refunds", label: "Refunds", icon: "💸" },
    { id: "chargebacks", label: "Chargebacks", icon: "🔄" },
    { id: "payment-methods", label: "Payment Methods", icon: "💳" },
    { id: "payment-analytics", label: "Payment Analytics", icon: "📊" },
  ]},
  { label: "INVENTORY", items: [
    { id: "inventory", label: "Products", icon: "📦" },
    { id: "stock-levels", label: "Stock Levels", icon: "📊" },
    { id: "categories", label: "Categories", icon: "🏷️" },
    { id: "barcodes", label: "Barcodes", icon: "📱" },
    { id: "stock-adjustments", label: "Stock Adjustments", icon: "⚖️" },
    { id: "transfers", label: "Transfers", icon: "🔄" },
  ]},
  { label: "CUSTOMERS", items: [
    { id: "customers", label: "Customers", icon: "👥" },
    { id: "loyalty", label: "Loyalty Program", icon: "⭐" },
    { id: "credit-accounts", label: "Credit Accounts", icon: "💰" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
    { id: "messages", label: "Messages", icon: "💬" },
  ]},
  { label: "SUPPLIERS", items: [
    { id: "suppliers", label: "Suppliers", icon: "🏭" },
    { id: "purchase-orders", label: "Purchase Orders", icon: "📋" },
    { id: "supplier-deliveries", label: "Deliveries", icon: "🚚" },
    { id: "supplier-payments", label: "Supplier Payments", icon: "💳" },
  ]},
  { label: "LOGISTICS", items: [
    { id: "dispatch", label: "Dispatch", icon: "🚚" },
    { id: "logistics-deliveries", label: "Deliveries", icon: "📦" },
    { id: "tracking", label: "Tracking", icon: "📍" },
    { id: "shipping-partners", label: "Shipping Partners", icon: "🤝" },
  ]},
  { label: "FINANCE", items: [
    { id: "expenses", label: "Expenses", icon: "📉" },
    { id: "revenue", label: "Revenue", icon: "📈" },
    { id: "profit-loss", label: "Profit & Loss", icon: "📊" },
    { id: "cash-flow", label: "Cash Flow", icon: "💵" },
    { id: "tax-reports", label: "Tax Reports", icon: "🧾" },
  ]},
  { label: "REPORTS", items: [
    { id: "reports", label: "Sales Reports", icon: "📈" },
    { id: "inventory-reports", label: "Inventory Reports", icon: "📦" },
    { id: "customer-reports", label: "Customer Reports", icon: "👥" },
    { id: "financial-reports", label: "Financial Reports", icon: "💰" },
    { id: "export-center", label: "Export Center", icon: "📤" },
  ]},
  { label: "MULTI-SHOP", items: [
    { id: "shops", label: "Shops", icon: "🏪" },
    { id: "branch-performance", label: "Branch Performance", icon: "📊" },
    { id: "shop-transfers", label: "Transfers", icon: "🔄" },
    { id: "staff-assignment", label: "Staff Assignment", icon: "👤" },
  ]},
  { label: "USERS & SECURITY", items: [
    { id: "users", label: "Users", icon: "👤" },
    { id: "roles", label: "Roles & Permissions", icon: "🔐" },
    { id: "activity-logs", label: "Activity Logs", icon: "📋" },
    { id: "security-settings", label: "Security Settings", icon: "🛡️" },
  ]},
  { label: "SYSTEM", items: [
    { id: "settings", label: "Business Settings", icon: "⚙️" },
    { id: "payment-settings", label: "Payment Settings", icon: "💳" },
    { id: "integrations", label: "Integrations", icon: "🔗" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "backup-restore", label: "Backup & Restore", icon: "💾" },
  ]},
];

// ─── HEADER ───────────────────────────────────────────────────────────────────
const Header = ({ userName, onLogout, page }: any) => (
  <div className="sticky top-0 z-40 flex h-[52px] items-center gap-3 border-b px-6 py-2 backdrop-blur-[12px]"
    style={{
      background: "color-mix(in srgb, var(--color-card) 93%, transparent)",
      borderColor: "var(--color-border)",
    }}>
    <div className="flex flex-1 items-center gap-2">
      <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{PAGE_ICONS[page]}</span>
      <span className="text-[15px] font-semibold" style={{ color: "var(--color-foreground)" }}>
        {page === "dashboard" ? "Overview" : (SIDEBAR_GROUPS.flatMap(g => g.items).find(i => i.id === page)?.label || page)}
      </span>
    </div>
    <div className="flex items-center gap-2.5">
      <button className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-[10px] py-1 text-xs"
        style={{
          background: "color-mix(in srgb, var(--color-primary) 11%, transparent)",
          borderColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)",
          color: "var(--color-primary)",
        }}>
        <Avatar name={userName || "U"} size={22} />
        <span>{(userName || "User").toLowerCase()} · Owner</span>
      </button>
      <button onClick={onLogout}
        className="cursor-pointer rounded-lg border bg-transparent px-3 py-1 text-xs font-medium transition-all hover:opacity-80"
        style={{ borderColor: "color-mix(in srgb, var(--color-destructive) 33%, transparent)", color: "var(--color-destructive)" }}
      >↪ Logout</button>
    </div>
  </div>
);

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
const DashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [freqCust, setFreqCust] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [stats, low, top, cust] = await Promise.all([
          fetchDashboardData(),
          fetchLowStock(),
          fetchTopProducts(),
          fetchFrequentCustomers(),
        ]);
        setData(stats);
        setLowStock(low);
        setTopProducts(top);
        setFreqCust(cust);
      } catch { /* keep defaults */ } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <div className="animate-pulse" style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
      <div style={{ color: C.muted, fontSize: 14 }}>Loading dashboard...</div>
    </div>
  );

  const s = data?.stats;
  const totalRevenue = s?.totalRevenue || 0;
  const totalExpenses = s?.totalExpenses || 0;
  const profit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : "0.0";

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, #1e1b4b, #312e81 50%, #3730a3)`,
        borderRadius: radius.lg,
        padding: "24px 28px",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: .1, background: "radial-gradient(circle at 30% 50%, rgba(255,255,255,.3), transparent 60%), radial-gradient(circle at 70% 30%, rgba(255,255,255,.2), transparent 40%)" }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22, color: "#fff", marginBottom: 2 }}>Dashboard Overview 👋</div>
            <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13 }}>Main Shop (MAIN) · Role: Owner · Jun 2026</div>
          </div>
          <Btn small color="rgba(255,255,255,.15)">↺ Refresh</Btn>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} sub={`${margin}% margin`} icon="📈" acolsent={C.indigo} />
        <StatCard label="Net Profit" value={formatCurrency(profit)} sub="After expenses" icon="💵" acolsent={C.green} />
        <StatCard label="Expenses" value={formatCurrency(totalExpenses)} sub="Period total" icon="📉" acolsent={C.red} />
        <StatCard label="Low Stock" value={String(lowStock.length)} sub="Need restock" icon="📦" acolsent={C.orange} />
        <StatCard label="Customers" value={String(s?.totalCustomers || 0)} sub="Registered" icon="👥" acolsent={C.cyan} />
        <StatCard label="Products" value={String(topProducts.length)} sub="In inventory" icon="🛒" acolsent={C.purple} />
        <StatCard label="Pending" value={formatCurrency(s?.pendingPayments || 0)} sub="Awaiting payment" icon="⏰" acolsent={C.pink} />
        <StatCard label="Sales" value={String(s?.activeInvoices || 0)} sub="Active invoices" icon="🛍️" acolsent={C.teal} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <Card style={{ flex: "1 1 calc(50% - 6px)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${C.indigo}, ${C.purple})`, display: "inline-block" }} />
            Sales Breakdown
          </div>
          {[
            ["Total Sales", String(s?.activeInvoices || 0)],
            ["Revenue", formatCurrency(totalRevenue), C.green],
            ["Pending Payments", formatCurrency(s?.pendingPayments || 0), C.orange],
            ["Expenses", formatCurrency(totalExpenses), C.red],
          ].map(([k, v, c]: any, i: number) => (
            <div key={k} style={{
              display: "flex", justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: i < 3 ? `1px solid ${C.border}` : "none",
              fontSize: 13,
            }}>
              <span style={{ color: C.muted }}>{k}</span>
              <span style={{ fontWeight: 700, color: c || C.text }}>{v}</span>
            </div>
          ))}
        </Card>
        <Card style={{ flex: "1 1 calc(50% - 6px)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${C.green}, ${C.emerald})`, display: "inline-block" }} />
            Top Products
          </div>
          {topProducts.slice(0, 5).map((p, i) => (
            <div key={p.id} style={{
              display: "flex", justifyContent: "space-between",
              padding: "7px 0",
              borderBottom: i < Math.min(topProducts.length, 5) - 1 ? `1px solid ${C.border}` : "none",
              fontSize: 13,
            }}>
              <span style={{ color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.green, display: "inline-block" }} />
                {p.name}
              </span>
              <span style={{ fontWeight: 700, color: C.text }}>{p.total_sold} sold</span>
            </div>
          ))}
          {topProducts.length === 0 && <div style={{ color: C.muted, fontSize: 13, padding: "10px 0", textAlign: "center" }}>No product data yet</div>}
        </Card>
      </div>
      {freqCust.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${C.pink}, ${C.purple})`, display: "inline-block" }} />
            Frequent Customers
          </div>
          {freqCust.slice(0, 5).map((c: any) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
                <Avatar name={c.name} /> {c.name}
              </span>
              <span style={{ fontWeight: 700, color: C.text }}>{c.total_orders} orders · {formatCurrency(c.total_spent)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// ─── SALES PAGE ───────────────────────────────────────────────────────────────
const SalesPage = () => {
  const [search, setSearch] = useState("");
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState({ customer_name: "", total: "", status: "completed", sale_date: new Date().toISOString().split("T")[0] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.sales.getAll(statusFilter !== "ALL" ? statusFilter : undefined) as any[];
      setSales(Array.isArray(data) ? data : []);
    } catch { setSales([]); } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      const payload = { ...form, total: parseFloat(form.total) || 0 };
      if (editItem) {
        await api.sales.update(editItem.id, payload);
      } else {
        await api.sales.create({ ...payload, items: [{ product_name: "Sale", qty: 1, unit_price: parseFloat(form.total) || 0 }] });
      }
      setModal(false); setEditItem(null);
      setForm({ customer_name: "", total: "", status: "completed", sale_date: new Date().toISOString().split("T")[0] });
      load();
    } catch { alert("Failed to save sale"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sale?")) return;
    try { await api.sales.delete(id); load(); } catch { alert("Delete failed"); }
  };

  const filtered = sales.filter((s: any) =>
    (s.customer_name || s.customer || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalRevenue = filtered.reduce((sum: number, s: any) => sum + (parseFloat(s.total) || 0), 0);

  return (
    <div>
      <PageHeader title="Sales" subtitle="Point of Sale & Sales Management">
        <Btn color={C.indigo} onClick={() => { setEditItem(null); setForm({ customer_name: "", total: "", status: "completed", sale_date: new Date().toISOString().split("T")[0] }); setModal(true); }}>+ New Sale</Btn>
        <Btn outline color={C.muted} onClick={load}>↺ Refresh</Btn>
      </PageHeader>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Sales" value={String(filtered.length)} icon="🛒" />
        <StatCard label="Revenue" value={formatCurrency(totalRevenue)} icon="💳" />
        <StatCard label="Avg Sale" value={filtered.length ? formatCurrency(Math.round(totalRevenue / filtered.length)) : "Ksh 0"} icon="📊" acolsent={C.green} />
        <StatCard label="Today" value={String(filtered.filter((s: any) => {
          const d = s.sale_date || s.createdAt;
          return d && new Date(d).toDateString() === new Date().toDateString();
        }).length)} icon="📅" acolsent={C.orange} />
      </div>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <SearchBar placeholder="Search by customer name..." value={search} onChange={setSearch} />
          <Select options={[{ label: "All Statuses", value: "ALL" }, "completed", "pending", "cancelled"]} value={statusFilter} onChange={setStatusFilter} />
        </div>
      </Card>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Loading...</div>
      ) : (
        <Table cols={["#", "Customer", "Date", "Total", "Status", "Actions"]}
          rows={filtered.map((s: any, i: number) => [
            <span key="id" style={{ color: C.indigo2, fontWeight: 700, fontFamily: "monospace" }}>#{s.id?.slice?.(0, 7) || (i + 1).toString().padStart(3, "0")}</span>,
            <span key="n" style={{ fontWeight: 500 }}>{s.customer_name || s.customer || "Walk-in"}</span>,
            <span key="d" style={{ color: C.muted }}>{s.sale_date ? new Date(s.sale_date).toLocaleDateString("en-GB") : "-"}</span>,
            <span key="t" style={{ fontWeight: 700, color: C.green }}>{formatCurrency(parseFloat(s.total) || 0)}</span>,
            <Badge key="st" label={(s.status || "completed").toUpperCase()} color={s.status === "cancelled" ? C.red : s.status === "pending" ? C.orange : C.green} />,
            <div key="ac" style={{ display: "flex", gap: 6 }}>
              <Btn small outline color={C.cyan} onClick={() => { setEditItem(s); setForm({ customer_name: s.customer_name || "", total: String(s.total || ""), status: s.status || "completed", sale_date: s.sale_date?.split("T")[0] || "" }); setModal(true); }}>✏️</Btn>
              <Btn small outline color={C.red} onClick={() => handleDelete(s.id)}>🗑</Btn>
            </div>,
          ])}
          empty="No sales found. Create your first sale above." />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Sale" : "New Sale"}>
        <InputField label="Customer Name" value={form.customer_name} onChange={v => setForm({ ...form, customer_name: v })} placeholder="Walk-in Customer" icon="👤" />
        <InputField label="Total Amount (KES)" value={form.total} onChange={v => setForm({ ...form, total: v })} placeholder="0" icon="💰" type="number" />
        <InputField label="Date" value={form.sale_date} onChange={v => setForm({ ...form, sale_date: v })} type="date" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 5, fontWeight: 500 }}>Status</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
            style={{ width: "100%", background: C.bgCard3, border: `1px solid ${C.border}`, borderRadius: radius.sm, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none" }}>
            <option value="completed">Completed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
        <Btn color={C.indigo} onClick={handleSubmit} style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "10px 0" }}>
          {editItem ? "Update Sale" : "Create Sale"}
        </Btn>
      </Modal>
    </div>
  );
};

// ─── PAYMENTS PAGE ────────────────────────────────────────────────────────────
const PaymentsPage = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.invoices.getAll() as any[];
      setPayments(Array.isArray(data) ? data : []);
    } catch { setPayments([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load]);

  const filtered = payments.filter((p: any) =>
    (p.customer || p.customer_name || "").toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === "ALL" || p.status === statusFilter)
  );
  const pending = filtered.filter((p: any) => p.status === "pending" || p.status === "draft");
  const completed = filtered.filter((p: any) => p.status === "paid" || p.status === "completed");
  const totalVal = filtered.reduce((s: number, p: any) => s + (parseFloat(p.total) || 0), 0);

  return (
    <div>
      <PageHeader title="Payments" subtitle="Track and confirm incoming payments">
        <Btn outline color={C.muted} onClick={load}>↺ Refresh</Btn>
      </PageHeader>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 12 }}>
        <span className="animate-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, display: "inline-block" }} />
        <span style={{ color: C.green }}>Auto-refreshing every 30s</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <Card style={{ flex: "1 1 calc(50% - 6px)", acolsent: C.orange }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.orange}18`, border: `1px solid ${C.orange}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⏰</div>
            <div><div style={{ fontSize: 11, color: C.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".5px" }}>Pending</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.orange }}>{pending.length}</div>
              <div style={{ fontSize: 11, color: C.muted }}>Awaiting confirmation</div></div>
          </div>
        </Card>
        <StatCard label="Completed" value={String(completed.length)} sub="Confirmed payments" icon="✅" acolsent={C.green} />
        <StatCard label="Total Value" value={formatCurrency(totalVal)} sub="All invoices" icon="📈" acolsent={C.indigo} />
      </div>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <SearchBar placeholder="Search by customer..." value={search} onChange={setSearch} />
          <Select options={[{ label: "All Statuses", value: "ALL" }, "pending", "paid", "completed", "cancelled"]} value={statusFilter} onChange={setStatusFilter} />
        </div>
      </Card>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Loading...</div>
      ) : (
        <Table cols={["Invoice #", "Customer", "Amount", "Status", "Date"]}
          rows={filtered.map((p: any) => [
            <span key="id" style={{ color: C.cyan, fontWeight: 700, fontFamily: "monospace" }}>#{p.id?.slice?.(0, 7) || "-"}</span>,
            p.customer || p.customer_name || "N/A",
            <span key="t" style={{ fontWeight: 700, color: C.green }}>{formatCurrency(parseFloat(p.total) || 0)}</span>,
            <Badge key="st" label={(p.status || "draft").toUpperCase()} color={p.status === "paid" || p.status === "completed" ? C.green : p.status === "cancelled" ? C.red : C.orange} glow />,
            <span key="d" style={{ color: C.muted }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB") : "-"}</span>,
          ])}
          empty="No transactions found." />
      )}
    </div>
  );
};

// ─── DISPATCH PAGE ────────────────────────────────────────────────────────────
const DispatchPage = () => {
  const [tab, setTab] = useState("This Month");
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ recipient: "", destination: "", status: "pending", notes: "", items: "" });
  const tabs = ["Today", "This Week", "This Month", "Last 30 Days"];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const orders = await api.sales.getAll() as any[];
      setDispatches(Array.isArray(orders) ? orders : []);
    } catch { setDispatches([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    try {
      await api.sales.create({ customer_id: form.recipient, customer_name: form.recipient, status: "shipped", notes: form.notes, items: [{ product_name: form.items || "Dispatch", qty: 1, unit_price: 0 }] } as any);
      setModal(false);
      setForm({ recipient: "", destination: "", status: "pending", notes: "", items: "" });
      load();
    } catch { alert("Failed to create dispatch"); }
  };

  const filtered = dispatches.filter((d: any) =>
    (d.customer_name || d.customer || "").toLowerCase().includes(search.toLowerCase())
  );
  const stats = [
    { label: "TOTAL", val: String(filtered.length), c: C.text, bg: `${C.indigo}22`, border: `${C.indigo}33` },
    { label: "PENDING", val: String(filtered.filter(d => d.status === "pending").length), c: C.orange, bg: `${C.orange}22`, border: `${C.orange}33` },
    { label: "SHIPPED", val: String(filtered.filter(d => d.status === "shipped").length), c: C.cyan, bg: `${C.cyan}22`, border: `${C.cyan}33` },
    { label: "DELIVERED", val: String(filtered.filter(d => d.status === "completed" || d.status === "paid").length), c: C.green, bg: `${C.green}22`, border: `${C.green}33` },
    { label: "CANCELLED", val: String(filtered.filter(d => d.status === "cancelled").length), c: C.red, bg: `${C.red}22`, border: `${C.red}33` },
  ];

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, #0f766e, #0d9488 50%, #14b8a6)`,
        borderRadius: radius.lg,
        padding: "20px 24px",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: .1, background: "radial-gradient(circle at 70% 40%, rgba(255,255,255,.3), transparent 50%)" }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 32 }}>🚚</span>
            <div><div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>Dispatch</div>
              <div style={{ color: "rgba(255,255,255,.7)", fontSize: 13 }}>Manage deliveries and track orders</div></div>
          </div>
          <Btn color="rgba(255,255,255,.2)" onClick={() => setModal(true)}>+ New Dispatch</Btn>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {stats.map(s => (
          <div key={s.label} style={{
            flex: "1 1 80px",
            background: `linear-gradient(135deg, ${s.bg}, transparent)`,
            border: `1px solid ${s.border}`,
            borderRadius: radius.md,
            padding: "14px 10px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: t === tab ? C.indigo : C.bgCard3,
            border: `1px solid ${t === tab ? C.indigo : C.border}`,
            borderRadius: 20,
            padding: "5px 14px",
            fontSize: 12,
            color: t === tab ? "#fff" : C.text,
            cursor: "pointer",
            transition,
          }}>{t}</button>
        ))}
      </div>
      <Card style={{ marginBottom: 12 }}>
        <SearchBar placeholder="Search by customer, tracking..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Loading...</div>
      ) : (
        <Table cols={["Customer", "Status", "Date", "Actions"]}
          rows={filtered.map((d: any) => [
            d.customer_name || d.customer || "N/A",
            <Badge key="st" label={(d.status || "pending").toUpperCase()} color={d.status === "cancelled" ? C.red : d.status === "shipped" ? C.cyan : d.status === "completed" || d.status === "paid" ? C.green : C.orange} />,
            <span key="d" style={{ color: C.muted }}>{d.sale_date || d.createdAt ? new Date(d.sale_date || d.createdAt).toLocaleDateString("en-GB") : "-"}</span>,
            <div key="ac" style={{ display: "flex", gap: 6 }}>
              <Btn small outline color={C.cyan}>👁 View</Btn>
              <Btn small outline color={C.green}>✏️</Btn>
            </div>,
          ])}
          empty='No dispatch orders yet. Click "+ New Dispatch" to create one.' />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="New Dispatch Order">
        <InputField label="Recipient Name" value={form.recipient} onChange={v => setForm({ ...form, recipient: v })} placeholder="Customer name" icon="👤" />
        <InputField label="Destination" value={form.destination} onChange={v => setForm({ ...form, destination: v })} placeholder="Delivery address" icon="📍" />
        <InputField label="Items" value={form.items} onChange={v => setForm({ ...form, items: v })} placeholder="Item descriptions" icon="📦" />
        <InputField label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} placeholder="Additional notes" rows={3} />
        <Btn color={C.teal} onClick={handleCreate} style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "10px 0" }}>Create Dispatch</Btn>
      </Modal>
    </div>
  );
};

// ─── EXPENSES PAGE ────────────────────────────────────────────────────────────
const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [catModal, setCatModal] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [form, setForm] = useState({ description: "", amount: "", category: "General", expense_date: new Date().toISOString().split("T")[0] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cats] = await Promise.all([
        api.expenses.getAll().catch(() => []),
        api.expenses.getCategories().catch(() => []),
      ]);
      setExpenses(Array.isArray(data) ? data : []);
      setCategories(Array.isArray(cats) ? cats.map((c: any) => c.name || c) : []);
    } catch { setExpenses([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      const payload = { description: form.description, amount: parseFloat(form.amount) || 0, category: form.category, expense_date: form.expense_date };
      if (editItem) { await api.expenses.update(editItem.id, payload); }
      else { await api.expenses.create(payload); }
      setModal(false); setEditItem(null);
      setForm({ description: "", amount: "", category: "General", expense_date: new Date().toISOString().split("T")[0] });
      load();
    } catch { alert("Failed to save expense"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try { await api.expenses.delete(id); load(); } catch { alert("Delete failed"); }
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    try { await api.expenses.createCategory({ name: newCat }); setCatModal(false); setNewCat(""); load(); }
    catch { alert("Failed to create category"); }
  };

  const filtered = expenses.filter((e: any) =>
    (e.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.category || "").toLowerCase().includes(search.toLowerCase())
  );
  const total = filtered.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0);

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Track and manage business expenses">
        <Btn color={C.orange} onClick={() => setCatModal(true)} small>+ Category</Btn>
        <Btn color={C.purple} onClick={() => { setEditItem(null); setForm({ description: "", amount: "", category: "General", expense_date: new Date().toISOString().split("T")[0] }); setModal(true); }}>+ Add Expense</Btn>
      </PageHeader>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Expenses" value={String(filtered.length)} icon="📉" acolsent={C.red} />
        <StatCard label="Total Amount" value={formatCurrency(total)} icon="💵" acolsent={C.orange} />
        <StatCard label="Avg Expense" value={filtered.length ? formatCurrency(Math.round(total / filtered.length)) : "Ksh 0"} icon="📊" acolsent={C.purple} />
        <StatCard label="Categories" value={String(categories.length || 1)} icon="🏷️" acolsent={C.teal} />
      </div>
      <Card style={{ marginBottom: 12 }}>
        <SearchBar placeholder="Search description or category..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Loading...</div>
      ) : (
        <Table cols={["Description", "Category", "Amount", "Date", "Actions"]}
          rows={filtered.map((e: any) => [
            <span key="d" style={{ fontWeight: 500 }}>{e.description || "N/A"}</span>,
            <Badge key="c" label={e.category || "General"} color={C.purple} />,
            <span key="a" style={{ fontWeight: 700, color: C.red }}>{formatCurrency(parseFloat(e.amount) || 0)}</span>,
            <span key="dt" style={{ color: C.muted }}>{e.expense_date ? new Date(e.expense_date).toLocaleDateString("en-GB") : "-"}</span>,
            <div key="ac" style={{ display: "flex", gap: 6 }}>
              <Btn small outline color={C.cyan} onClick={() => { setEditItem(e); setForm({ description: e.description || "", amount: String(e.amount || ""), category: e.category || "General", expense_date: e.expense_date?.split("T")[0] || "" }); setModal(true); }}>✏️</Btn>
              <Btn small outline color={C.red} onClick={() => handleDelete(e.id)}>🗑</Btn>
            </div>,
          ])}
          empty="No expenses recorded yet." />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Expense" : "Add Expense"}>
        <InputField label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="What was this for?" icon="📝" />
        <InputField label="Amount (KES)" value={form.amount} onChange={v => setForm({ ...form, amount: v })} placeholder="0" icon="💰" type="number" />
        <InputField label="Category" value={form.category} onChange={v => setForm({ ...form, category: v })} placeholder="General" />
        <InputField label="Date" value={form.expense_date} onChange={v => setForm({ ...form, expense_date: v })} type="date" />
        <Btn color={C.purple} onClick={handleSubmit} style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "10px 0" }}>{editItem ? "Update Expense" : "Create Expense"}</Btn>
      </Modal>
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Add Expense Category">
        <InputField label="Category Name" value={newCat} onChange={setNewCat} placeholder="e.g. Utilities, Rent" icon="🏷️" />
        <Btn color={C.orange} onClick={handleAddCategory} style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "10px 0" }}>Add Category</Btn>
      </Modal>
    </div>
  );
};

// ─── SHOPS PAGE ───────────────────────────────────────────────────────────────
const ShopsPage = () => (
  <div>
    <PageHeader title="Shop Management" subtitle="Manage all your business locations">
      <Btn color={C.purple}>+ Add New Shop</Btn>
    </PageHeader>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      <StatCard label="Total Shops" value="1" sub="All registered" icon="🏪" />
      <StatCard label="Active Shops" value="1" sub="Operating" icon="📈" acolsent={C.green} />
      <StatCard label="Products" value="8" sub="Across all shops" icon="📦" acolsent={C.purple} />
      <StatCard label="Staff" value="1" sub="All members" icon="👥" acolsent={C.red} />
      <StatCard label="Sales" value="0" sub="All locations" icon="📈" acolsent={C.orange} />
      <StatCard label="Inactive" value="0" sub="Shops paused" icon="🏪" acolsent={C.cyan} />
    </div>
    <Card style={{ marginBottom: 12 }}>
      <SearchBar placeholder="Search by name, code, or location..." value="" onChange={() => { }} />
    </Card>
    <Card acolsent={C.green}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.indigo}18`, border: `1px solid ${C.indigo}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏪</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>Main Shop</div>
            <div style={{ fontSize: 11, color: C.muted }}>MAIN</div>
          </div>
        </div>
        <Badge label="ACTIVE" color={C.green} glow />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}><span>📍</span> Kiambu</div>
        <div style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}><span>👤</span> Manager: Elijah</div>
        <div style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}><span>📞</span> +254717732274</div>
      </div>
      <div style={{ display: "flex", gap: 24, marginBottom: 14 }}>
        {[["8", "Products"], ["0", "Sales"], ["1", "Staff"]].map(([v, l]) => (
          <div key={l} style={{ textAlign: "center", background: C.bgCard3, borderRadius: 8, padding: "6px 14px", flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: C.text }}>{v}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn small outline color={C.cyan}>👁 View</Btn>
        <Btn small outline color={C.green}>✏️ Edit</Btn>
      </div>
    </Card>
  </div>
);

// ─── INVENTORY PAGE ───────────────────────────────────────────────────────────
const InventoryPage = () => {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", sku: "", selling_price: "", cost_price: "", stock_qty: "", reorder_level: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.products.getAll() as any[];
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      const payload = { name: form.name, sku: form.sku, selling_price: parseFloat(form.selling_price) || 0, cost_price: parseFloat(form.cost_price) || 0, stock_qty: parseInt(form.stock_qty) || 0, reorder_level: parseInt(form.reorder_level) || 0 };
      if (editItem) { await api.products.update(editItem.id, payload); }
      else { await api.products.create(payload); }
      setModal(false); setEditItem(null);
      setForm({ name: "", sku: "", selling_price: "", cost_price: "", stock_qty: "", reorder_level: "" });
      load();
    } catch { alert("Failed to save product"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await api.products.delete(id); load(); } catch { alert("Delete failed"); }
  };

  const filtered = products.filter((p: any) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );
  const lowStock = filtered.filter((p: any) => p.stock_qty <= (p.reorder_level || 0) && p.stock_qty > 0);
  const outOfStock = filtered.filter((p: any) => p.stock_qty === 0);
  const stockValue = filtered.reduce((s: number, p: any) => s + ((p.selling_price || p.cost_price || 0) * (p.stock_qty || 0)), 0);

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Manage products, stock levels">
        <Btn color={C.indigo} onClick={() => { setEditItem(null); setForm({ name: "", sku: "", selling_price: "", cost_price: "", stock_qty: "", reorder_level: "" }); setModal(true); }}>+ Add Product</Btn>
        <Btn outline color={C.muted} onClick={load}>↺ Refresh</Btn>
      </PageHeader>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Products" value={String(filtered.length)} icon="📦" acolsent={C.indigo} />
        <StatCard label="Stock Value" value={formatCurrency(stockValue)} icon="💰" acolsent={C.green} />
        <StatCard label="Low Stock" value={String(lowStock.length)} icon="⚠️" acolsent={C.orange} />
        <StatCard label="Out of Stock" value={String(outOfStock.length)} icon="❌" acolsent={C.red} />
      </div>
      <Card style={{ marginBottom: 12 }}>
        <SearchBar placeholder="Search products by name or SKU..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Loading...</div>
      ) : (
        <Table cols={["Product", "SKU", "Price", "Stock", "Status", "Actions"]}
          rows={filtered.map((p: any) => [
            <span key="n" style={{ fontWeight: 600 }}>{p.name}</span>,
            <span key="sk" style={{ color: C.muted, fontSize: 12, fontFamily: "monospace" }}>{p.sku || "-"}</span>,
            <span key="pr" style={{ fontWeight: 700, color: C.green }}>{formatCurrency(p.selling_price || p.total_revenue || 0)}</span>,
            <span key="sq" style={{
              background: p.stock_qty === 0 ? `${C.red}18` : p.stock_qty <= (p.reorder_level || 0) ? `${C.orange}18` : `${C.green}18`,
              color: p.stock_qty === 0 ? C.red : p.stock_qty <= (p.reorder_level || 0) ? C.orange : C.green,
              border: `1px solid ${p.stock_qty === 0 ? C.red + "22" : p.stock_qty <= (p.reorder_level || 0) ? C.orange + "22" : C.green + "22"}`,
              borderRadius: 6, padding: "3px 10px", fontWeight: 700, fontSize: 13,
            }}>{p.stock_qty || 0}</span>,
            <Badge key="st" label={p.stock_qty === 0 ? "OUT" : p.stock_qty <= (p.reorder_level || 0) ? "LOW" : "OK"} color={p.stock_qty === 0 ? C.red : p.stock_qty <= (p.reorder_level || 0) ? C.orange : C.green} />,
            <div key="ac" style={{ display: "flex", gap: 6 }}>
              <Btn small outline color={C.cyan} onClick={() => { setEditItem(p); setForm({ name: p.name || "", sku: p.sku || "", selling_price: String(p.selling_price || ""), cost_price: String(p.cost_price || ""), stock_qty: String(p.stock_qty || ""), reorder_level: String(p.reorder_level || "") }); setModal(true); }}>✏️</Btn>
              <Btn small outline color={C.red} onClick={() => handleDelete(p.id)}>🗑</Btn>
            </div>,
          ])}
          empty="No products found. Add your first product above." />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Product" : "Add Product"}>
        <InputField label="Product Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Product name" icon="📦" />
        <InputField label="SKU" value={form.sku} onChange={v => setForm({ ...form, sku: v })} placeholder="SKU code" />
        <InputField label="Selling Price (KES)" value={form.selling_price} onChange={v => setForm({ ...form, selling_price: v })} placeholder="0" icon="💰" type="number" />
        <InputField label="Cost Price (KES)" value={form.cost_price} onChange={v => setForm({ ...form, cost_price: v })} placeholder="0" icon="💵" type="number" />
        <InputField label="Stock Quantity" value={form.stock_qty} onChange={v => setForm({ ...form, stock_qty: v })} placeholder="0" type="number" />
        <InputField label="Reorder Level" value={form.reorder_level} onChange={v => setForm({ ...form, reorder_level: v })} placeholder="0" type="number" />
        <Btn color={C.indigo} onClick={handleSubmit} style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "10px 0" }}>{editItem ? "Update Product" : "Create Product"}</Btn>
      </Modal>
    </div>
  );
};

// ─── TRANSFERS PAGE ───────────────────────────────────────────────────────────
const TransfersPage = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.sales.getAll() as any[];
        setTransfers(Array.isArray(data) ? data.filter((s: any) => s.status === "shipped") : []);
      } catch { setTransfers([]); } finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = transfers.filter((t: any) =>
    (t.customer_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Stock Transfers" subtitle="Transfer inventory between shops">
        <Btn color={C.green}>⬇ Export</Btn>
        <Btn color={C.purple}>+ New Transfer</Btn>
      </PageHeader>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total" value={String(filtered.length)} />
        <StatCard label="Pending" value={String(filtered.filter(t => t.status === "pending").length)} acolsent={C.orange} />
        <StatCard label="Completed" value={String(filtered.filter(t => t.status === "completed" || t.status === "paid").length)} acolsent={C.green} />
      </div>
      <Card style={{ marginBottom: 12 }}>
        <SearchBar placeholder="Search transfers..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Loading...</div>
      ) : (
        <Table cols={["Reference", "From/To", "Status", "Date"]}
          rows={filtered.map((t: any) => [
            <span key="r" style={{ color: C.cyan, fontWeight: 700, fontFamily: "monospace" }}>#{t.id?.slice?.(0, 7) || "-"}</span>,
            t.customer_name || "Main Shop",
            <Badge key="st" label={(t.status || "pending").toUpperCase()} color={t.status === "completed" || t.status === "paid" ? C.green : C.orange} />,
            <span key="d" style={{ color: C.muted }}>{t.createdAt || t.sale_date ? new Date(t.createdAt || t.sale_date).toLocaleDateString("en-GB") : "-"}</span>,
          ])}
          empty="No transfers yet." />
      )}
    </div>
  );
};

// ─── CATEGORIES PAGE ──────────────────────────────────────────────────────────
const CategoriesPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.products.getCategories() as any[];
      setCategories(Array.isArray(data) ? data : []);
    } catch { setCategories([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      await api.products.createCategory(form);
      setModal(false); setForm({ name: "", description: "" }); load();
    } catch { alert("Failed to create category"); }
  };

  return (
    <div>
      <PageHeader title="Categories" subtitle="Organize your products">
        <Btn color={C.purple} onClick={() => setModal(true)}>+ Add Category</Btn>
      </PageHeader>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Categories" value={String(categories.length || 1)} icon="🏷️" acolsent={C.purple} />
        <StatCard label="Active" value={String(categories.length || 1)} icon="✅" acolsent={C.green} />
      </div>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Loading...</div>
      ) : categories.length === 0 ? (
        <Card><div style={{ textAlign: "center", padding: "30px" }}><div style={{ fontSize: 32, marginBottom: 8, opacity: .3 }}>🏷️</div><div style={{ color: C.muted, fontSize: 13 }}>No categories yet.</div></div></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {categories.map((cat: any) => (
            <Card key={cat.id || cat.name}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, color: C.purple }}>🏷️</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{cat.name}</div>
                    {cat.description && <div style={{ fontSize: 12, color: C.muted }}>{cat.description}</div>}
                  </div>
                </div>
                <Badge label={cat.product_count ? `${cat.product_count} products` : "Active"} color={C.green} />
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Category">
        <InputField label="Category Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="e.g. Electronics" icon="🏷️" />
        <InputField label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Optional description" rows={2} />
        <Btn color={C.purple} onClick={handleSubmit} style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "10px 0" }}>Create Category</Btn>
      </Modal>
    </div>
  );
};

// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
const ReportsPage = () => {
  const [tab, setTab] = useState("Sales");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const tabs = ["Sales", "Inventory", "Financial", "Tax"];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        let result;
        switch (tab) {
          case "Sales": result = await api.reports.getSalesReport(); break;
          case "Inventory": result = await api.reports.getInventoryReport(); break;
          case "Financial": result = await api.reports.getProfitLoss(); break;
          case "Tax": result = await api.reports.getTaxSummary(); break;
        }
        setData(result);
      } catch { setData(null); } finally { setLoading(false); }
    }
    load();
  }, [tab]);

  return (
    <div>
      <PageHeader title="Business Reports" subtitle="Comprehensive business analytics">
        <Btn color={C.purple}>⬇ Export</Btn>
      </PageHeader>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.bgCard3, borderRadius: 10, padding: 4, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: t === tab ? `linear-gradient(135deg, ${C.indigo}, ${C.purple})` : "transparent",
            border: "none", borderRadius: 8, padding: "8px 16px",
            fontSize: 13, color: t === tab ? "#fff" : C.text, cursor: "pointer", fontWeight: t === tab ? 600 : 400, transition,
          }}>{t}</button>
        ))}
      </div>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Today", "This Week", "This Month", "Last Month"].map(t => (
            <button key={t} style={{
              background: t === "This Month" ? C.indigo : C.bgCard3,
              border: `1px solid ${t === "This Month" ? C.indigo : C.border}`,
              borderRadius: 20, padding: "5px 14px", fontSize: 12,
              color: t === "This Month" ? "#fff" : C.text,
              cursor: "pointer", transition,
            }}>{t}</button>
          ))}
        </div>
      </Card>
      {loading ? (
        <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>Loading...</div>
      ) : data ? (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${C.indigo}, ${C.purple})`, display: "inline-block" }} />
            {tab} Report
          </div>
          {Object.entries(data).slice(0, 8).map(([k, v]: any) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ color: C.muted }}>{k.replace(/_/g, " ")}</span>
              <span style={{ fontWeight: 700, color: C.text }}>{typeof v === "number" ? formatCurrency(v) : String(v)}</span>
            </div>
          ))}
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { title: "Sales Report", icon: "📈", items: [["Total Sales", "0"], ["Revenue", "Ksh 0.00", C.green], ["Avg Sale", "Ksh 0.00"], ["Profit", "Ksh 0.00", C.green]], acolsent: C.indigo },
            { title: "Inventory Report", icon: "📦", items: [["Total Products", "8"], ["Low Stock", "0", C.orange], ["Out of Stock", "0", C.red], ["Stock Value", "Ksh 30,800.00", C.green]], acolsent: C.purple },
            { title: "Customer Report", icon: "👥", items: [["Total", "5"], ["Active", "0", C.green], ["New (Period)", "0"]], acolsent: C.teal },
            { title: "Financial Report", icon: "📊", items: [["Revenue", "Ksh 0.00", C.green], ["Expenses", "Ksh 0.00", C.red], ["Gross Profit", "Ksh 0.00", C.green]], acolsent: C.orange },
          ].map(r => (
            <Card key={r.title} acolsent={r.acolsent}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 20 }}>{r.icon}</span>
                <div><div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{r.title}</div></div>
              </div>
              {r.items.map(([k, v, c]: any) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.muted }}>{k}:</span>
                  <span style={{ fontWeight: 700, color: c || C.text }}>{v}</span>
                </div>
              ))}
              <div style={{ background: C.border, borderRadius: 4, height: 4, marginTop: 12 }}>
                <div style={{
                  width: r.acolsent === C.indigo ? "68%" : r.acolsent === C.purple ? "45%" : r.acolsent === C.teal ? "32%" : "55%",
                  background: r.acolsent, height: 4, borderRadius: 4
                }} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── CUSTOMERS PAGE ───────────────────────────────────────────────────────────
const CustomersPage = () => {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.customers.getAll() as any[];
      setCustomers(Array.isArray(data) ? data : []);
    } catch { setCustomers([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      if (editItem) { await api.customers.update(editItem.id, form); }
      else { await api.customers.create(form); }
      setModal(false); setEditItem(null); setForm({ name: "", email: "", phone: "", address: "" }); load();
    } catch { alert("Failed to save customer"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    try { await api.customers.delete(id); load(); } catch { alert("Delete failed"); }
  };

  const filtered = customers.filter((c: any) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search)
  );

  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage your customer database">
        <Btn color={C.pink} onClick={() => { setEditItem(null); setForm({ name: "", email: "", phone: "", address: "" }); setModal(true); }}>+ Add Customer</Btn>
        <Btn outline color={C.muted} onClick={load}>↺ Refresh</Btn>
      </PageHeader>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Customers" value={String(filtered.length)} icon="👥" acolsent={C.green} />
        <StatCard label="With Email" value={String(filtered.filter((c: any) => c.email).length)} icon="✉️" acolsent={C.blue} />
        <StatCard label="With Phone" value={String(filtered.filter((c: any) => c.phone).length)} icon="📞" acolsent={C.purple} />
      </div>
      <Card style={{ marginBottom: 12 }}>
        <SearchBar placeholder="Search name, email, phone..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Loading...</div>
      ) : (
        <Table cols={["Customer", "Email", "Phone", "Actions"]}
          rows={filtered.map((c: any) => [
            <div key="n" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={c.name} /> <span style={{ fontWeight: 600 }}>{c.name}</span>
            </div>,
            c.email || <span style={{ color: C.muted }}>-</span>,
            c.phone || <span style={{ color: C.muted }}>-</span>,
            <div key="ac" style={{ display: "flex", gap: 6 }}>
              <Btn small outline color={C.cyan} onClick={() => { setEditItem(c); setForm({ name: c.name || "", email: c.email || "", phone: c.phone || "", address: c.address || "" }); setModal(true); }}>✏️</Btn>
              <Btn small outline color={C.red} onClick={() => handleDelete(c.id)}>🗑</Btn>
            </div>,
          ])}
          empty="No customers found." />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Customer" : "Add Customer"}>
        <InputField label="Customer Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Full name" icon="👤" />
        <InputField label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="email@example.com" icon="✉️" type="email" />
        <InputField label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="07XX XXX XXX" icon="📞" />
        <InputField label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} placeholder="Optional address" rows={2} />
        <Btn color={C.pink} onClick={handleSubmit} style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "10px 0" }}>{editItem ? "Update Customer" : "Create Customer"}</Btn>
      </Modal>
    </div>
  );
};

// ─── USERS PAGE ───────────────────────────────────────────────────────────────
const UsersPage = () => {
  const { user, business } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.users.getAll() as any[];
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      await api.users.create(form); setModal(false); setForm({ name: "", email: "", password: "", role: "staff" }); load();
    } catch { alert("Failed to create user"); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this user?")) return;
    try { await api.users.remove(id); load(); } catch { alert("Remove failed"); }
  };

  const filtered = users.filter((u: any) =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage system users and acolsess">
        <Btn color={C.purple} onClick={() => setModal(true)}>+ Add User</Btn>
      </PageHeader>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Users" value={String(filtered.length || 1)} icon="👤" acolsent={C.blue} />
        <StatCard label="Active" value={String(filtered.filter((u: any) => u.is_active !== false).length)} icon="✅" acolsent={C.green} />
        <StatCard label="Admins" value={String(filtered.filter((u: any) => u.role === "admin" || u.role === "owner").length)} icon="🛡" acolsent={C.purple} />
      </div>
      <Card style={{ marginBottom: 12 }}>
        <SearchBar placeholder="Search by name or email..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Loading...</div>
      ) : (
        <Table cols={["User", "Role", "Status", ""]}
          rows={filtered.map((u: any) => [
            <div key="n" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={u.name} color={u.role === "owner" ? C.indigo : u.role === "admin" ? C.purple : C.blue} />
              <div><div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{u.name}</div><div style={{ fontSize: 11, color: C.muted }}>{u.email}</div></div>
            </div>,
            <Badge key="rl" label={(u.role || "staff").toUpperCase()} color={u.role === "owner" ? C.indigo : u.role === "admin" ? C.purple : C.blue} />,
            <div key="st" style={{ display: "flex", alignItems: "center", gap: 6, color: u.is_active !== false ? C.green : C.red, fontSize: 12, fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: u.is_active !== false ? C.green : C.red, display: "inline-block" }} />
              {u.is_active !== false ? "Active" : "Inactive"}
            </div>,
            <Btn key="ac" small outline color={C.red} onClick={() => handleRemove(u.id)} disabled={u.role === "owner"}>🗑</Btn>,
          ])}
          empty="No users found." />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Add User">
        <InputField label="Full Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="User name" icon="👤" />
        <InputField label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="email@example.com" icon="✉️" type="email" />
        <InputField label="Password" value={form.password} onChange={v => setForm({ ...form, password: v })} placeholder="Set password" icon="🔑" type="password" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 5, fontWeight: 500 }}>Role</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
            style={{ width: "100%", background: C.bgCard3, border: `1px solid ${C.border}`, borderRadius: radius.sm, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none" }}>
            <option value="staff">Staff</option><option value="admin">Admin</option>
          </select>
        </div>
        <Btn color={C.purple} onClick={handleSubmit} style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "10px 0" }}>Create User</Btn>
      </Modal>
    </div>
  );
};

// ─── SUPPLIERS PAGE ───────────────────────────────────────────────────────────
const SuppliersPage = () => (
  <div>
    <PageHeader title="Suppliers" subtitle="Manage your suppliers">
      <Btn color={C.purple}>+ Add Supplier</Btn>
    </PageHeader>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      <StatCard label="Total Suppliers" value="0" icon="🏭" acolsent={C.blue} />
      <StatCard label="Active" value="0" icon="✅" acolsent={C.green} />
    </div>
    <Card style={{ marginBottom: 12 }}>
      <SearchBar placeholder="Search suppliers..." value="" onChange={() => { }} />
    </Card>
    <Card><div style={{ textAlign: "center", padding: "50px 20px" }}><div style={{ fontSize: 40, opacity: .3, marginBottom: 12 }}>🏭</div><div style={{ color: C.muted, fontSize: 13 }}>No suppliers yet. Add your first supplier.</div></div></Card>
  </div>
);

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
const SettingsPage = () => {
  const [tab, setTab] = useState("Business");
  const tabs = ["Business", "General", "Notifications", "Receipt", "Security"];
  const { business, user } = useAuth();
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your business settings and preferences">
        <Btn color={C.purple}>💾 Save Changes</Btn>
      </PageHeader>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.bgCard3, borderRadius: 10, padding: 4, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: t === tab ? `linear-gradient(135deg, ${C.indigo}, ${C.purple})` : "transparent",
            border: "none", borderRadius: 8, padding: "8px 16px",
            fontSize: 13, color: t === tab ? "#fff" : C.text, cursor: "pointer",
            fontWeight: t === tab ? 600 : 400, transition,
          }}>{t}</button>
        ))}
      </div>
      {tab === "Business" && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${C.indigo}, ${C.purple})`, display: "inline-block" }} />
            Business Information
          </div>
          <div style={{ border: `2px dashed ${C.border}`, borderRadius: radius.md, padding: "40px 20px", textAlign: "center", color: C.muted, cursor: "pointer", marginBottom: 20, transition, background: C.bgCard3 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🖼</div>
            <div style={{ fontSize: 13 }}><span style={{ color: C.indigo2 }}>Click to upload</span> or drag & drop</div>
            <div style={{ fontSize: 11, marginTop: 4, color: C.muted }}>PNG, JPG, WEBP — max 2MB</div>
          </div>
          {[{ label: "Business Name *", value: business?.name || "My Business", icon: "🏢" }, { label: "Acolsount Email", value: user?.email || "", icon: "✉️" }, { label: "Currency", value: "KES — Kenyan Shilling", icon: "💱" }].map(f => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 5, fontWeight: 500 }}>{f.label}</label>
              <div style={{ background: C.bgCard3, border: `1px solid ${C.border}`, borderRadius: radius.sm, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ color: C.text, fontSize: 13 }}>{f.value}</span>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "Receipt" && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${C.teal}, ${C.green})`, display: "inline-block" }} />
            Receipt Settings
          </div>
          {[{ label: "Receipt Footer", val: "Thank you for your business!" }, { label: "Show VAT", val: "Yes" }, { label: "Show Barcode", val: "Yes" }, { label: "Paper Size", val: "80mm (Thermal)" }].map(f => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ color: C.muted }}>{f.label}</span>
              <span style={{ color: C.text, fontWeight: 600 }}>{f.val}</span>
            </div>
          ))}
        </Card>
      )}
      {tab === "Notifications" && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${C.orange}, ${C.amber})`, display: "inline-block" }} />
            Notification Preferences
          </div>
          {[{ label: "Low Stock Alerts", val: "✅ Enabled" }, { label: "Payment Confirmations", val: "✅ Enabled" }, { label: "Daily Summary", val: "✅ Enabled" }, { label: "Weekly Report", val: "❌ Disabled" }].map(f => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ color: C.muted }}>{f.label}</span>
              <span style={{ color: C.text, fontWeight: 600 }}>{f.val}</span>
            </div>
          ))}
        </Card>
      )}
      {tab === "Security" && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${C.red}, ${C.pink})`, display: "inline-block" }} />
            Security Settings
          </div>
          {[{ label: "Two-Factor Authentication", val: "❌ Disabled" }, { label: "Session Timeout", val: "30 minutes" }, { label: "Password Expiry", val: "90 days" }, { label: "Login Notifications", val: "✅ Enabled" }].map(f => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ color: C.muted }}>{f.label}</span>
              <span style={{ color: C.text, fontWeight: 600 }}>{f.val}</span>
            </div>
          ))}
        </Card>
      )}
      {tab === "General" && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${C.blue}, ${C.cyan})`, display: "inline-block" }} />
            General Settings
          </div>
          {[{ label: "Default Language", val: "English" }, { label: "Date Format", val: "DD/MM/YYYY" }, { label: "Time Zone", val: "Africa/Nairobi (EAT)" }, { label: "Items Per Page", val: "25" }, { label: "Default Shop", val: "Main Shop" }].map(f => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ color: C.muted }}>{f.label}</span>
              <span style={{ color: C.text, fontWeight: 600 }}>{f.val}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// ─── LOADER ───────────────────────────────────────────────────────────────────
const Loader = () => (
  <div style={{ padding: 60, textAlign: "center" }}>
    <div className="animate-pulse" style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
    <div style={{ color: C.muted, fontSize: 13 }}>Loading...</div>
  </div>
);

// ─── ORDERS PAGE ──────────────────────────────────────────────────────────────
const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sales.getAll().then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="Orders" subtitle="Track all customer orders" />
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label="Total Orders" value={String(orders.length)} icon="📋" acolsent={C.indigo} />
        <StatCard label="Pending" value={String(orders.filter((o: any) => o.status === "pending").length)} icon="⏳" acolsent={C.orange} />
        <StatCard label="Completed" value={String(orders.filter((o: any) => o.status === "completed" || o.status === "paid").length)} icon="✅" acolsent={C.green} />
      </div>
      <Card>
        <Table
          headers={["Order", "Customer", "Total", "Status", "Date"]}
          rows={orders.map((o: any) => [o.id || o._id || "-", o.customerName || o.customer?.name || "-", formatCurrency(o.total || o.amount || 0), o.status || "pending", o.date || o.createdAt ? new Date(o.date || o.createdAt).toLocaleDateString() : "-"])}
          acolsent={C.indigo}
        />
      </Card>
    </div>
  );
};

// ─── PRODUCTS PAGE ────────────────────────────────────────────────────────────
const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.products.getAll().then(d => setProducts(Array.isArray(d) ? d : [])).catch(() => setProducts([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="Products" subtitle="Manage your product catalog" />
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label="Total Products" value={String(products.length)} icon="📦" acolsent={C.indigo} />
        <StatCard label="In Stock" value={String(products.filter((p: any) => (p.stock || p.quantity || 0) > 0).length)} icon="✅" acolsent={C.green} />
        <StatCard label="Low Stock" value={String(products.filter((p: any) => (p.stock || p.quantity || 0) <= 5).length)} icon="⚠️" acolsent={C.orange} />
      </div>
      <Card>
        <Table
          headers={["Name", "SKU", "Price", "Stock", "Category"]}
          rows={products.map((p: any) => [p.name || "-", p.sku || "-", formatCurrency(p.price || 0), String(p.stock ?? p.quantity ?? 0), p.category || "-"])}
          acolsent={C.indigo}
        />
      </Card>
    </div>
  );
};

// ─── REVIEWS PAGE ─────────────────────────────────────────────────────────────
const ReviewsPage = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reviews").then(r => r.json()).then(d => setReviews(Array.isArray(d) ? d : [])).catch(() => setReviews([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Customer feedback and ratings" />
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label="Total Reviews" value={String(reviews.length)} icon="⭐" acolsent={C.amber} />
        <StatCard label="Avg Rating" value={reviews.length ? (reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : "0.0"} icon="📊" acolsent={C.indigo} />
      </div>
      {reviews.length === 0 ? (
        <Card><div style={{ textAlign: "center", padding: 40, color: C.muted }}>No reviews yet</div></Card>
      ) : (
        <Card>
          <Table
            headers={["Customer", "Product", "Rating", "Comment", "Date"]}
            rows={reviews.map((r: any) => [r.customerName || r.customer?.name || "-", r.productName || r.product?.name || "-", "★".repeat(r.rating || 0) + "☆".repeat(5 - (r.rating || 0)), r.comment?.slice(0, 50) || "-", r.date ? new Date(r.date).toLocaleDateString() : "-"])}
            acolsent={C.amber}
          />
        </Card>
      )}
    </div>
  );
};

// ─── MESSAGES PAGE ────────────────────────────────────────────────────────────
const MessagesPage = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages").then(r => r.json()).then(d => setMessages(Array.isArray(d) ? d : [])).catch(() => setMessages([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="Messages" subtitle="Incoming messages and inquiries" />
      {messages.length === 0 ? (
        <Card><div style={{ textAlign: "center", padding: 40, color: C.muted }}>No messages yet</div></Card>
      ) : (
        <Card>
          <Table
            headers={["From", "Subject", "Date", "Status"]}
            rows={messages.map((m: any) => [m.from || m.senderName || m.email || "-", m.subject || "(no subject)", m.date ? new Date(m.date).toLocaleDateString() : "-", m.read ? "Read" : "Unread"])}
            acolsent={C.cyan}
          />
        </Card>
      )}
    </div>
  );
};

// ─── ANALYTICS PAGE ────────────────────────────────────────────────────────────
const AnalyticsPage = () => (
  <div>
    <PageHeader title="Analytics" subtitle="Deep dive into business metrics" />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      <StatCard label="Page Views" value="1,234" icon="👁️" acolsent={C.indigo} />
      <StatCard label="Conversion" value="12.3%" icon="📈" acolsent={C.green} />
      <StatCard label="Avg Session" value="4m 32s" icon="⏱️" acolsent={C.purple} />
      <StatCard label="Bounce Rate" value="24.1%" icon="📉" acolsent={C.orange} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 40, color: C.muted }}>📊 Detailed analytics charts coming soon</div></Card>
  </div>
);

// ─── ACTIVITY FEED PAGE ─────────────────────────────────────────────────────────
const ActivityFeedPage = () => (
  <div>
    <PageHeader title="Activity Feed" subtitle="Real-time business activity" />
    <Card><div style={{ textAlign: "center", padding: 40, color: C.muted }}>📋 No recent activity to display</div></Card>
  </div>
);

// ─── QUICK ACTIONS PAGE ─────────────────────────────────────────────────────────
const QuickActionsPage = () => (
  <div>
    <PageHeader title="Quick Actions" subtitle="Frequently used shortcuts" />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {[
        { icon: "🛒", label: "New Sale", color: C.green },
        { icon: "📦", label: "Add Product", color: C.indigo },
        { icon: "👥", label: "Add Customer", color: C.pink },
        { icon: "📉", label: "Add Expense", color: C.red },
        { icon: "🏪", label: "New Shop", color: C.orange },
        { icon: "💰", label: "Record Payment", color: C.cyan },
      ].map(a => (
        <Card key={a.label} hover style={{ flex: "1 1 calc(33% - 8px)", minWidth: 180, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{a.icon}</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: a.color }}>{a.label}</div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── QUOTATIONS PAGE ────────────────────────────────────────────────────────────
const QuotationsPage = () => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/quotations").then(r => r.json()).then(d => setQuotes(Array.isArray(d) ? d : [])).catch(() => setQuotes([])).finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <PageHeader title="Quotations" subtitle="Manage price quotes and estimates">
        <Btn color={C.amber}>+ New Quotation</Btn>
      </PageHeader>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label="Total Quotes" value={String(quotes.length)} icon="📄" acolsent={C.amber} />
        <StatCard label="Pending" value={String(quotes.filter((q: any) => q.status === "pending" || !q.status).length)} icon="⏳" acolsent={C.orange} />
        <StatCard label="Approved" value={String(quotes.filter((q: any) => q.status === "approved" || q.status === "accepted").length)} icon="✅" acolsent={C.green} />
      </div>
      {loading ? <Loader /> : (
        <Card>
          <Table headers={["#", "Customer", "Total", "Status", "Date"]}
            rows={quotes.length ? quotes.map((q: any) => [
              q.id?.slice?.(0, 7) || "-", q.customer || q.customer_name || "-",
              formatCurrency(parseFloat(q.total || q.amount || 0) || 0),
              <Badge key="st" label={(q.status || "draft").toUpperCase()} color={q.status === "accepted" || q.status === "approved" ? C.green : q.status === "rejected" ? C.red : C.orange} />,
              q.createdAt ? new Date(q.createdAt).toLocaleDateString("en-GB") : "-",
            ]) : []}
            empty="No quotations yet. Create your first quotation." />
        </Card>
      )}
    </div>
  );
};

// ─── RETURNS PAGE ───────────────────────────────────────────────────────────────
const ReturnsPage = () => (
  <div>
    <PageHeader title="Returns" subtitle="Manage product returns and exchanges">
      <Btn color={C.orange}>+ New Return</Btn>
    </PageHeader>
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <StatCard label="Total Returns" value="0" icon="↩️" acolsent={C.orange} />
      <StatCard label="Pending" value="0" icon="⏳" acolsent={C.amber} />
      <StatCard label="Approved" value="0" icon="✅" acolsent={C.green} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>↩️ No returns recorded yet</div></Card>
  </div>
);

// ─── RECEIPTS PAGE ──────────────────────────────────────────────────────────────
const ReceiptsPage = () => (
  <div>
    <PageHeader title="Receipts" subtitle="View and print transaction receipts">
      <Btn color={C.cyan}>⬇ Export All</Btn>
    </PageHeader>
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <StatCard label="Today" value="0" icon="📅" acolsent={C.cyan} />
      <StatCard label="This Week" value="0" icon="📋" acolsent={C.indigo} />
      <StatCard label="This Month" value="0" icon="📊" acolsent={C.purple} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>🧾 No receipts generated yet</div></Card>
  </div>
);

// ─── PENDING PAYMENTS PAGE ──────────────────────────────────────────────────────
const PendingPaymentsPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.invoices.getAll().then((d: any) => setItems(Array.isArray(d) ? d.filter((i: any) => i.status === "pending" || i.status === "draft") : [])).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <PageHeader title="Pending Payments" subtitle="Awaiting payment confirmation" />
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label="Pending" value={String(items.length)} icon="⏳" acolsent={C.orange} />
        <StatCard label="Total" value={formatCurrency(items.reduce((s: number, i: any) => s + (parseFloat(i.total || i.amount || 0) || 0), 0))} icon="💰" acolsent={C.red} />
      </div>
      {loading ? <Loader /> : (
        <Card>
          <Table headers={["Customer", "Amount", "Date"]}
            rows={items.map((i: any) => [i.customer || i.customer_name || "-", formatCurrency(parseFloat(i.total || i.amount || 0) || 0), i.createdAt ? new Date(i.createdAt).toLocaleDateString("en-GB") : "-"])}
            empty="No pending payments" />
        </Card>
      )}
    </div>
  );
};

// ─── REFUNDS PAGE ───────────────────────────────────────────────────────────────
const RefundsPage = () => (
  <div>
    <PageHeader title="Refunds" subtitle="Manage refund transactions">
      <Btn color={C.red}>+ Process Refund</Btn>
    </PageHeader>
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <StatCard label="Total Refunds" value="0" icon="💸" acolsent={C.red} />
      <StatCard label="Amount" value="Ksh 0.00" icon="💰" acolsent={C.orange} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>💸 No refunds processed yet</div></Card>
  </div>
);

// ─── CHARGEBACKS PAGE ───────────────────────────────────────────────────────────
const ChargebacksPage = () => (
  <div>
    <PageHeader title="Chargebacks" subtitle="Dispute management" />
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <StatCard label="Open" value="0" icon="🔄" acolsent={C.orange} />
      <StatCard label="Resolved" value="0" icon="✅" acolsent={C.green} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>🔄 No chargebacks recorded</div></Card>
  </div>
);

// ─── PAYMENT METHODS PAGE ───────────────────────────────────────────────────────
const PaymentMethodsPage = () => (
  <div>
    <PageHeader title="Payment Methods" subtitle="Configure accepted payment methods" />
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[
        { name: "Cash", icon: "💵", status: "Active" },
        { name: "M-Pesa", icon: "📱", status: "Active" },
        { name: "Credit Card", icon: "💳", status: "Active" },
        { name: "Bank Transfer", icon: "🏦", status: "Inactive" },
        { name: "PayPal", icon: "🌐", status: "Inactive" },
      ].map(m => (
        <Card key={m.name}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{m.icon}</span>
              <div><div style={{ fontWeight: 600, color: C.text }}>{m.name}</div></div>
            </div>
            <Badge label={m.status.toUpperCase()} color={m.status === "Active" ? C.green : C.muted} />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── PAYMENT ANALYTICS PAGE ──────────────────────────────────────────────────────
const PaymentAnalyticsPage = () => (
  <div>
    <PageHeader title="Payment Analytics" subtitle="Payment performance metrics" />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      <StatCard label="Success Rate" value="100%" icon="✅" acolsent={C.green} />
      <StatCard label="Avg Processing" value="1.2s" icon="⏱️" acolsent={C.indigo} />
      <StatCard label="Failed" value="0" icon="❌" acolsent={C.red} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 40, color: C.muted }}>📊 Payment analytics dashboard coming soon</div></Card>
  </div>
);

// ─── STOCK LEVELS PAGE ──────────────────────────────────────────────────────────
const StockLevelsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.products.getAll().then((d: any) => setProducts(Array.isArray(d) ? d : [])).catch(() => setProducts([])).finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <PageHeader title="Stock Levels" subtitle="Monitor inventory quantities" />
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label="In Stock" value={String(products.filter((p: any) => (p.stock_qty || 0) > 10).length)} icon="✅" acolsent={C.green} />
        <StatCard label="Low Stock" value={String(products.filter((p: any) => (p.stock_qty || 0) <= 10 && (p.stock_qty || 0) > 0).length)} icon="⚠️" acolsent={C.orange} />
        <StatCard label="Out of Stock" value={String(products.filter((p: any) => !p.stock_qty || p.stock_qty === 0).length)} icon="❌" acolsent={C.red} />
      </div>
      {loading ? <Loader /> : (
        <Card>
          <Table headers={["Product", "Stock", "Status"]}
            rows={products.map((p: any) => [
              p.name || "-",
              <span key="sq" style={{ fontWeight: 700, color: (p.stock_qty || 0) === 0 ? C.red : (p.stock_qty || 0) <= 10 ? C.orange : C.green }}>{p.stock_qty || 0}</span>,
              <Badge key="st" label={(p.stock_qty || 0) === 0 ? "OUT" : (p.stock_qty || 0) <= 10 ? "LOW" : "OK"} color={(p.stock_qty || 0) === 0 ? C.red : (p.stock_qty || 0) <= 10 ? C.orange : C.green} />,
            ])}
            empty="No products found" />
        </Card>
      )}
    </div>
  );
};

// ─── BARCODES PAGE ──────────────────────────────────────────────────────────────
const BarcodesPage = () => (
  <div>
    <PageHeader title="Barcodes" subtitle="Generate and manage product barcodes">
      <Btn color={C.cyan}>+ Generate Barcode</Btn>
    </PageHeader>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>📱 No barcodes generated yet. Connect a barcode scanner to get started.</div></Card>
  </div>
);

// ─── STOCK ADJUSTMENTS PAGE ─────────────────────────────────────────────────────
const StockAdjustmentsPage = () => (
  <div>
    <PageHeader title="Stock Adjustments" subtitle="Record inventory corrections">
      <Btn color={C.amber}>+ New Adjustment</Btn>
    </PageHeader>
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <StatCard label="Total Adjustments" value="0" icon="⚖️" acolsent={C.amber} />
      <StatCard label="Pending Review" value="0" icon="⏳" acolsent={C.orange} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>⚖️ No stock adjustments recorded</div></Card>
  </div>
);

// ─── LOYALTY PAGE ────────────────────────────────────────────────────────────────
const LoyaltyPage = () => (
  <div>
    <PageHeader title="Loyalty Program" subtitle="Manage customer rewards and points">
      <Btn color={C.amber}>⚙️ Configure</Btn>
    </PageHeader>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      <StatCard label="Active Members" value="0" icon="⭐" acolsent={C.amber} />
      <StatCard label="Points Issued" value="0" icon="🎯" acolsent={C.purple} />
      <StatCard label="Points Redeemed" value="0" icon="🎁" acolsent={C.green} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>⭐ Set up your loyalty program to start rewarding customers</div></Card>
  </div>
);

// ─── CREDIT ACCOUNTS PAGE (renamed from CreditPage) ─────────────────────────────
const CreditAccountsPage = () => {
  const [debtors, setDebtors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", amount: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.debtors.getAll() as any[];
      setDebtors(Array.isArray(data) ? data : []);
    } catch { setDebtors([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      await api.debtors.create({ name: form.name, phone: form.phone, amount: parseFloat(form.amount) || 0, notes: form.notes });
      setModal(false); setForm({ name: "", phone: "", amount: "", notes: "" });
      load();
    } catch { alert("Failed to create credit"); }
  };

  const filtered = debtors.filter((d: any) =>
    (d.name || "").toLowerCase().includes(search.toLowerCase()) || (d.phone || "").includes(search)
  );
  const totalOutstanding = filtered.reduce((s: number, d: any) => s + (parseFloat(d.amount || d.balance || d.total) || 0), 0);
  const overdue = filtered.filter((d: any) => d.status === "overdue");

  return (
    <div>
      <PageHeader title="Credit Accounts" subtitle="Manage customer credit">
        <Btn color={C.purple} onClick={() => setModal(true)}>+ New Credit</Btn>
        <Btn outline color={C.muted} onClick={load}>↺ Refresh</Btn>
      </PageHeader>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard label="Credit Customers" value={String(filtered.length)} icon="👥" />
        <StatCard label="Outstanding" value={formatCurrency(totalOutstanding)} icon="💰" acolsent={C.orange} />
        <StatCard label="Overdue" value={String(overdue.length)} icon="⚠️" acolsent={C.red} />
      </div>
      <Card style={{ marginBottom: 12 }}>
        <SearchBar placeholder="Search by name or phone..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <Loader />
      ) : (
        <Table cols={["Name", "Phone", "Amount", "Status", "Actions"]}
          rows={filtered.map((d: any) => [
            <span key="n" style={{ fontWeight: 600 }}>{d.name || "N/A"}</span>,
            <span key="p" style={{ color: C.muted }}>{d.phone || "-"}</span>,
            <span key="a" style={{ fontWeight: 700, color: C.orange }}>{formatCurrency(parseFloat(d.amount || d.balance || d.total) || 0)}</span>,
            <Badge key="st" label={(d.status || "pending").toUpperCase()} color={d.status === "paid" ? C.green : d.status === "overdue" ? C.red : C.orange} />,
            <div key="ac" style={{ display: "flex", gap: 6 }}>
              <Btn small outline color={C.cyan}>👁 View</Btn>
              <Btn small outline color={C.green}>💰 Pay</Btn>
            </div>,
          ])}
          empty='No credit accounts yet. Click "+ New Credit" to add one.' />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="New Credit Account">
        <InputField label="Customer Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Full name" icon="👤" />
        <InputField label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="07XX XXX XXX" icon="📞" />
        <InputField label="Amount (KES)" value={form.amount} onChange={v => setForm({ ...form, amount: v })} placeholder="0" icon="💰" type="number" />
        <InputField label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} placeholder="Optional notes" rows={2} />
        <Btn color={C.purple} onClick={handleSubmit} style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "10px 0" }}>Create Credit Record</Btn>
      </Modal>
    </div>
  );
};

// ─── PURCHASE ORDERS PAGE ───────────────────────────────────────────────────────
const PurchaseOrdersPage = () => (
  <div>
    <PageHeader title="Purchase Orders" subtitle="Manage supplier purchase orders">
      <Btn color={C.blue}>+ New Purchase Order</Btn>
    </PageHeader>
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <StatCard label="Total Orders" value="0" icon="📋" acolsent={C.blue} />
      <StatCard label="Pending" value="0" icon="⏳" acolsent={C.orange} />
      <StatCard label="Received" value="0" icon="✅" acolsent={C.green} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>📋 No purchase orders yet</div></Card>
  </div>
);

// ─── SUPPLIER DELIVERIES PAGE ────────────────────────────────────────────────────
const SupplierDeliveriesPage = () => (
  <div>
    <PageHeader title="Supplier Deliveries" subtitle="Track incoming supplier shipments" />
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <StatCard label="Scheduled" value="0" icon="📅" acolsent={C.teal} />
      <StatCard label="In Transit" value="0" icon="🚚" acolsent={C.orange} />
      <StatCard label="Delivered" value="0" icon="✅" acolsent={C.green} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>🚚 No supplier deliveries scheduled</div></Card>
  </div>
);

// ─── SUPPLIER PAYMENTS PAGE ─────────────────────────────────────────────────────
const SupplierPaymentsPage = () => (
  <div>
    <PageHeader title="Supplier Payments" subtitle="Manage payments to suppliers" />
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <StatCard label="Total Due" value="Ksh 0.00" icon="💰" acolsent={C.cyan} />
      <StatCard label="Overdue" value="Ksh 0.00" icon="⚠️" acolsent={C.red} />
      <StatCard label="Paid This Month" value="Ksh 0.00" icon="✅" acolsent={C.green} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>💳 No supplier payments recorded</div></Card>
  </div>
);

// ─── LOGISTICS DELIVERIES PAGE ───────────────────────────────────────────────────
const LogisticsDeliveriesPage = () => (
  <div>
    <PageHeader title="Deliveries" subtitle="Track all outgoing deliveries" />
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <StatCard label="Pending" value="0" icon="📦" acolsent={C.orange} />
      <StatCard label="In Transit" value="0" icon="🚚" acolsent={C.blue} />
      <StatCard label="Delivered" value="0" icon="✅" acolsent={C.green} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>📦 No deliveries tracked yet</div></Card>
  </div>
);

// ─── TRACKING PAGE ──────────────────────────────────────────────────────────────
const TrackingPage = () => (
  <div>
    <PageHeader title="Tracking" subtitle="Real-time shipment tracking">
      <Btn color={C.orange}>🔍 Track Shipment</Btn>
    </PageHeader>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>📍 Enter a tracking number to view shipment status</div></Card>
  </div>
);

// ─── SHIPPING PARTNERS PAGE ──────────────────────────────────────────────────────
const ShippingPartnersPage = () => (
  <div>
    <PageHeader title="Shipping Partners" subtitle="Manage shipping carriers and rates" />
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>🤝 No shipping partners configured yet. Integrate with carriers like Sendy, Uber, or WellsFargo.</div></Card>
  </div>
);

// ─── REVENUE PAGE ────────────────────────────────────────────────────────────────
const RevenuePage = () => (
  <div>
    <PageHeader title="Revenue" subtitle="Track all incoming revenue" />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      <StatCard label="Total Revenue" value="Ksh 0.00" icon="📈" acolsent={C.green} />
      <StatCard label="This Month" value="Ksh 0.00" icon="📅" acolsent={C.indigo} />
      <StatCard label="Today" value="Ksh 0.00" icon="⚡" acolsent={C.amber} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 40, color: C.muted }}>📈 Revenue charts and breakdowns coming soon</div></Card>
  </div>
);

// ─── PROFIT & LOSS PAGE ─────────────────────────────────────────────────────────
const ProfitLossPage = () => (
  <div>
    <PageHeader title="Profit & Loss" subtitle="Business profitability overview" />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      <StatCard label="Revenue" value="Ksh 0.00" icon="📈" acolsent={C.green} />
      <StatCard label="Expenses" value="Ksh 0.00" icon="📉" acolsent={C.red} />
      <StatCard label="Net Profit" value="Ksh 0.00" icon="💵" acolsent={C.indigo} />
      <StatCard label="Profit Margin" value="0%" icon="📊" acolsent={C.purple} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 40, color: C.muted }}>📊 Full P&L statement with period comparison coming soon</div></Card>
  </div>
);

// ─── CASH FLOW PAGE ─────────────────────────────────────────────────────────────
const CashFlowPage = () => (
  <div>
    <PageHeader title="Cash Flow" subtitle="Monitor cash inflows and outflows" />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      <StatCard label="Operating" value="Ksh 0.00" icon="🔄" acolsent={C.teal} />
      <StatCard label="Investing" value="Ksh 0.00" icon="📈" acolsent={C.indigo} />
      <StatCard label="Financing" value="Ksh 0.00" icon="🏦" acolsent={C.purple} />
      <StatCard label="Net Cash" value="Ksh 0.00" icon="💵" acolsent={C.green} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 40, color: C.muted }}>💵 Cash flow statement coming soon</div></Card>
  </div>
);

// ─── TAX REPORTS PAGE ────────────────────────────────────────────────────────────
const TaxReportsPage = () => (
  <div>
    <PageHeader title="Tax Reports" subtitle="Tax summaries and filings">
      <Btn color={C.orange}>⬇ Export</Btn>
    </PageHeader>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      <StatCard label="VAT Collected" value="Ksh 0.00" icon="🧾" acolsent={C.orange} />
      <StatCard label="VAT Paid" value="Ksh 0.00" icon="💳" acolsent={C.red} />
      <StatCard label="Net VAT" value="Ksh 0.00" icon="📊" acolsent={C.indigo} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 40, color: C.muted }}>🧾 Tax reports and VAT summaries coming soon</div></Card>
  </div>
);

// ─── INVENTORY REPORTS PAGE ──────────────────────────────────────────────────────
const InventoryReportsPage = () => (
  <div>
    <PageHeader title="Inventory Reports" subtitle="Inventory analytics and insights" />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      <StatCard label="Total Products" value="8" icon="📦" acolsent={C.purple} />
      <StatCard label="Stock Value" value="Ksh 30,800.00" icon="💰" acolsent={C.green} />
      <StatCard label="Turnover Rate" value="0x" icon="🔄" acolsent={C.cyan} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 40, color: C.muted }}>📦 Detailed inventory reports coming soon</div></Card>
  </div>
);

// ─── CUSTOMER REPORTS PAGE ───────────────────────────────────────────────────────
const CustomerReportsPage = () => (
  <div>
    <PageHeader title="Customer Reports" subtitle="Customer analytics and insights" />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      <StatCard label="Total Customers" value="5" icon="👥" acolsent={C.pink} />
      <StatCard label="New (30d)" value="0" icon="🆕" acolsent={C.green} />
      <StatCard label="Repeat Rate" value="0%" icon="🔄" acolsent={C.indigo} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 40, color: C.muted }}>👥 Customer analytics and segmentation coming soon</div></Card>
  </div>
);

// ─── FINANCIAL REPORTS PAGE ──────────────────────────────────────────────────────
const FinancialReportsPage = () => (
  <div>
    <PageHeader title="Financial Reports" subtitle="Comprehensive financial analysis" />
    <Card><div style={{ textAlign: "center", padding: 40, color: C.muted }}>💰 Balance sheets, trial balances, and financial statements coming soon</div></Card>
  </div>
);

// ─── EXPORT CENTER PAGE ──────────────────────────────────────────────────────────
const ExportCenterPage = () => (
  <div>
    <PageHeader title="Export Center" subtitle="Export business data" />
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[
        { name: "Sales Report", icon: "📈", desc: "Export all sales data as CSV/Excel" },
        { name: "Inventory List", icon: "📦", desc: "Export product inventory" },
        { name: "Customer List", icon: "👥", desc: "Export customer database" },
        { name: "Financial Statement", icon: "💰", desc: "Export profit & loss report" },
        { name: "Tax Report", icon: "🧾", desc: "Export VAT/tax summary" },
      ].map(e => (
        <Card key={e.name} hover>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{e.icon}</span>
              <div><div style={{ fontWeight: 600, color: C.text }}>{e.name}</div><div style={{ fontSize: 12, color: C.muted }}>{e.desc}</div></div>
            </div>
            <Btn small color={C.cyan}>⬇ Export</Btn>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── BRANCH PERFORMANCE PAGE ─────────────────────────────────────────────────────
const BranchPerformancePage = () => (
  <div>
    <PageHeader title="Branch Performance" subtitle="Compare performance across branches" />
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>📊 Branch performance comparison coming soon. Add multiple shops to enable this feature.</div></Card>
  </div>
);

// ─── SHOP TRANSFERS PAGE ─────────────────────────────────────────────────────────
const ShopTransfersPage = () => (
  <div>
    <PageHeader title="Shop Transfers" subtitle="Transfer stock between branches" />
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>🔄 Inter-branch stock transfers coming soon</div></Card>
  </div>
);

// ─── STAFF ASSIGNMENT PAGE ───────────────────────────────────────────────────────
const StaffAssignmentPage = () => (
  <div>
    <PageHeader title="Staff Assignment" subtitle="Assign staff to branches and roles" />
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>👤 Staff management and branch assignment coming soon</div></Card>
  </div>
);

// ─── ROLES PAGE ──────────────────────────────────────────────────────────────────
const RolesPage = () => (
  <div>
    <PageHeader title="Roles & Permissions" subtitle="Define user roles and access levels">
      <Btn color={C.indigo}>+ New Role</Btn>
    </PageHeader>
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <StatCard label="Roles" value="3" icon="🔐" acolsent={C.indigo} />
      <StatCard label="Permissions" value="12" icon="✅" acolsent={C.green} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>🔐 Role and permission management coming soon</div></Card>
  </div>
);

// ─── ACTIVITY LOGS PAGE ──────────────────────────────────────────────────────────
const ActivityLogsPage = () => (
  <div>
    <PageHeader title="Activity Logs" subtitle="System audit trail" />
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>📋 System activity logs coming soon</div></Card>
  </div>
);

// ─── SECURITY SETTINGS PAGE ──────────────────────────────────────────────────────
const SecuritySettingsPage = () => (
  <div>
    <PageHeader title="Security Settings" subtitle="Configure security preferences" />
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>🛡️ Security configuration coming soon</div></Card>
  </div>
);

// ─── PAYMENT SETTINGS PAGE ───────────────────────────────────────────────────────
const PaymentSettingsPage = () => (
  <div>
    <PageHeader title="Payment Settings" subtitle="Configure payment gateway and methods" />
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>💳 Payment gateway configuration coming soon</div></Card>
  </div>
);

// ─── INTEGRATIONS PAGE ───────────────────────────────────────────────────────────
const IntegrationsPage = () => (
  <div>
    <PageHeader title="Integrations" subtitle="Connect third-party services" />
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[
        { name: "M-Pesa", icon: "📱", desc: "Mobile money payments", status: "Available" },
        { name: "Email", icon: "✉️", desc: "Transactional emails", status: "Available" },
        { name: "SMS", icon: "💬", desc: "SMS notifications", status: "Available" },
        { name: "Print Node", icon: "🖨️", desc: "Thermal receipt printing", status: "Available" },
      ].map(i => (
        <Card key={i.name}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{i.icon}</span>
              <div><div style={{ fontWeight: 600, color: C.text }}>{i.name}</div><div style={{ fontSize: 12, color: C.muted }}>{i.desc}</div></div>
            </div>
            <Badge label={i.status} color={C.green} />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── SYSTEM NOTIFICATIONS PAGE ───────────────────────────────────────────────────
const SystemNotificationsPage = () => (
  <div>
    <PageHeader title="System Notifications" subtitle="Configure alert preferences" />
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[
        { name: "Low Stock Alerts", val: "✅ Enabled" },
        { name: "Payment Confirmations", val: "✅ Enabled" },
        { name: "Daily Summary", val: "✅ Enabled" },
        { name: "Weekly Report", val: "❌ Disabled" },
        { name: "New User Registration", val: "✅ Enabled" },
        { name: "Backup Notifications", val: "❌ Disabled" },
      ].map(n => (
        <Card key={n.name}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 500, color: C.text }}>{n.name}</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{n.val}</span>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── BACKUP RESTORE PAGE ────────────────────────────────────────────────────────
const BackupRestorePage = () => (
  <div>
    <PageHeader title="Backup & Restore" subtitle="Data backup and recovery">
      <Btn color={C.green}>💾 Create Backup</Btn>
      <Btn outline color={C.orange}>↩ Restore</Btn>
    </PageHeader>
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <StatCard label="Last Backup" value="Never" icon="💾" acolsent={C.muted} />
      <StatCard label="Backups" value="0" icon="📦" acolsent={C.green} />
      <StatCard label="Auto Backup" value="Disabled" icon="⏰" acolsent={C.orange} />
    </div>
    <Card><div style={{ textAlign: "center", padding: 50, color: C.muted }}>💾 No backups created yet. Set up automatic backups to protect your data.</div></Card>
  </div>
);

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const Sidebar = ({ page, navigate, businessName }: any) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen shrink-0 flex-col overflow-hidden border-r sticky top-0 z-[45]"
      style={{
        width: collapsed ? 56 : 220,
        transition: "width .2s cubic-bezier(.4,0,.2,1)",
        background: "linear-gradient(180deg, #0a0f20, #080c1a)",
        borderColor: "var(--color-border)",
      }}>
      <div className="flex-1 overflow-auto px-2 py-1" style={{ padding: collapsed ? "4px 0" : "4px 8px" }}>
        {SIDEBAR_GROUPS.map(group => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <div className="px-[10px] pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "#6b7a99" }}>{group.label}</div>
            )}
            {group.items.map(item => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                id={item.id}
                current={page}
                onClick={navigate}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="border-t px-2 py-2" style={{ borderColor: "#1a2444", padding: collapsed ? "8px 0" : "8px 8px" }}>
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-full cursor-pointer border-none bg-transparent text-sm transition-all"
          style={{ color: "#6b7a99", textAlign: collapsed ? "center" : "left", paddingLeft: collapsed ? 0 : 8 }}
        >{collapsed ? "▶" : "◀ Collapse"}</button>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, id, current, onClick, collapsed }: any) => {
  const active = current === id;
  const [isHover, setHover] = useState(false);
  return (
    <button onClick={() => onClick(id)}
      className="mb-[1px] flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-[10px] py-[7px] text-[13px] transition-all"
      style={{
        background: active ? "color-mix(in srgb, #6366f1 15%, transparent)" : isHover ? "#111827" : "transparent",
        borderColor: active ? "color-mix(in srgb, #6366f1 22%, transparent)" : "transparent",
        justifyContent: collapsed ? "center" : "flex-start",
        color: active ? "#818cf8" : isHover ? "#f0f2f5" : "#c8cdd8",
        fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="shrink-0 text-base">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
};

// ─── PAGE ROUTER ──────────────────────────────────────────────────────────────
const PAGES: Record<string, React.ReactNode> = {
  dashboard: <DashboardPage />, analytics: <AnalyticsPage />,
  "activity-feed": <ActivityFeedPage />, "quick-actions": <QuickActionsPage />,
  sales: <SalesPage />, orders: <OrdersPage />, quotations: <QuotationsPage />,
  returns: <ReturnsPage />, receipts: <ReceiptsPage />,
  payments: <PaymentsPage />, "pending-payments": <PendingPaymentsPage />,
  refunds: <RefundsPage />, chargebacks: <ChargebacksPage />,
  "payment-methods": <PaymentMethodsPage />, "payment-analytics": <PaymentAnalyticsPage />,
  inventory: <InventoryPage />, "stock-levels": <StockLevelsPage />,
  categories: <CategoriesPage />, barcodes: <BarcodesPage />,
  "stock-adjustments": <StockAdjustmentsPage />, transfers: <TransfersPage />,
  customers: <CustomersPage />, loyalty: <LoyaltyPage />,
  "credit-accounts": <CreditAccountsPage />, reviews: <ReviewsPage />,
  messages: <MessagesPage />,
  suppliers: <SuppliersPage />, "purchase-orders": <PurchaseOrdersPage />,
  "supplier-deliveries": <SupplierDeliveriesPage />, "supplier-payments": <SupplierPaymentsPage />,
  dispatch: <DispatchPage />, "logistics-deliveries": <LogisticsDeliveriesPage />,
  tracking: <TrackingPage />, "shipping-partners": <ShippingPartnersPage />,
  expenses: <ExpensesPage />, revenue: <RevenuePage />, "profit-loss": <ProfitLossPage />,
  "cash-flow": <CashFlowPage />, "tax-reports": <TaxReportsPage />,
  reports: <ReportsPage />, "inventory-reports": <InventoryReportsPage />,
  "customer-reports": <CustomerReportsPage />, "financial-reports": <FinancialReportsPage />,
  "export-center": <ExportCenterPage />,
  shops: <ShopsPage />, "branch-performance": <BranchPerformancePage />,
  "shop-transfers": <ShopTransfersPage />, "staff-assignment": <StaffAssignmentPage />,
  users: <UsersPage />, roles: <RolesPage />, "activity-logs": <ActivityLogsPage />,
  "security-settings": <SecuritySettingsPage />,
  settings: <SettingsPage />, "payment-settings": <PaymentSettingsPage />,
  integrations: <IntegrationsPage />, notifications: <SystemNotificationsPage />,
  "backup-restore": <BackupRestorePage />,
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function BizFlowApp() {
  const [page, setPage] = useState("dashboard");
  const { user, business, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try { await logout(); }
    catch { window.location.href = "/login"; }
  }, [logout, isLoggingOut]);
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.background = C.bg;
    return () => {
      document.body.style.margin = "";
      document.body.style.background = "";
    };
  }, []);
  const userName = user?.name || "User";
  const businessName = business?.name || "BizFlow";
  return (
    <div className="dark flex min-h-screen" style={{ background: C.bg }}>
      <Sidebar page={page} navigate={setPage} businessName={businessName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header page={page} userName={userName} onLogout={handleLogout} />
        <div className="flex-1 overflow-auto px-6 py-5">
          {PAGES[page] || <div className="px-10 py-10 text-center" style={{ color: "var(--color-muted-foreground)" }}>Page not found</div>}
        </div>
      </div>
    </div>
  );
}
