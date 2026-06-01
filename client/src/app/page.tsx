import Link from "next/link";
import { Check, ChevronRight, Zap, Shield, Building2, Smartphone } from "lucide-react";

const features = [
  { title: "Point of Sale", desc: "Fast, intuitive POS system for quick transactions and seamless customer experience." },
  { title: "Real-time Analytics", desc: "Track sales, profit margins, and cash flow with comprehensive dashboard insights." },
  { title: "Inventory Management", desc: "Monitor stock levels, get low-stock alerts, and manage your products effortlessly." },
  { title: "Stock Transfer", desc: "Seamlessly transfer inventory between locations with automatic tracking and approval workflows." },
  { title: "Credit Management", desc: "Track customer credit, monitor overdue payments, and manage receivables efficiently." },
  { title: "Customer Management", desc: "Build customer profiles, track purchase history, and strengthen relationships." },
  { title: "Expense Tracking", desc: "Record and categorize business expenses to understand true profitability." },
  { title: "Excel Export", desc: "Export all your reports, inventory, sales data, and analytics to Excel with one click." },
];

const reasons = [
  { icon: Zap, title: "Lightning Fast", desc: "Process transactions in seconds with our optimized POS system" },
  { icon: Shield, title: "Secure & Reliable", desc: "Enterprise-grade security to protect your business data" },
  { icon: Building2, title: "Multi-tenant", desc: "Perfect for managing multiple business locations" },
  { icon: Smartphone, title: "Mobile Ready", desc: "Access your business metrics anywhere, anytime" },
];

const plans = [
  {
    name: "Starter", price: "2,500", period: "month",
    desc: "Perfect for small businesses just getting started",
    popular: false,
    features: ["Up to 100 products", "Basic POS functionality", "1 user account", "Daily reports", "Excel export", "Email support"],
    href: "/register",
  },
  {
    name: "Professional", price: "5,500", period: "month",
    desc: "Ideal for growing businesses with multiple users",
    popular: true,
    features: ["Unlimited products", "Advanced POS features", "Up to 5 user accounts", "Real-time analytics", "Credit management", "Stock transfer", "Excel export", "Priority support"],
    href: "/register",
  },
  {
    name: "Enterprise", price: null, period: null,
    desc: "For large businesses with custom needs",
    popular: false,
    features: ["Everything in Professional", "Unlimited users", "Multi-location support", "Custom integrations", "Advanced Excel reporting", "Dedicated account manager", "24/7 phone support"],
    href: "/register",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main>
        <Hero />
        <FeaturesSection />
        <WhyChoose />
        <Pricing />
        <Contact />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold">B</div>
          <span className="text-lg font-semibold tracking-tight">BizFlow</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</Link>
          <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
          <Link href="#contact" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Contact</Link>
          <Link href="/login" className="text-sm font-medium text-foreground transition-colors hover:text-primary">Sign In</Link>
          <Link href="/register" className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.97]">Get Started</Link>
        </nav>
        <button type="button" className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden" aria-label="Toggle menu">
          <MenuIcon />
        </button>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            Modern Business Management
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Manage Your Business{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">With Confidence</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            All-in-one platform for POS, inventory, sales tracking, and business analytics. Built for modern African businesses.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary/90 px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:from-primary/90 hover:to-primary/80 active:scale-[0.97] sm:w-auto">
              Start Free Trial
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-input bg-background/50 px-8 text-base font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-accent/50 active:scale-[0.97] sm:w-auto">
              Sign In
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-secondary" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-secondary" /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-secondary" /> Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything You Need to Succeed</h2>
          <p className="mt-4 text-lg text-muted-foreground">Powerful features designed to streamline your business operations and boost profitability</p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="group rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md hover:shadow-primary/5">
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChoose() {
  return (
    <section className="border-b border-border/40 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Choose BizFlow?</h2>
          <p className="mt-4 text-lg text-muted-foreground">Built with modern technology and designed for the African market</p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, Transparent Pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground">Choose the perfect plan for your business. All plans include a 14-day free trial.</p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 shadow-sm transition-all hover:shadow-md ${
                plan.popular
                  ? "border-primary/30 bg-card ring-1 ring-primary/20"
                  : "border-border/50 bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-1 text-xs font-medium text-primary-foreground shadow-sm">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                <div className="mt-6">
                  {plan.price ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Ksh</span>
                      <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/{plan.period}</span>
                    </div>
                  ) : (
                    <span className="text-4xl font-bold tracking-tight">Custom</span>
                  )}
                </div>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium shadow-sm transition-all active:scale-[0.97] ${
                  plan.popular
                    ? "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-primary/10 hover:from-primary/90 hover:to-primary/80"
                    : "border border-input bg-background/50 text-foreground backdrop-blur-sm hover:bg-accent/50"
                }`}
              >
                {plan.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="border-b border-border/40 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Get in Touch</h2>
          <p className="mt-4 text-lg text-muted-foreground">Have questions? Our team is here to help you get started</p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-semibold tracking-tight">Phone</div>
            <p className="mt-2 text-sm text-muted-foreground">071773274, 0110966572</p>
            <p className="mt-1 text-xs text-muted-foreground">Mon-Fri, 8am-6pm EAT</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold tracking-tight">Email</div>
            <p className="mt-2 text-sm text-muted-foreground">elijahmsando672@gmail.com</p>
            <p className="mt-1 text-xs text-muted-foreground">24/7 support</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold tracking-tight">Location</div>
            <p className="mt-2 text-sm text-muted-foreground">Nairobi, Kenya — East Africa</p>
            <p className="mt-1 text-xs text-muted-foreground">East Africa</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Transform Your Business?</h2>
        <p className="mt-4 text-lg text-muted-foreground">Join hundreds of businesses already using BizFlow to streamline operations and increase profits.</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary/90 px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:from-primary/90 hover:to-primary/80 active:scale-[0.97] sm:w-auto">
            Start Your Free Trial
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-input bg-background/50 px-8 text-base font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-accent/50 active:scale-[0.97] sm:w-auto">
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/40 bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold">B</div>
            <span className="text-sm font-semibold">BizFlow</span>
          </div>
          <p className="text-xs text-muted-foreground">&copy; {year} BizFlow. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>Multi-tenant</span>
            <span>Secure</span>
            <span>Scalable</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
