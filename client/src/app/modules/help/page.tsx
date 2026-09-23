"use client";

import {
  Mail,
  BookOpen,
  MessageCircle,
  CircleHelp,
  LifeBuoy,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/modules/page-header";
import { useToast } from "@/components/ui/toast";

const faqs = [
  {
    q: "How do I change my workspace currency?",
    a: "Go to Settings → Workspace and pick your preferred currency. It will apply to new invoices and generated reports.",
  },
  {
    q: "How do I invite a teammate?",
    a: "Head to the Team page and click “Invite Member”. They’ll receive an email invitation to join your workspace once the production API is connected.",
  },
  {
    q: "How is my data backed up?",
    a: "BizFlow creates daily backups of your business data automatically. You can export your data anytime from the Reports page.",
  },
  {
    q: "Can clients pay invoices with M-Pesa?",
    a: "Yes — M-Pesa payments are on the roadmap for the production release. Invoices in this preview are demo records.",
  },
];

export default function HelpPage() {
  const toast = useToast();

  return (
    <div>
      <PageHeader title="Help & Support" subtitle="Get the most out of your workspace" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="p-5">
              <CardTitle className="flex items-center gap-2 text-base">
                <CircleHelp className="h-4 w-4 text-primary" />
                Frequently asked questions
              </CardTitle>
              <CardDescription>Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-5 pt-0">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-md border border-border px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground">
                    {faq.q}
                    <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </details>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="p-5">
              <CardTitle className="flex items-center gap-2 text-base">
                <LifeBuoy className="h-4 w-4 text-primary" />
                Contact support
              </CardTitle>
              <CardDescription>We usually reply within one business day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-0">
              <a
                href="mailto:support@bizflow.com"
                className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email us
              </a>
              <button
                type="button"
                onClick={() => toast.info("Live chat will be available in the production release.")}
                className="flex w-full items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                Live chat
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-5">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-primary" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-5 pt-0">
              {["Documentation", "API reference", "Community"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toast.info(`${label} will be published with the production launch.`)}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  {label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}