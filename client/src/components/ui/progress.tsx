import { cn } from "@/lib/utils";

export type ProgressTone = "primary" | "success" | "warning" | "danger" | "info";

const TONES: Record<ProgressTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
};

interface ProgressProps {
  /** 0-100. Values outside the range are clamped. */
  value: number;
  tone?: ProgressTone;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "default";
  className?: string;
}

export function Progress({
  value,
  tone = "primary",
  label,
  showValue = false,
  size = "default",
  className,
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div className={cn("w-full", className)}>
      {label || showValue ? (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
          {label ? <span className="text-muted-foreground">{label}</span> : <span />}
          {showValue ? <span className="font-medium text-foreground">{clamped.toFixed(0)}%</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1.5" : "h-2"
        )}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", TONES[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
