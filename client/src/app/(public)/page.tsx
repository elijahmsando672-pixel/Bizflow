"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check, Receipt, Box,
  Users, HeadphonesIcon, Sparkles, GitBranch,
  CreditCard, ShoppingCart, MessageSquare,
  Wallet, FileText, ChevronRight, ArrowRight, Star,
  Play, ArrowUpRight, Zap,
  BarChart3, Shield, TrendingUp,
  Quote, Layers, Palette, Briefcase,
} from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { useCountUp } from "@/hooks/useCountUp";

const features = [
  {
    icon: Receipt, title: "Point of Sale", desc: "Fast, intuitive POS with receipt printing, barcode scanning, and multiple payment methods.",
    color: "from-cyan-500 to-teal-500",
  },
  {
    icon: Box, title: "Inventory Management", desc: "Track stock levels, set reorder alerts, manage variants, and move stock between branches.",
    color: "from-teal-500 to-emerald-500",
  },
  {
    icon: ShoppingCart, title: "Sales & Orders", desc: "Create sales, manage orders, generate invoices, and accept payments in one click.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Users, title: "Customer Management", desc: "Build a customer database, track purchase history, and send targeted communications.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: BarChart3, title: "Analytics & Reports", desc: "Real-time dashboards, profit/loss statements, sales reports, and cash flow analysis.",
    color: "from-rose-500 to-red-500",
  },
  {
    icon: Briefcase, title: "Team & Payroll", desc: "Manage employees, track attendance, process payroll, and assign roles with permissions.",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: MessageSquare, title: "CRM & Pipeline", desc: "Manage leads, track deals through pipeline stages, and convert opportunities into sales.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: CreditCard, title: "Debtors & Creditors", desc: "Track money owed to and by your business with automated payment reminders.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: GitBranch, title: "Multi-Branch Support", desc: "Manage multiple shops, transfer stock between locations, and view consolidated reports.",
    color: "from-teal-500 to-emerald-500",
  },
  {
    icon: Wallet, title: "Expense Tracking", desc: "Record and categorize expenses, manage budgets, and track spending patterns.",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: FileText, title: "Projects & Tasks", desc: "Create projects, assign tasks, track time, and monitor team productivity.",
    color: "from-cyan-500 to-sky-500",
  },
  {
    icon: HeadphonesIcon, title: "Support Tickets", desc: "Manage customer inquiries with ticket system, SLA tracking, and reply management.",
    color: "from-amber-500 to-yellow-500",
  },
];

const plans = [
  {
    name: "Starter", price: "Ksh 2,500", popular: false, cta: "Start Free Trial",
    href: "/register",
    features: ["Up to 500 transactions/mo", "Single branch", "Basic reports", "Email support"],
  },
  {
    name: "Professional", price: "Ksh 5,500", popular: true, cta: "Start Free Trial",
    href: "/register",
    features: ["Unlimited transactions", "Up to 3 branches", "Advanced analytics", "Priority support", "CRM access", "Team management"],
  },
  {
    name: "Enterprise", price: "Custom", popular: false, cta: "Contact Sales",
    href: "/register",
    features: ["Everything in Professional", "Unlimited branches", "Custom integrations", "Dedicated account manager", "API access", "On-premise option"],
  },
];

const statData = [
  { value: 10000, suffix: "+", label: "Transactions Processed" },
  { value: 500, suffix: "+", label: "Businesses Served" },
  { value: 999, suffix: "%", label: "System Uptime", divider: 10 },
  { value: 247, suffix: "", label: "Customer Support", prefix: "24/" },
];

