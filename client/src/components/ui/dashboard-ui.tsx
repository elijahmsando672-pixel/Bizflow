import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, FileText } from "lucide-react";

export const Card = ({ children, accent, hover, className, ...props }: any) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-xl border bg-card p-[18px_20px] shadow-sm transition-all duration-200",
      hover && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
      className,
    )}
    {...props}
  >
    {accent && (
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t bg-gradient-to-r" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}44)` }} />
    )}
    {children}
  </div>
);

export const StatCard = ({ label, value, sub, icon, accent, wide, className }: any) => {
  const c = accent || "var(--color-primary)";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md",
        className,
      )}
      style={{ flex: wide ? "1 1 100%" : "1 1 calc(50% - 8px)", minWidth: 140 }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${c}, ${c}33)` }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-[22px] font-extrabold leading-tight tracking-tight" style={{ color: c }}>{value}</div>
          {sub && (
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: c }} />
              {sub}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border text-lg"
            style={{ background: `${c}18`, borderColor: `${c}22` }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export const Btn = ({ children, color, outline, onClick, small, className, disabled, style }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-[18px] py-[9px] text-[13px] font-semibold transition-all duration-200",
      small && "px-[14px] py-[6px] text-xs",
      disabled && "cursor-not-allowed opacity-40",
      className,
    )}
    style={{
      background: outline ? "transparent" : `linear-gradient(135deg, ${color || "var(--color-primary)"}, ${color || "var(--color-primary)"}dd)`,
      color: outline ? (color || "var(--color-primary)") : "#fff",
      border: `1px solid ${outline ? `${color || "var(--color-primary)"}44` : "transparent"}`,
      ...style,
    }}
  >
    {children}
  </button>
);

export const Badge = ({ label, color, glow: g }: any) => {
  const c = color || "var(--color-primary)";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-[10px] py-[2px] text-[11px] font-semibold whitespace-nowrap"
      style={{
        background: `linear-gradient(135deg, ${c}18, ${c}08)`,
        color: c,
        borderColor: `${c}22`,
        boxShadow: g ? `0 0 12px ${c}22` : "none",
      }}
    >
      {label}
    </span>
  );
};

export const SearchBar = ({ placeholder, value, onChange }: any) => (
  <div className="relative flex-1">
    <Search className="absolute left-[11px] top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
    <Input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-lg pl-[34px] text-[13px] bg-muted border-border"
    />
  </div>
);

export const Select = ({ options, value, onChange, className }: any) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={cn(
      "cursor-pointer rounded-lg border border-border px-3 py-[9px] text-[13px] outline-none transition-all bg-muted text-foreground",
      className,
    )}
  >
    {options.map((o: any) => (
      <option key={o.value || o} value={o.value || o} className="bg-card">{o.label || o}</option>
    ))}
  </select>
);

export const Table = ({ cols, rows, headers, empty }: any) => {
  const h = cols || headers || [];
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-primary/[0.08]">
            {h.map((c: string) => (
              <th key={c} className="px-4 py-[14px] text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(!rows || rows.length === 0) ? (
            <tr>
              <td colSpan={h.length}>
                <div className="px-5 py-[50px] text-center">
                  <div className="mb-3 text-muted-foreground/30 flex justify-center">
                    <FileText className="h-8 w-8" strokeWidth={1} />
                  </div>
                  <div className="text-[13px] text-muted-foreground">{empty || "No data found."}</div>
                </div>
              </td>
            </tr>
          ) : rows.map((r: any[], i: number) => (
            <tr key={i} className={cn("transition-colors border-b border-border last:border-0", i % 2 === 0 ? "bg-transparent" : "bg-primary/[0.02]")}>
              {r.map((cell: any, j: number) => (
                <td key={j} className="px-4 py-[13px] text-[13px] text-foreground">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const PageHeader = ({ title, subtitle, children }: any) => (
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
    <div>
      <h1 className="text-[26px] font-extrabold tracking-tight text-foreground" style={{ letterSpacing: "-.3px" }}>{title}</h1>
      {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

export const Avatar = ({ name, color, size }: any) => {
  const s = size || 32;
  const colors = ["var(--color-primary)", "var(--color-success)", "#ec4899", "var(--color-warning)", "var(--color-accent-foreground)"];
  const bg = color || colors[(name || "U").charCodeAt(0) % colors.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: s, height: s,
        background: `linear-gradient(135deg, ${bg}, ${bg}dd)`,
        fontSize: Math.max(10, s * .38),
        boxShadow: `0 0 0 2px ${bg}22`,
      }}
    >
      {(name || "U")[0].toUpperCase()}
    </div>
  );
};

export const Modal = ({ open, onClose, title, children, wide }: any) => (
  <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose?.()}>
    <DialogContent className={cn(wide && "max-w-[600px]")}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      {children}
    </DialogContent>
  </Dialog>
);

export const InputField = ({ label, value, onChange, placeholder, type, icon, readOnly, rows }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; icon?: React.ReactNode; readOnly?: boolean; rows?: number }) => (
  <div className="mb-3.5">
    {label && <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>}
    <div className="relative">
      {icon && (
        <div className="absolute left-[11px] text-muted-foreground/60" style={{ top: rows ? 12 : "50%", transform: rows ? "none" : "translateY(-50%)" }}>
          {icon}
        </div>
      )}
      {rows ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full resize-y rounded-lg border border-border bg-muted px-3 py-[9px] text-[13px] text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30"
          style={{ paddingLeft: icon ? 30 : 12 }}
        />
      ) : (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          type={type || "text"}
          readOnly={readOnly}
          className={cn("rounded-lg text-[13px] bg-muted border-border", icon && "pl-[30px]")}
          style={{ opacity: readOnly ? .6 : 1 }}
        />
      )}
    </div>
  </div>
);
