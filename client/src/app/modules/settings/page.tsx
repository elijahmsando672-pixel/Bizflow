"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/modules/page-header";
import { useToast } from "@/components/ui/toast";
import { getInitials } from "@/lib/modules-data";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="p-5">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">{children}</CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const toast = useToast();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile, workspace, and preferences" />

      <Tabs defaultValue="profile">
        <div className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Section title="Your profile" description="This information is shown to your team and clients.">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {getInitials("Elijah Group")}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Elijah</p>
                <p className="text-xs text-muted-foreground">Owner · Admin</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input defaultValue="Elijah" />
              </Field>
              <Field label="Email address">
                <Input defaultValue="elijah@bizflow.com" />
              </Field>
            </div>
            <Field label="Bio">
              <Textarea rows={3} placeholder="Tell your team a little about yourself…" />
            </Field>
            <div className="flex justify-end">
              <Button onClick={() => toast.success("Profile saved (demo).")}>Save Changes</Button>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-4">
          <Section title="Workspace details" description="The identity of your workspace on BizFlow.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Workspace name">
                <Input defaultValue="EmohTech Solutions" />
              </Field>
              <Field label="Currency">
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="KES">KES — Kenyan Shilling</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </Field>
            </div>
            <Field label="Time zone">
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <option value="EAT">UTC+3 — East Africa Time (Nairobi)</option>
                <option value="UTC">UTC</option>
                <option value="GMT">GMT — Greenwich Mean Time</option>
              </select>
            </Field>
            <Field label="Default invoice footer">
              <Textarea rows={3} defaultValue="Thank you for your business!" />
            </Field>
            <div className="flex justify-end">
              <Button onClick={() => toast.success("Workspace settings saved (demo).")}>Save Workspace</Button>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Section title="Notifications" description="Choose what you want to hear about.">
            {[
              { label: "Invoice overdue reminders", detail: "When a client invoice passes its due date" },
              { label: "New task assignments", detail: "When someone assigns you a task" },
              { label: "Weekly digest", detail: "A summary of your business every Monday" },
            ].map((item) => (
              <label key={item.label} className="flex items-start justify-between gap-4 rounded-md border border-border px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-foreground">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.detail}</span>
                </span>
                <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
              </label>
            ))}
            <div className="flex justify-end">
              <Button onClick={() => toast.success("Notification preferences saved (demo).")}>Save Preferences</Button>
            </div>
          </Section>
        </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}