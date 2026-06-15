"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check, Menu, X, Receipt, ChartLine, Box, ArrowLeftRight, Building2,
  Users, Shield, TrendingUp, HeadphonesIcon, Sparkles, GitBranch,
  Globe, Clock, CreditCard, ShoppingCart, BarChart3, MessageSquare,
  Truck, Wallet, FileText, Settings, ChevronRight, ArrowRight, Star, Quote,
  Play, ArrowUpRight, Zap, Layers, Lock, Smartphone
} from "lucide-react";

const features = [
  { icon: Receipt, title: "Point of Sale", desc: "Fast, intuitive POS with receipt printing, barcode scanning, and multiple payment methods." },
  { icon: Box, title: "Inventory Management", desc: "Track stock levels, set reorder alerts, manage variants, and move stock between branches." },
  { icon: ShoppingCart, title: "Sales & Orders", desc: "Create sales, manage orders, generate invoices, and accept payments in one click." },
  { icon: Users, title: "Customer Management", desc: "Build a customer database, track purchase history, and send targeted communications." },
  { icon: ChartLine, title: "Analytics & Reports", desc: "Real-time dashboards, profit/loss statements, sales reports, and cash flow analysis." },
  { icon: Users, title: "Team & Payroll", desc: "Manage employees, track attendance, process payroll, and assign roles with permissions." },
  { icon: MessageSquare, title: "CRM & Pipeline", desc: "Manage leads, track deals through pipeline stages, and convert opportunities into sales." },
  { icon: CreditCard, title: "Debtors & Creditors", desc: "Track money owed to and by your business with automated payment reminders." },
  { icon: GitBranch, title: "Multi-Branch Support", desc: "Manage multiple shops, transfer stock between locations, and view consolidated reports." },
  { icon: Wallet, title: "Expense Tracking", desc: "Record and categorize expenses, manage budgets, and track spending patterns." },
  { icon: FileText, title: "Projects & Tasks", desc: "Create projects, assign tasks, track time, and monitor team productivity." },
  { icon: HeadphonesIcon, title: "Support Tickets", desc: "Manage customer inquiries with ticket system, SLA tracking, and reply management." },
];

const plans = [
  { name: "Starter", price: "Ksh 2,500", popular: false, cta: "Start Free Trial", href: "/register", features: ["Up to 500 transactions/mo", "Single branch", "Basic reports", "Email support"] },
  { name: "Professional", price: "Ksh 5,500", popular: true, cta: "Start Free Trial", href: "/register", features: ["Unlimited transactions", "Up to 3 branches", "Advanced analytics", "Priority support", "CRM access", "Team management"] },
  { name: "Enterprise", price: "Custom", popular: false, cta: "Contact Sales", href: "/register", features: ["Everything in Pro", "Unlimited branches", "Custom integrations", "Dedicated account manager", "API access", "On-premise option"] },
];

const stats = [
  { value: "10,000+", label: "Transactions Processed" },
  { value: "500+", label: "Businesses Served" },
  { value: "99.9%", label: "System Uptime" },
  { value: "24/7", label: "Customer Support" },
];

const testimonials = [
  { name: "James Mwangi", role: "Retail Store Owner", text: "BizFlow transformed how I manage my shop. Inventory tracking and sales reports have saved me hours every week. The multi-branch feature is a game-changer.", rating: 5 },
  { name: "Sarah Wanjiku", role: "Restaurant Manager", text: "We switched from spreadsheets to BizFlow and it's been incredible. The POS is fast, expenses are tracked, and payroll is automated. Highly recommended!", rating: 5 },
  { name: "David Omondi", role: "Wholesale Distributor", text: "Managing debtors used to be a nightmare. Now I get automatic reminders and can see who owes what at a glance. Crystal clear reports.", rating: 5 },
];

