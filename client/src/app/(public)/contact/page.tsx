"use client";

import { Mail, MapPin, Phone, ArrowRight } from "lucide-react";

export default function ContactPage() {
  return (
    <section className="pt-32 pb-20 lg:pb-28">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary tracking-wide uppercase mb-5">
            <Mail className="h-3.5 w-3.5" />
            Contact
          </span>
          <h1 className="text-[30px] sm:text-[38px] font-bold mb-4 tracking-tight">Get In Touch</h1>
          <p className="text-muted-foreground text-base leading-relaxed">Have questions? We&apos;d love to hear from you.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-card p-8 rounded-2xl border border-border/60 space-y-6">
            <h3 className="text-lg font-bold">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span>hello@bizflow.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <span>+254 700 123 456</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span>Nairobi, Kenya</span>
              </div>
            </div>
          </div>
          <div className="bg-card p-8 rounded-2xl border border-border/60">
            <h3 className="text-lg font-bold mb-5">Send a Message</h3>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name</label>
                <input type="text" className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                <input type="email" className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Message</label>
                <textarea rows={4} className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors resize-none" placeholder="Your message..." />
              </div>
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all">
                Send Message <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
