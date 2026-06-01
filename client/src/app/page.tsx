"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Menu, X, Receipt, ChartLine, Box, ArrowLeftRight, Building2 } from "lucide-react";

const features = [
  { icon: Receipt, title: "Point of Sale", desc: "Fast and intuitive POS." },
  { icon: ChartLine, title: "Analytics", desc: "Track profits and growth." },
  { icon: Box, title: "Inventory", desc: "Manage stock levels." },
  { icon: ArrowLeftRight, title: "Transfers", desc: "Move stock between stores." },
];

const plans = [
  { name: "Starter", price: "Ksh 2,500", popular: false, cta: "Start Free Trial", href: "/register" },
  { name: "Professional", price: "Ksh 5,500", popular: true, cta: "Start Free Trial", href: "/register" },
  { name: "Enterprise", price: "Custom", popular: false, cta: "Contact Sales", href: "/register" },
];

const stats = [
  { value: "10,000+", label: "Transactions Processed" },
  { value: "500+", label: "Businesses Served" },
  { value: "99.9%", label: "System Uptime" },
  { value: "24/7", label: "Support" },
];

export default function LandingPage() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#111827]">
      <header className="sticky top-0 z-100 flex items-center justify-between bg-white px-5 lg:px-20 py-5 shadow-[0_1px_10px_rgba(0,0,0,0.05)]">
        <Link href="/" className="flex items-center gap-2.5 text-2xl font-bold text-[#2563eb]">
          <Building2 className="h-6 w-6" />
          <span>BizFlow</span>
        </Link>
        <nav className="hidden md:flex items-center gap-[30px]">
          <a href="#features" className="text-[#374151] font-medium">Features</a>
          <a href="#benefits" className="text-[#374151] font-medium">Benefits</a>
          <a href="#pricing" className="text-[#374151] font-medium">Pricing</a>
          <a href="#contact" className="text-[#374151] font-medium">Contact</a>
        </nav>
        <div className="hidden md:flex items-center gap-[15px]">
          <Link href="/login" className="rounded-xl border border-[#ddd] bg-white px-6 py-[14px] text-sm font-medium">Sign In</Link>
          <Link href="/register" className="rounded-xl bg-[#2563eb] px-7 py-[14px] text-sm font-medium text-white">Get Started</Link>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100" aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6 text-gray-600" /> : <Menu className="h-6 w-6 text-gray-600" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-20 px-5">
          <nav className="flex flex-col gap-4">
            <a href="#features" onClick={() => setMobileOpen(false)} className="py-2 text-[#374151] font-medium">Features</a>
            <a href="#benefits" onClick={() => setMobileOpen(false)} className="py-2 text-[#374151] font-medium">Benefits</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="py-2 text-[#374151] font-medium">Pricing</a>
            <a href="#contact" onClick={() => setMobileOpen(false)} className="py-2 text-[#374151] font-medium">Contact</a>
            <hr className="my-2 border-gray-200" />
            <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-center rounded-xl border border-[#ddd] px-6 py-[14px] text-sm font-medium">Sign In</Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} className="block text-center rounded-xl bg-[#2563eb] px-7 py-[14px] text-sm font-medium text-white">Get Started</Link>
          </nav>
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-[50px] px-5 lg:px-20 py-20 items-center">
        <div>
          <span className="inline-block rounded-full bg-[#e0e7ff] px-[18px] py-[10px] text-sm text-[#2563eb] font-medium mb-5">
            All-in-One Business Management Platform
          </span>
          <h1 className="text-[40px] sm:text-[60px] font-bold leading-[1.1] mb-5">
            Run Your Entire Business From <span className="text-[#2563eb]">One Platform</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#6b7280] mb-[25px]">
            POS, Inventory, Payments, Customers, Analytics and Multi-Branch Management.
          </p>
          <ul className="space-y-[10px] mb-[30px] text-[#374151]">
            <li>✓ No credit card required</li>
            <li>✓ 14-day free trial</li>
            <li>✓ Cancel anytime</li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-[15px]">
            <Link href="/register" className="inline-flex items-center justify-center rounded-xl bg-[#2563eb] px-7 py-[14px] text-sm font-medium text-white">Start Free Trial</Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2563eb] px-7 py-[14px] text-sm font-medium text-[#2563eb]">Sign In</Link>
          </div>
        </div>
        <div className="hidden lg:block">
          {imgError ? (
            <div className="aspect-video rounded-[20px] bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-gray-400 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
              <div className="text-center p-8">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-blue-300" />
                <p className="text-lg font-medium">Dashboard Preview</p>
              </div>
            </div>
          ) : (
            <img
              src="/dashboard-preview.png"
              alt="Dashboard"
              className="w-full rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
              onError={() => setImgError(true)}
            />
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-[30px] bg-white px-5 lg:px-20 py-[60px]">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <h2 className="text-[32px] sm:text-[40px] font-bold text-[#2563eb]">{s.value}</h2>
            <p className="text-[#6b7280]">{s.label}</p>
          </div>
        ))}
      </section>

      <section id="features" className="px-5 lg:px-20 py-[100px] text-center">
        <h2 className="text-[32px] sm:text-[42px] font-bold mb-[50px]">Everything You Need To Succeed</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[25px]">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-white p-[30px] rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-2">
                <Icon className="h-[35px] w-[35px] text-[#2563eb] mb-5 mx-auto" />
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-[#6b7280]">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="pricing" className="px-5 lg:px-20 py-[100px] text-center bg-white">
        <h2 className="text-[32px] sm:text-[42px] font-bold">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px] mt-[50px] max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white p-10 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] ${plan.popular ? "border-2 border-[#2563eb] scale-[1.05]" : ""}`}>
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <h1 className="text-4xl font-bold text-[#2563eb] my-5">{plan.price}</h1>
              <Link href={plan.href} className="block w-full rounded-xl bg-[#2563eb] py-[14px] text-sm font-medium text-white">{plan.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-5 lg:mx-20 my-[100px] rounded-[24px] bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] p-[60px] flex flex-col sm:flex-row items-center justify-between gap-8 text-white">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to Transform Your Business?</h2>
          <p className="mt-2 text-white/80">Join hundreds of businesses using BizFlow.</p>
        </div>
        <Link href="/register" className="rounded-xl bg-white px-[30px] py-4 font-semibold text-[#2563eb] flex-shrink-0">Start Free Trial</Link>
      </section>

      <footer className="bg-[#0f172a] text-white px-5 lg:px-20 py-20 text-center">
        <div className="text-2xl font-bold">BizFlow</div>
        <p className="mt-5 opacity-70 max-w-md mx-auto">Modern business management software built for African entrepreneurs.</p>
      </footer>
    </div>
  );
}