const testimonials = [
  { name: "James Mwangi", role: "Retail Store Owner", text: "BizFlow transformed how I manage my shop. Inventory tracking and sales reports have saved me hours every week. The multi-branch feature is a game-changer.", rating: 5 },
  { name: "Sarah Wanjiku", role: "Restaurant Manager", text: "We switched from spreadsheets to BizFlow and it's been incredible. The POS is fast, expenses are tracked, and payroll is automated. Highly recommended!", rating: 5 },
  { name: "David Omondi", role: "Wholesale Distributor", text: "Managing debtors used to be a nightmare. Now I get automatic reminders and can see who owes what at a glance. Crystal clear reports.", rating: 5 },
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

function StatItem({ stat: s }: { stat: (typeof statData)[0] }) {
  const { ref, inView } = useInView();
  const rawCount = useCountUp(s.divider ? Math.round(s.value / s.divider) : s.value, 2000, inView);
  let display: string;
  if (s.divider) {
    display = `${(rawCount / 10).toFixed(1)}${s.suffix}`;
  } else if (s.prefix) {
    display = `${s.prefix}${rawCount}${s.suffix}`;
  } else {
    display = `${rawCount.toLocaleString()}${s.suffix}`;
  }
  return (
    <div ref={ref} className="text-center">
      <div className="text-[36px] sm:text-[44px] font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
        {inView ? display : "0"}
      </div>
      <p className="text-gray-400 text-sm mt-1">{s.label}</p>
    </div>
  );
}

function FeatureCard({ f, i }: { f: typeof features[0]; i: number }) {
  const Icon = f.icon;
  return (
    <AnimatedSection delay={i * 60}>
      <div className="group relative bg-gray-800/80 p-6 sm:p-7 rounded-2xl border border-gray-700/60 shadow-sm hover:shadow-lg hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1 hover:bg-gray-800">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} p-[1px] mb-4`}>
          <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center">
            <Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
      </div>
    </AnimatedSection>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 lg:pt-28 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-gray-950 to-teal-950/30" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="max-w-7xl mx-auto px-5 lg:px-8 relative w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <AnimatedSection>
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-400 tracking-wide uppercase">
                  <Zap className="h-3.5 w-3.5" />
                  All-in-One Business Platform
                </span>
                <h1 className="text-[40px] sm:text-[52px] lg:text-[62px] font-bold leading-[1.05] tracking-tight text-white">
                  Run Your Entire Business From{" "}
                  <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">One Platform</span>
                </h1>
                <p className="text-base sm:text-lg text-gray-400 max-w-lg leading-relaxed">
                  POS, Inventory, CRM, Team Management, Analytics, and Multi-Branch Support — everything you need to grow your business.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-7 py-3.5 text-sm font-semibold text-white hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-600/25 hover:shadow-cyan-500/35 hover:-translate-y-0.5"
                  >
                    Start Free Trial <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 px-7 py-3.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
                  >
                    Sign In <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Check className="h-3.5 w-3.5 text-teal-400" strokeWidth={2.5} /> No credit card
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Check className="h-3.5 w-3.5 text-teal-400" strokeWidth={2.5} /> 14-day free trial
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Check className="h-3.5 w-3.5 text-teal-400" strokeWidth={2.5} /> Cancel anytime
                  </span>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <div className="hidden lg:block relative">
                <div className="relative rounded-2xl border border-gray-700/60 bg-gradient-to-br from-gray-800 via-gray-800/90 to-gray-800/80 shadow-2xl overflow-hidden">
                  <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/30">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="ml-3 text-[11px] text-gray-500 font-mono">bizflow.app — Dashboard</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Revenue", value: "KSh 845,000", color: "text-cyan-400" },
                        { label: "Orders", value: "1,234", color: "text-teal-400" },
                        { label: "Growth", value: "+89%", color: "text-emerald-400" },
                      ].map(s => (
                        <div key={s.label} className="bg-gray-900/50 rounded-xl p-3.5 border border-gray-700/40">
                          <div className="text-[11px] text-gray-500 mb-0.5">{s.label}</div>
                          <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-3.5 border border-gray-700/40">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Recent Sales</span>
                        <span className="text-[11px] text-cyan-400 font-medium">View all →</span>
                      </div>
                      {[
                        { name: "Jane M.", amount: "KSh 12,500", color: "text-teal-400" },
                        { name: "Peter K.", amount: "KSh 8,200", color: "text-teal-400" },
                        { name: "Alice W.", amount: "KSh 15,000", color: "text-teal-400" },
                      ].map(s => (
                        <div key={s.name} className="flex items-center justify-between py-2 border-b border-gray-700/40 last:border-0">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white">
                              {s.name[0]}
                            </div>
                            <span className="text-sm text-gray-200">{s.name}</span>
                          </div>
                          <span className={`text-sm font-semibold ${s.color}`}>{s.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-3 -right-3 w-28 h-28 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute -top-3 -left-3 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl" />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-900/50 border-y border-gray-800/60">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {statData.map(s => (
              <StatItem key={s.label} stat={s} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-5 lg:px-8 py-20 lg:py-28">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-400 tracking-wide uppercase mb-5">
            <Layers className="h-3.5 w-3.5" />
            Powerful Features
          </span>
          <h2 className="text-[30px] sm:text-[38px] font-bold text-white mb-4 tracking-tight">Everything You Need to Run Your Business</h2>
          <p className="text-gray-400 text-base leading-relaxed">From point of sale to advanced analytics — BizFlow gives you everything to manage, grow, and scale your business.</p>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} f={f} i={i} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-900/50 border-y border-gray-800/60">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-20 lg:py-28">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-400 tracking-wide uppercase mb-5">
              <Play className="h-3.5 w-3.5" />
              How It Works
            </span>
            <h2 className="text-[30px] sm:text-[38px] font-bold text-white mb-4 tracking-tight">Get Started in Minutes</h2>
            <p className="text-gray-400 text-base leading-relaxed">Three simple steps to transform your business operations.</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: "01", title: "Create Your Account", desc: "Sign up free with your email. No credit card required. Start your 14-day trial instantly.", icon: Shield, color: "from-cyan-500 to-blue-600" },
              { step: "02", title: "Set Up Your Business", desc: "Add your products, customers, and team members. Customize settings to match your workflow.", icon: Palette, color: "from-purple-500 to-pink-500" },
              { step: "03", title: "Start Selling & Growing", desc: "Process sales, manage inventory, track expenses, and watch your business thrive.", icon: TrendingUp, color: "from-teal-500 to-emerald-500" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <AnimatedSection key={s.step} delay={i * 150}>
                  <div className="text-center group">
                    <div className="relative mb-6 inline-flex">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[11px] font-bold text-gray-400">
                        {s.step}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2.5">{s.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-7xl mx-auto px-5 lg:px-8 py-20 lg:py-28">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-400 tracking-wide uppercase mb-5">
            <Star className="h-3.5 w-3.5" />
            Testimonials
          </span>
          <h2 className="text-[30px] sm:text-[38px] font-bold text-white mb-4 tracking-tight">Trusted by Business Owners</h2>
          <p className="text-gray-400 text-base leading-relaxed">Hear from the entrepreneurs who transformed their operations with BizFlow.</p>
        </AnimatedSection>
        <div className="relative max-w-2xl mx-auto">
          <Quote className="absolute -top-8 -left-4 h-14 w-14 text-cyan-500/10" strokeWidth={1} />
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`transition-all duration-500 ${
                i === activeTestimonial ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
              }`}
            >
              {i === activeTestimonial && (
                <div className="bg-gray-800/80 border border-gray-700/60 rounded-2xl p-8 shadow-sm">
                  <div className="flex gap-1 mb-5">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3.5 pt-2 border-t border-gray-700/50">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${["from-cyan-500 to-blue-600", "from-purple-500 to-pink-500", "from-teal-500 to-emerald-500"][i]} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white">{t.name}</div>
                      <div className="text-xs text-gray-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeTestimonial ? "bg-cyan-500 w-8" : "bg-gray-700 w-2 hover:bg-gray-600"
                }`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-900/50 border-y border-gray-800/60">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-20 lg:py-28">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-400 tracking-wide uppercase mb-5">
              <CreditCard className="h-3.5 w-3.5" />
              Pricing
            </span>
            <h2 className="text-[30px] sm:text-[38px] font-bold text-white mb-4 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-gray-400 text-base leading-relaxed">Choose the plan that fits your business. All plans include a 14-day free trial.</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <AnimatedSection key={plan.name} delay={i * 100}>
                <div
                  className={`relative bg-gray-800/80 p-7 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular
                      ? "border-cyan-500/50 shadow-xl shadow-cyan-500/10 scale-[1.02] md:scale-105 bg-gray-800"
                      : "border-gray-700/60 shadow-sm hover:shadow-md"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                      <Sparkles className="h-3 w-3 inline mr-1" />Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-white mb-0.5">{plan.name}</h3>
                  <div className={`text-[38px] font-bold my-4 ${plan.popular ? "text-cyan-400" : "text-white"}`}>
                    {plan.price}
                  </div>
                  <p className="text-xs text-gray-500 mb-6">{plan.name === "Enterprise" ? "Custom pricing" : "per month"}</p>
                  <Link
                    href={plan.href}
                    className={`block w-full text-center rounded-xl py-3 text-sm font-semibold transition-all ${
                      plan.popular
                        ? "bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-600/25"
                        : "border border-gray-700 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm text-gray-400">
                        <Check className="h-4 w-4 text-teal-400 flex-shrink-0" strokeWidth={2.5} /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-5 lg:px-8 my-20 lg:my-28">
          <div className="relative rounded-3xl bg-gradient-to-br from-cyan-600 via-cyan-600/90 to-teal-700 p-10 sm:p-14 lg:p-20 overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">Ready to Transform Your Business?</h2>
                <p className="text-base sm:text-lg text-cyan-200/80 max-w-xl">Join hundreds of businesses already using BizFlow to manage, grow, and succeed.</p>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-cyan-700 hover:bg-gray-100 transition-all shadow-xl whitespace-nowrap flex-shrink-0 hover:-translate-y-0.5"
              >
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </>
  );
}
