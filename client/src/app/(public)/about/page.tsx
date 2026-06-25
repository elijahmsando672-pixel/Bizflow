"use client";

import { Building2 } from "lucide-react";

export default function AboutPage() {
  return (
    <section className="pt-32 pb-20 lg:pb-28">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary tracking-wide uppercase mb-5">
            <Building2 className="h-3.5 w-3.5" />
            About
          </span>
          <h1 className="text-[30px] sm:text-[38px] font-bold mb-4 tracking-tight">Our Mission</h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl mx-auto">
            BizFlow was built to empower African entrepreneurs with modern tools to manage, grow, and scale their businesses effortlessly.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-card p-8 rounded-2xl border border-border/60">
            <h3 className="text-lg font-bold mb-3">Our Story</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Founded in 2024, BizFlow started as a simple POS solution and grew into a comprehensive business management platform. We understand the unique challenges African businesses face — from multi-branch management to mobile money integration.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Today, we serve hundreds of businesses across Kenya and East Africa, helping them digitize operations, reduce costs, and increase revenue.
            </p>
          </div>
          <div className="bg-card p-8 rounded-2xl border border-border/60">
            <h3 className="text-lg font-bold mb-3">Our Values</h3>
            <ul className="space-y-3">
              {[
                { title: "Simplicity", desc: "Powerful tools that anyone can use" },
                { title: "Reliability", desc: "99.9% uptime, because your business never sleeps" },
                { title: "Local First", desc: "Built for African businesses, by African developers" },
                { title: "Innovation", desc: "Constantly evolving to meet your needs" },
              ].map(v => (
                <li key={v.title} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{v.title}</p>
                    <p className="text-xs text-muted-foreground">{v.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
