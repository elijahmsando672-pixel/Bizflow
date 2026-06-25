"use client";

import { Receipt, Box, ShoppingCart, Users, HeadphonesIcon, FileText, BarChart3, Shield, Layers, Wallet, MessageSquare, GitBranch } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const features = [
  {
    icon: Receipt, title: "Point of Sale", desc: "Fast, intuitive POS with receipt printing, barcode scanning, and multiple payment methods.",
    gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    icon: Box, title: "Inventory Management", desc: "Track stock levels, set reorder alerts, manage variants, and move stock between branches.",
    gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    icon: ShoppingCart, title: "Sales & Orders", desc: "Create sales, manage orders, generate invoices, and accept payments in one click.",
    gradient: "from-purple-500 to-pink-500", bg: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    icon: Users, title: "Customer Management", desc: "Maintain customer profiles, track purchase history, manage loyalty programs, and send SMS.",
    gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    icon: Wallet, title: "Expense Tracking", desc: "Log expenses, categorize spending, attach receipts, and view detailed expense reports.",
    gradient: "from-rose-500 to-pink-500", bg: "bg-rose-50 dark:bg-rose-950/30",
  },
  {
    icon: BarChart3, title: "Analytics & Reports", desc: "Real-time dashboards with revenue charts, sales trends, inventory reports, and tax summaries.",
    gradient: "from-indigo-500 to-purple-500", bg: "bg-indigo-50 dark:bg-indigo-950/30",
  },
  {
    icon: MessageSquare, title: "Customer Communication", desc: "Send automated SMS alerts, payment reminders, and promotional messages to customers.",
    gradient: "from-green-500 to-emerald-500", bg: "bg-green-50 dark:bg-green-950/30",
  },
  {
    icon: GitBranch, title: "Multi-Branch Support", desc: "Manage multiple locations from a single dashboard with centralized reporting and control.",
    gradient: "from-cyan-500 to-sky-500", bg: "bg-cyan-50 dark:bg-cyan-950/30",
  },
  {
    icon: Shield, title: "Role-Based Access", desc: "Set permissions for staff, assign roles, and control what each team member can access.",
    gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    icon: FileText, title: "Invoicing & Billing", desc: "Generate professional invoices, manage recurring billing, and track payment status.",
    gradient: "from-sky-500 to-blue-500", bg: "bg-sky-50 dark:bg-sky-950/30",
  },
  {
    icon: Layers, title: "Stock Transfers", desc: "Transfer stock between branches, track inter-branch movements, and reconcile inventory.",
    gradient: "from-teal-500 to-cyan-500", bg: "bg-teal-50 dark:bg-teal-950/30",
  },
  {
    icon: HeadphonesIcon, title: "Support & Help Desk", desc: "Built-in help center, ticket system, and priority support for all paid plans.",
    gradient: "from-orange-500 to-amber-500", bg: "bg-orange-50 dark:bg-orange-950/30",
  },
];

function AnimatedSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className || ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <section className="pt-32 pb-20 lg:pb-28">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary tracking-wide uppercase mb-5">
            Features
          </span>
          <h1 className="text-[30px] sm:text-[38px] font-bold mb-4 tracking-tight">Everything You Need to Run Your Business</h1>
          <p className="text-muted-foreground text-base leading-relaxed">A complete suite of tools designed for African entrepreneurs and growing businesses.</p>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <AnimatedSection key={f.title} delay={i * 40}>
                <div className="group relative bg-card p-6 sm:p-7 rounded-2xl border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-5.5 w-5.5 text-foreground" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-bold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
