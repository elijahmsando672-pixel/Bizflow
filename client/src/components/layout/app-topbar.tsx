"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LifeBuoy, Menu, Moon, Search, Sun } from "lucide-react";
import { buildBreadcrumbs } from "@/lib/navigation";
import { useTheme } from "@/lib/theme-provider";
import { IconButton } from "@/components/ui/tooltip";
import { NotificationsMenu } from "@/components/layout/app-notifications";
import { UserMenu } from "@/components/layout/app-user-menu";
import {
  LocationSwitcher,
  LocationSwitcherMobile,
} from "@/components/layout/app-location-switcher";
import { cn } from "@/lib/utils";

interface AppTopbarProps {
  onOpenMobileNav: () => void;
  onOpenCommand: () => void;
}

export function AppTopbar({ onOpenMobileNav, onOpenCommand }: AppTopbarProps) {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const crumbs = buildBreadcrumbs(pathname);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenCommand();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenCommand]);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/90 px-3 backdrop-blur lg:px-5">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1 text-sm md:flex">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden /> : null}
              {crumb.href && !isLast ? (
                <button
                  type="button"
                  onClick={() => router.push(crumb.href!)}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={cn("truncate", isLast ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex flex-1 items-center justify-end gap-1.5 md:flex-none md:justify-start">
        <p className="truncate text-sm font-medium text-foreground md:hidden">
          {crumbs[crumbs.length - 1]?.label}
        </p>
        <div className="md:hidden">
          <LocationSwitcherMobile />
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenCommand}
        className="ml-auto hidden h-9 w-56 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60 lg:flex"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate">Search…</span>
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px]">Ctrl K</kbd>
      </button>
      <IconButton label="Search" className="lg:hidden" onClick={onOpenCommand}>
        <Search className="h-[18px] w-[18px]" aria-hidden />
      </IconButton>

      <div className="hidden lg:block">
        <LocationSwitcher />
      </div>

      <span className="mx-1 hidden h-6 w-px bg-border lg:block" aria-hidden />

      <IconButton label="Help and support" onClick={() => router.push("/contact")}>
        <LifeBuoy className="h-[18px] w-[18px]" aria-hidden />
      </IconButton>

      <IconButton
        label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={toggleTheme}
      >
        {theme === "dark" ? <Sun className="h-[18px] w-[18px]" aria-hidden /> : <Moon className="h-[18px] w-[18px]" aria-hidden />}
      </IconButton>

      <NotificationsMenu />
      <UserMenu />
    </header>
  );
}
