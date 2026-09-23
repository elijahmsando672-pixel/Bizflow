"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/modules/sidebar";
import { TopBar } from "@/components/modules/top-bar";
import { CommandK } from "@/components/modules/command-k";
import { QuickActionSlideOver } from "@/components/modules/quick-action-slide-over";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((o) => !o);
      } else if (event.key === "Escape") {
        setCommandOpen(false);
        setQuickOpen(false);
        setMobileNavOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-sidebar transition-[width] duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} />
      </aside>

      <AnimatePresence>
        {mobileNavOpen ? (
          <>
            <motion.div
              key="mobile-backdrop"
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              key="mobile-aside"
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-sidebar lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              <Sidebar mobile onNavigate={() => setMobileNavOpen(false)} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} onOpenCommand={() => setCommandOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
        <footer className="hidden shrink-0 items-center justify-between border-t border-border px-6 py-3 text-xs text-muted-foreground md:flex">
          <span>© 2026 BizFlow · EmohTech Solutions</span>
          <span>v1.0.0</span>
        </footer>
      </div>

      <button
        type="button"
        onClick={() => setQuickOpen(true)}
        aria-label="Open quick actions"
        className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-5 w-5" />
      </button>

      <CommandK open={commandOpen} onClose={() => setCommandOpen(false)} />
      <QuickActionSlideOver open={quickOpen} onOpenChange={setQuickOpen} />
    </div>
  );
}