export default function LandingPage() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [imgError] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Testimonials" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#111827] overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-lg shadow-[0_1px_10px_rgba(0,0,0,0.06)]" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2.5 text-2xl font-bold text-[#2563eb]">
            <Building2 className="h-7 w-7" />
            <span>BizFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="text-[#4b5563] hover:text-[#2563eb] font-medium transition-colors">{l.label}</a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="rounded-xl border border-[#e5e7eb] px-5 py-2.5 text-sm font-medium text-[#374151] hover:bg-gray-50 transition-all">Sign In</Link>
            <Link href="/register" className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-all shadow-lg shadow-blue-500/25">Get Started</Link>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100" aria-label="Toggle menu">
            {mobileOpen ? <X className="h-6 w-6 text-gray-600" /> : <Menu className="h-6 w-6 text-gray-600" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-5 py-6 shadow-lg">
            <nav className="flex flex-col gap-4">
              {navLinks.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="py-2 text-[#374151] font-medium hover:text-[#2563eb] transition-colors">{l.label}</a>
              ))}
              <hr className="border-gray-100 my-2" />
              <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center rounded-xl border border-[#e5e7eb] px-5 py-2.5 text-sm font-medium text-[#374151]">Sign In</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="text-center rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-medium text-white">Get Started</Link>
            </nav>
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-5 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-[fadeInUp_0.6s_ease-out]">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-[#2563eb] mb-6">
                <Zap className="h-4 w-4" />
                All-in-One Business Management Platform
              </span>
              <h1 className="text-[42px] sm:text-[56px] lg:text-[64px] font-bold leading-[1.08] mb-6 tracking-tight">
                Run Your Entire Business From{" "}
                <span className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] bg-clip-text text-transparent">One Platform</span>
              </h1>
              <p className="text-lg sm:text-xl text-[#6b7280] mb-8 max-w-xl leading-relaxed">
                POS, Inventory, CRM, Team Management, Analytics, and Multi-Branch Support — everything you need to grow your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-8 py-4 text-base font-semibold text-white hover:bg-[#1d4ed8] transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5">
                  Start Free Trial <ArrowUpRight className="h-5 w-5" />
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#2563eb] px-8 py-4 text-base font-semibold text-[#2563eb] hover:bg-blue-50 transition-all">
                  Sign In <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-[#6b7280]">
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> No credit card</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> 14-day free trial</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Cancel anytime</span>
              </div>
            </div>
            <div className="hidden lg:block animate-[fadeInUp_0.8s_ease-out]">
              {imgError ? (
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-100 via-blue-50 to-purple-50 flex items-center justify-center shadow-2xl border border-white/50">
                  <div className="text-center p-8">
                    <Building2 className="h-20 w-20 mx-auto mb-4 text-blue-300" />
                    <p className="text-lg font-medium text-gray-500">Dashboard Preview</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-100 via-blue-50 to-purple-50 shadow-2xl border border-white/50 overflow-hidden">
                    <div className="p-6">
                      <div className="flex gap-2 mb-6">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {[["KSh 845,000", "Revenue"], ["1,234", "Orders"], ["89%", "Growth"]].map(([v, l]) => (
                          <div key={l} className="bg-white/80 rounded-xl p-4 shadow-sm">
                            <div className="text-xl font-bold text-[#111827]">{v}</div>
                            <div className="text-xs text-[#6b7280] mt-1">{l}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between mb-3">
                          <span className="text-sm font-medium text-[#6b7280]">Recent Sales</span>
                          <span className="text-xs text-[#2563eb]">View all →</span>
                        </div>
                        {[["Jane M.", "KSh 12,500"], ["Peter K.", "KSh 8,200"], ["Alice W.", "KSh 15,000"]].map(([n, a]) => (
                          <div key={n} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                            <span className="text-sm font-medium">{n}</span>
                            <span className="text-sm font-semibold text-green-600">{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <h2 className="text-[36px] sm:text-[44px] font-bold bg-gradient-to-r from-[#2563eb] to-[#7c3aed] bg-clip-text text-transparent">{s.value}</h2>
                <p className="text-[#6b7280] text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="max-w-7xl mx-auto px-5 lg:px-8 py-24 lg:py-32">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 mb-4">
            <Layers className="h-4 w-4" />
            Everything You Need
          </span>
          <h2 className="text-[32px] sm:text-[42px] font-bold mb-4 tracking-tight">Powerful Features for Modern Businesses</h2>
          <p className="text-[#6b7280] text-lg max-w-2xl mx-auto">From point of sale to advanced analytics — BizFlow gives you everything to manage, grow, and scale your business.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="group bg-white p-7 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-blue-100">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                  <Icon className="h-6 w-6 text-[#2563eb]" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-[#6b7280] text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24 lg:py-32">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 mb-4">
              <Play className="h-4 w-4" />
              How It Works
            </span>
            <h2 className="text-[32px] sm:text-[42px] font-bold mb-4 tracking-tight">Get Started in Minutes</h2>
            <p className="text-[#6b7280] text-lg max-w-2xl mx-auto">Three simple steps to transform your business operations.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Create Your Account", desc: "Sign up free with your email. No credit card required. Start your 14-day trial instantly.", color: "bg-blue-100 text-[#2563eb]" },
              { step: "02", title: "Set Up Your Business", desc: "Add your products, customers, and team members. Customize settings to match your workflow.", color: "bg-purple-100 text-purple-700" },
              { step: "03", title: "Start Selling & Growing", desc: "Process sales, manage inventory, track expenses, and watch your business thrive.", color: "bg-green-100 text-green-700" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className={`w-16 h-16 rounded-2xl ${s.color} flex items-center justify-center mx-auto mb-6 text-2xl font-bold`}>{s.step}</div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-[#6b7280] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="max-w-7xl mx-auto px-5 lg:px-8 py-24 lg:py-32">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700 mb-4">
            <Star className="h-4 w-4" />
            Testimonials
          </span>
          <h2 className="text-[32px] sm:text-[42px] font-bold mb-4 tracking-tight">Trusted by Business Owners</h2>
          <p className="text-[#6b7280] text-lg max-w-2xl mx-auto">Hear from the entrepreneurs who transformed their operations with BizFlow.</p>
        </div>
        <div className="relative max-w-3xl mx-auto">
          <Quote className="absolute -top-6 -left-2 h-12 w-12 text-blue-200" />
          {testimonials.map((t, i) => (
            <div key={i} className={`transition-all duration-500 ${i === activeTestimonial ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"}`}>
              {i === activeTestimonial && (
                <div>
                  <p className="text-lg sm:text-xl text-[#374151] leading-relaxed mb-8 italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2563eb] to-purple-600 flex items-center justify-center text-white font-bold text-lg">{t.name[0]}</div>
                    <div>
                      <div className="font-bold text-[#111827]">{t.name}</div>
                      <div className="text-sm text-[#6b7280]">{t.role}</div>
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(t.rating)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-center gap-2 mt-10">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeTestimonial ? "bg-[#2563eb] w-8" : "bg-gray-300 hover:bg-gray-400"}`} aria-label={`Testimonial ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24 lg:py-32">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-[#2563eb] mb-4">
              <CreditCard className="h-4 w-4" />
              Pricing
            </span>
            <h2 className="text-[32px] sm:text-[42px] font-bold mb-4 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-[#6b7280] text-lg max-w-2xl mx-auto">Choose the plan that fits your business. All plans include a 14-day free trial.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`bg-white p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${plan.popular ? "border-[#2563eb] shadow-[0_8px_40px_rgba(37,99,235,0.15)] scale-[1.02] md:scale-105 relative" : "border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563eb] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <h1 className={`text-[40px] font-bold my-4 ${plan.popular ? "text-[#2563eb]" : "text-[#111827]"}`}>{plan.price}</h1>
                <p className="text-sm text-[#6b7280] mb-6">{plan.name === "Enterprise" ? "Custom pricing" : "per month"}</p>
                <Link href={plan.href} className={`block w-full text-center rounded-xl py-3.5 text-sm font-semibold transition-all ${plan.popular ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/25" : "border-2 border-[#2563eb] text-[#2563eb] hover:bg-blue-50"}`}>{plan.cta}</Link>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-[#374151]">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 my-24">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#7c3aed] p-12 lg:p-20 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">Ready to Transform Your Business?</h2>
              <p className="text-lg text-blue-200 max-w-xl">Join hundreds of businesses already using BizFlow to manage, grow, and succeed.</p>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-[#2563eb] hover:bg-blue-50 transition-all shadow-xl whitespace-nowrap flex-shrink-0">
              Start Free Trial <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0f172a] text-white">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 text-2xl font-bold mb-4">
                <Building2 className="h-7 w-7 text-[#2563eb]" />
                <span>BizFlow</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">Modern business management software built for African entrepreneurs.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Integrations", "API"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Support", links: ["Help Center", "Documentation", "Status", "Community"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l}><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} BizFlow. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
