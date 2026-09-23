"use client";

import { useRouter } from "next/navigation";
import {
  CheckSquare,
  FolderPlus,
  ReceiptText,
  UserPlus,
  UserRoundCog,
  BarChart3,
  X,
  Command,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface QuickActionSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuickAction {
  id: string;
  label: string;
  hint: string;
  href: string;
  icon: typeof FolderPlus;
}

const quickActions: QuickAction[] = [
  { id: "project", label: "New Project", hint: "Create a project with milestones", href: "/modules/projects", icon: FolderPlus },
  { id: "task", label: "New Task", hint: "Add a task to a project", href: "/modules/tasks", icon: CheckSquare },
  { id: "client", label: "New Client", hint: "Add a client record", href: "/modules/clients", icon: UserPlus },
  { id: "invoice", label: "New Invoice", hint: "Bill a client in minutes", href: "/modules/invoices", icon: ReceiptText },
  { id: "report", label: "New Report", hint: "Export insights on demand", href: "/modules/reports", icon: BarChart3 },
  { id: "team", label: "Invite Team", hint: "Grow your workspace", href: "/modules/team", icon: UserRoundCog },
];

export function QuickActionSlideOver({ open, onOpenChange }: QuickActionSlideOverProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-40">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.aside
            className="absolute inset-y-0 right-0 flex w-[min(400px,100%)] flex-col border-l border-border bg-card shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Jump straight into creating something.</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
                aria-label="Close quick actions"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      router.push(action.href);
                    }}
                    className="flex flex-col items-start gap-3 rounded-lg border border-border bg-background p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <action.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-foreground">{action.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{action.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border px-5 py-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Command className="h-3.5 w-3.5" />
                Tip: press <kbd className="rounded border border-border bg-muted px-1 font-mono">⌘K</kbd> to search across your workspace.
              </p>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}