"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, Package, Users, BarChart3, Zap, Check, ArrowRight, Menu, X } from 'lucide-react';

export default function BizFlowLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [metrics, setMetrics] = useState({ revenue: 0, orders: 0, growth: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        revenue: Math.floor(Math.random() * 500000) + 400000,
        orders: Math.floor(Math.random() * 2000) + 800,
        growth: Math.floor(Math.random() * 40) + 60,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Zap, title: "Sell Faster", desc: "POS that keeps up with your pace. Scan, ring, done." },
    { icon: Package, title: "Smart Inventory", desc: "Know what you have, where it is, before it runs out." },
    { icon: Users, title: "Customer CRM", desc: "Track who buys what. Send the right offer at the right time." },
    { icon: BarChart3, title: "Live Reports", desc: "See profit, loss, cash flow. Real reports, not guesses." },
    { icon: TrendingUp, title: "Multi-Shop", desc: "One system for one store or twenty. Stock moves between them." },
  ];

  const plans = [
    { name: "Starter", price: "2,500", transactions: "500/mo", branches: "1", features: ["Basic reports", "Email support"] },
    { name: "Professional", price: "5,500", transactions: "Unlimited", branches: "3", features: ["Advanced analytics", "Priority support", "CRM", "Team management"], popular: true },
    { name: "Enterprise", price: "Custom", transactions: "Unlimited", branches: "Unlimited", features: ["Everything", "Dedicated support", "API access", "Custom integrations"] },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative">
              <Image src="/logo.png" alt="BizFlow" fill sizes="32px" className="object-contain" />
            </div>
            <span className="text-xl font-bold">BizFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign In</Link>
            <Link href="/register" className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
              Get Started
            </Link>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border px-6 py-4 space-y-4">
            <a href="#features" className="block text-sm text-muted-foreground">Features</a>
            <a href="#pricing" className="block text-sm text-muted-foreground">Pricing</a>
            <Link href="/login" className="block text-sm text-muted-foreground">Sign In</Link>
            <Link href="/register" className="block w-full bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium text-center">Get Started</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="bg-accent">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-sm text-primary font-semibold mb-4 tracking-wide uppercase">Trusted by 500+ businesses</div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 tracking-tight">
                Stop juggling.{' '}
                <span className="text-primary">Start growing.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                One system for your POS, inventory, customers, and money. Built for how you actually run your business.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium hover:bg-primary/90 flex items-center gap-2">
                  Start Free <ArrowRight size={18} />
                </Link>
                <button className="border border-border px-8 py-3 rounded-xl font-medium hover:bg-muted">
                  See Demo
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">No card. 14 days free. Cancel anytime.</p>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Dashboard</span>
                <span className="flex items-center gap-1.5 text-xs text-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" /> Live
                </span>
              </div>
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Revenue Today</div>
                  <div className="text-3xl font-bold">KSh {metrics.revenue.toLocaleString()}</div>
                  <div className="text-xs text-success mt-2 flex items-center gap-1">
                    <TrendingUp size={12} /> ↑ {metrics.growth}% this month
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <div className="text-xs text-muted-foreground mb-1">Orders</div>
                    <div className="text-2xl font-bold">{metrics.orders}</div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <div className="text-xs text-muted-foreground mb-1">Stock Alerts</div>
                    <div className="text-2xl font-bold text-warning">3</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Recent Sales</div>
                <div className="space-y-2 text-sm">
                  {[{ name: "Jane M.", amount: "12,500" }, { name: "Peter K.", amount: "8,200" }].map((sale, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground">{sale.name}</span>
                      <span className="font-medium">KSh {sale.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">What you actually get</h2>
            <p className="text-lg text-muted-foreground">Not a buzzword list. Real features that save time and money.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-6 hover:shadow-sm transition">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">Set up in minutes</h2>
            <p className="text-lg text-muted-foreground">No complicated setup. No technical skills required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "Add your business", desc: "Products, branches, team. Takes 10 minutes." },
              { step: "Start selling", desc: "Your first sale, your first customer tracked." },
              { step: "Watch it work", desc: "Reports update live. You stay on top." },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-primary/20 mb-4">{i + 1}</div>
                <h3 className="text-xl font-bold mb-2">{item.step}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "500+", label: "Businesses Growing" },
              { number: "10M+", label: "Transactions Processed" },
              { number: "99.9%", label: "System Uptime" },
              { number: "24/7", label: "Customer Support" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">Pick what fits</h2>
            <p className="text-lg text-muted-foreground">14-day free trial on all plans. No card required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 border transition ${
                  plan.popular
                    ? 'border-primary bg-card shadow-md'
                    : 'border-border bg-card'
                }`}
              >
                {plan.popular && (
                  <div className="inline-block bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <div className="text-4xl font-bold">KSh {plan.price}</div>
                  <div className="text-sm text-muted-foreground mt-1">/month</div>
                </div>
                <div className="space-y-3 mb-8">
                  <div className="flex gap-2 text-sm">
                    <Check size={16} className="text-success flex-shrink-0 mt-0.5" />
                    <span><strong>{plan.transactions}</strong> transactions</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <Check size={16} className="text-success flex-shrink-0 mt-0.5" />
                    <span><strong>{plan.branches}</strong> {plan.branches === "1" ? "branch" : "branches"}</span>
                  </div>
                </div>
                <Link href="/register" className={`block w-full py-3 rounded-xl font-medium transition mb-8 text-center ${
                  plan.popular
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-border hover:bg-muted'
                }`}>
                  Start Free Trial
                </Link>
                <div className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex gap-2 text-sm">
                      <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to stop the chaos?</h2>
          <p className="text-lg text-muted-foreground mb-8">Start your free trial today. Grow faster tomorrow.</p>
          <Link href="/register" className="inline-block bg-primary text-primary-foreground px-10 py-4 rounded-xl font-medium hover:bg-primary/90 text-lg">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-muted-foreground">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 relative">
                  <Image src="/logo.png" alt="BizFlow" fill sizes="32px" className="object-contain" />
                </div>
                <span className="text-lg font-bold text-background">BizFlow</span>
              </div>
              <p className="text-sm leading-relaxed">Built for African businesses that grow.</p>
            </div>
            <div>
              <div className="font-semibold text-background mb-4">Product</div>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-background">Features</a></li>
                <li><a href="#" className="hover:text-background">Pricing</a></li>
                <li><a href="#" className="hover:text-background">API</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-background mb-4">Company</div>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-background">About</a></li>
                <li><a href="#" className="hover:text-background">Blog</a></li>
                <li><a href="#" className="hover:text-background">Careers</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-background mb-4">Support</div>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-background">Help</a></li>
                <li><a href="#" className="hover:text-background">Docs</a></li>
                <li><a href="#" className="hover:text-background">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/20 pt-8 text-sm text-center md:text-left">
            <p>&copy; 2026 BizFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
