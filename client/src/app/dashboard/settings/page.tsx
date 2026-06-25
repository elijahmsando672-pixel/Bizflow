"use client";

import { PageHeader } from "@/components/dashboard/ui";
import { Card } from "@/components/dashboard/ui";
import { Settings, User, Bell, Shield } from "lucide-react";

const settingsItems = [
  { icon: <User className="h-4 w-4" />, label: "Profile", desc: "Manage your account details" },
  { icon: <Bell className="h-4 w-4" />, label: "Notifications", desc: "Configure notification preferences" },
  { icon: <Shield className="h-4 w-4" />, label: "Security", desc: "Password and authentication" },
  { icon: <Settings className="h-4 w-4" />, label: "General", desc: "System preferences" },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration and preferences">
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        {settingsItems.map(item => (
          <Card key={item.label} hover className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted text-muted-foreground">
              {item.icon}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
