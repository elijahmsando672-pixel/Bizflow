"use client";

import { LogOut } from "lucide-react";
import { initialsOf, roleLabelOf } from "@/lib/initials";
import { cn } from "@/lib/utils";

interface IdentityAvatarProps {
  name: string;
  className?: string;
  tone: "business" | "user";
}

/** Falls back to generated initials whenever no logo has been uploaded. */
function IdentityAvatar({ name, className, tone }: IdentityAvatarProps) {
  const initials = initialsOf(name);

  if (tone === "business") {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4dd0e1_0%,#3f7de0_100%)] text-sm font-bold text-white shadow-sm",
          className
        )}
        aria-hidden
      >
        {initials}
      </span>
    );
  }

  return (
    <span
      className={cn("bw-chip flex shrink-0 items-center justify-center rounded-full text-[11px] font-bold", className)}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function BusinessLogo({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  if (!logoUrl) return <IdentityAvatar tone="business" name={name} className="h-11 w-11" />;

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/80 shadow-sm">
      <img src={logoUrl} alt="" className="h-full w-full object-contain" />
    </span>
  );
}

interface BusinessHeaderProps {
  businessName: string;
  businessLogo: string | null;
  userName: string;
  userRole: string;
  shopName: string | null;
  onSignOut: () => void;
}

export function BusinessHeader({
  businessName,
  businessLogo,
  userName,
  userRole,
  shopName,
  onSignOut,
}: BusinessHeaderProps) {
  const roleLine = [roleLabelOf(userRole), shopName].filter(Boolean).join(" · ");

  return (
    <header className="bw-panel overflow-hidden rounded-3xl">
      <div className="flex items-center gap-3 px-4 py-3.5 min-[651px]:px-5 min-[651px]:py-4">
        <BusinessLogo logoUrl={businessLogo} name={businessName} />

        <div className="min-w-0 flex-1">
          <p className="bw-ink truncate text-sm font-bold min-[651px]:text-base">{businessName}</p>
          <p className="bw-ink-soft truncate text-[11px] min-[651px]:text-xs">Business Management</p>
        </div>

        {/* The full user identity only appears where there is room for it. */}
        {roleLine ? (
          <div className="hidden min-w-0 items-center gap-2.5 min-[651px]:flex">
            <div className="min-w-0 text-right">
              <p className="bw-ink truncate text-sm font-semibold">{userName}</p>
              <p className="bw-ink-soft truncate text-[11px]">{roleLine}</p>
            </div>
            <IdentityAvatar tone="user" name={userName} className="h-9 w-9" />
          </div>
        ) : null}

        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          className="bw-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {roleLine ? (
        <div className="flex items-center gap-2.5 border-t border-[color:var(--bw-hairline)] px-4 py-2.5 min-[651px]:hidden">
          <IdentityAvatar tone="user" name={userName} className="h-7 w-7" />
          <p className="bw-ink min-w-0 truncate text-xs font-semibold">
            {userName} &middot; {roleLine}
          </p>
        </div>
      ) : null}
    </header>
  );
}
