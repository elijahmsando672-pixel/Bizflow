"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send, UserPlus } from "lucide-react";
import api from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelBody } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = [
  { value: "manager", label: "Manager — full access to daily operations" },
  { value: "cashier", label: "Cashier — point of sale and receipts" },
  { value: "staff", label: "Staff — limited operational access" },
];

export default function InviteUserPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("cashier");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.getElementById("invite-email")?.focus();
  }, []);

  const invite = async () => {
    const value = email.trim();
    if (!value) return;
    setSending(true);
    try {
      await api.team.invite({ email: value, role });
      setSent(true);
      setEmail("");
      toast.success(`Invitation sent to ${value}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the invitation");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Invite user"
        description="Give a colleague access to your business with the right level of permission."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/users">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to users
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelBody>
            <h2 className="text-sm font-semibold text-foreground">Send an invitation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The invitation link is emailed to the address below and expires if not accepted.
            </p>

            <div className="mt-4 max-w-md space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setSent(false);
                  }}
                  placeholder="colleague@example.com"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((entry) => (
                      <SelectItem key={entry.value} value={entry.value}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={invite} disabled={sending || !email.trim()}>
                <Send className="h-4 w-4" aria-hidden />
                {sending ? "Sending…" : "Send invitation"}
              </Button>

              {sent ? (
                <p className="text-sm text-success">
                  Invitation sent. You can track pending invitations on the{" "}
                  <Link href="/users" className="underline underline-offset-2">
                    users page
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          </PanelBody>
        </Panel>

        <Panel className="h-fit">
          <PanelBody>
            <h2 className="text-sm font-semibold text-foreground">How access works</h2>
            <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2.5">
                <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
                Invited staff accept the link and set their own password.
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
                Owners, managers, and cashiers can send and revoke invitations.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" aria-hidden />
                Deactivate a member instead of deleting them to keep their sales history intact.
              </li>
            </ul>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
