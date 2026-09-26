"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  ChevronRight,
  KeyRound,
  MapPin,
  Mail,
  ShieldCheck,
  Store,
  Tags,
  Users,
} from "lucide-react";
import api from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

interface Account {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  business_id?: string | null;
  business_name?: string | null;
  business_email?: string | null;
  phone?: string | null;
  address?: string | null;
  tax_id?: string | null;
  totp_enabled?: boolean;
}

const SECTIONS = [
  {
    href: "/users",
    icon: Users,
    title: "Users & roles",
    description: "Invite staff, change roles, and deactivate accounts.",
  },
  {
    href: "/notifications",
    icon: Bell,
    title: "Notifications",
    description: "Overdue sales, low stock, and system alerts.",
  },
  {
    href: "/dashboard/shops",
    icon: Store,
    title: "Branches",
    description: "Locations, managers, and branch contact details.",
  },
  {
    href: "/dashboard/categories",
    icon: Tags,
    title: "Product categories",
    description: "Group your catalogue for reports and stock control.",
  },
];

export default function SettingsPage() {
  const toast = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState<{ qr_code: string; secret: string; backup_codes: string[] } | null>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await api.auth.me()) as Account;
      setAccount(data);
    } catch {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startSetup = async () => {
    setBusy(true);
    try {
      const result = (await api.auth.totp.setup()) as {
        qr_code: string;
        secret: string;
        backup_codes: string[];
      };
      setSetup(result);
    } catch {
      toast.error("Could not start two-factor setup");
    } finally {
      setBusy(false);
    }
  };

  const confirmSetup = async () => {
    if (!token.trim()) return;
    setBusy(true);
    try {
      await api.auth.totp.verifySetup(token.trim());
      toast.success("Two-factor authentication enabled");
      setSetup(null);
      setToken("");
      load();
    } catch {
      toast.error("That code was not accepted. Check your authenticator app and try again.");
    } finally {
      setBusy(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!password) return;
    setBusy(true);
    try {
      await api.auth.totp.disable(password);
      toast.success("Two-factor authentication disabled");
      setPassword("");
      load();
    } catch {
      toast.error("Could not disable two-factor authentication");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Your account, business details, and security."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader>
            <PanelTitle>Account</PanelTitle>
          </PanelHeader>
          <PanelBody>
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner label="Loading account" />
              </div>
            ) : account ? (
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Name
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{account.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Email
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    {account.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Role
                  </dt>
                  <dd className="mt-1">
                    <StatusBadge status={account.role} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Business
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    {account.business_name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Business phone
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">{account.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Tax ID
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">{account.tax_id || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Business address
                  </dt>
                  <dd className="mt-1 flex items-start gap-1.5 text-sm text-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    {account.address || "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                Could not load your account details.{" "}
                <Button variant="link" size="sm" className="h-auto p-0" onClick={load}>
                  Try again
                </Button>
              </p>
            )}
          </PanelBody>
        </Panel>

        <Panel className="h-fit">
          <PanelHeader>
            <PanelTitle>Security</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Require a code from your authenticator app at sign-in.
                </p>
              </div>
            </div>

            {!loading && account ? (
              account.totp_enabled ? (
                <div className="mt-3 space-y-2">
                  <StatusBadge tone="success" dot>
                    Enabled
                  </StatusBadge>
                  <div className="space-y-1.5">
                    <label htmlFor="disable-2fa-password" className="text-xs text-muted-foreground">
                      Confirm your password to disable
                    </label>
                    <Input
                      id="disable-2fa-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disableTwoFactor}
                      disabled={busy || !password}
                    >
                      <KeyRound className="h-4 w-4" aria-hidden />
                      Disable
                    </Button>
                  </div>
                </div>
              ) : setup ? (
                <div className="mt-3 space-y-3">
                  <img
                    src={setup.qr_code}
                    alt="Two-factor authentication QR code"
                    className="h-40 w-40 rounded-md border border-border bg-white p-1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Scan the code, then enter the 6-digit code from your app.
                  </p>
                  <Input
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    inputMode="numeric"
                    placeholder="123456"
                    aria-label="Verification code"
                    maxLength={6}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={confirmSetup} disabled={busy || token.trim().length < 6}>
                      {busy ? "Verifying…" : "Verify and enable"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSetup(null)}>
                      Cancel
                    </Button>
                  </div>
                  {setup.backup_codes.length > 0 ? (
                    <details className="rounded-md border border-border p-2 text-xs">
                      <summary className="cursor-pointer font-medium text-foreground">
                        Backup codes ({setup.backup_codes.length})
                      </summary>
                      <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-muted-foreground">
                        {setup.backup_codes.map((code) => (
                          <li key={code}>{code}</li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </div>
              ) : (
                <Button size="sm" className="mt-3" onClick={startSetup} disabled={busy}>
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  {busy ? "Preparing…" : "Enable 2FA"}
                </Button>
              )
            ) : null}
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader>
          <PanelTitle>Manage</PanelTitle>
        </PanelHeader>
        <PanelBody className="p-0">
          <ul className="divide-y divide-border">
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                    <section.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{section.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {section.description}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </PanelBody>
      </Panel>
    </div>
  );
}
