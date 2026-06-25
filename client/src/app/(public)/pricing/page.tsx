"use client";

import Link from "next/link";
import { Check, Sparkles, CreditCard } from "lucide-react";
import { useInView } from "@/hooks/useInView";

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
    features: ["Everything in Pro", "Unlimited branches", "Custom integrations", "Dedicated account manager", "API access", "On-premise option"],
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

export default function PricingPage() {
  return (
    <section className="pt-32 pb-20 lg:pb-28">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary tracking-wide uppercase mb-5">
            <CreditCard className="h-3.5 w-3.5" />
            Pricing
          </span>
          <h1 className="text-[30px] sm:text-[38px] font-bold mb-4 tracking-tight">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground text-base leading-relaxed">Choose the plan that fits your business. All plans include a 14-day free trial.</p>
        </AnimatedSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <AnimatedSection key={plan.name} delay={i * 100}>
              <div
                className={`relative bg-card p-7 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? "border-primary shadow-xl shadow-primary/10 scale-[1.02] md:scale-105"
                    : "border-border/60 shadow-sm hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                    <Sparkles className="h-3 w-3 inline mr-1" />Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold mb-0.5">{plan.name}</h3>
                <div className={`text-[38px] font-bold my-4 ${plan.popular ? "text-primary" : "text-foreground"}`}>
                  {plan.price}
                </div>
                <p className="text-xs text-muted-foreground mb-6">{plan.name === "Enterprise" ? "Custom pricing" : "per month"}</p>
                <Link
                  href={plan.href}
                  className={`block w-full text-center rounded-xl py-3 text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                      : "border border-border text-foreground hover:bg-accent"
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="mt-6 space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success flex-shrink-0" strokeWidth={2.5} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
