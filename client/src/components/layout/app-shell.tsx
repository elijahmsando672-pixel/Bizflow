"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import AuthGuard from "@/components/auth/AuthGuard";
import IdleWarning from "@/components/auth/IdleWarning";
import { AppSidebar, useSidebarCollapsed } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { CommandMenu } from "@/components/layout/app-command-menu";
import { cn } from "@/lib/utils";

const SIDEBAR_WIDTH = 264;
const SIDEBAR_WIDTH_COLLAPSED = 72;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/dashboard";
  const { collapsed, toggle } = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <AuthGuard>
      <IdleWarning />
      <div className="flex h-dvh overflow-hidden bg-background">
        <aside
          className={cn(
            "hidden shrink-0 border-r border-border transition-[width] duration-200 lg:block",
            collapsed ? "w-[72px]" : "w-[264px]"
          )}
          style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }}
        >
          <AppSidebar collapsed={collapsed} onToggleCollapsed={toggle} />
        </aside>

        <AnimatePresence>
          {mobileOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
                aria-hidden
              />
              <motion.aside
                initial={{ x: -SIDEBAR_WIDTH }}
                animate={{ x: 0 }}
                exit={{ x: -SIDEBAR_WIDTH }}
                transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 w-[264px] border-r border-border shadow-modal"
              >
                <AppSidebar
                  collapsed={false}
                  onToggleCollapsed={toggle}
                  onNavigate={() => setMobileOpen(false)}
                  variant="mobile"
                />
              </motion.aside>
            </div>
          ) : null}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar onOpenMobileNav={() => setMobileOpen(true)} onOpenCommand={() => setCommandOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <div
              key={pathname}
              className="page-enter mx-auto w-full max-w-[1536px] px-4 py-5 lg:px-6 lg:py-6"
            >
              {children}
              <footer className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                BizFlow · {new Date().getFullYear()}
              </footer>
            </div>
          </main>
        </div>
      </div>

      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </AuthGuard>
  );
}
