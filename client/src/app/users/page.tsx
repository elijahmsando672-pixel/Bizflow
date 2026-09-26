"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MailPlus, RefreshCw, ShieldCheck, UserRound, Users, X } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate, formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login?: string | null;
  created_at?: string | null;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at?: string | null;
  created_at?: string | null;
  invited_by_name?: string | null;
}

const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "staff", label: "Staff" },
];

export default function UsersPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");
  const [inviting, setInviting] = useState(false);

  const canManage = user?.role === "owner" || user?.role === "admin" || user?.role === "manager";

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [memberList, inviteList] = await Promise.all([
        api.team.getMembers() as Promise<TeamMember[]>,
        api.team.getInvitations().catch(() => [] as TeamInvitation[]),
      ]);
      setMembers(Array.isArray(memberList) ? memberList : []);
      setInvitations(Array.isArray(inviteList) ? inviteList : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = members.filter((member) => member.is_active).length;
    const pending = invitations.filter((invite) => invite.status === "pending").length;
    return { active, pending, total: members.length };
  }, [members, invitations]);

  const changeRole = async (member: TeamMember, role: string) => {
    setBusyId(member.id);
    try {
      await api.team.updateRole(member.id, role);
      toast.success(`${member.name} is now ${role}`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the role");
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (member: TeamMember) => {
    setBusyId(member.id);
    try {
      await api.team.updateMember(member.id, { is_active: !member.is_active });
      toast.success(member.is_active ? `${member.name} deactivated` : `${member.name} reactivated`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the member");
    } finally {
      setBusyId(null);
    }
  };

  const revokeInvite = async (invite: TeamInvitation) => {
    setBusyId(invite.id);
    try {
      await api.team.revokeInvite(invite.id);
      toast.success("Invitation revoked");
      load();
    } catch {
      toast.error("Could not revoke the invitation");
    } finally {
      setBusyId(null);
    }
  };

  const sendInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    try {
      await api.team.invite({ email, role: inviteRole });
      toast.success(`Invitation sent to ${email}`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("staff");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the invitation");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Team members, roles, and pending invitations for this business."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            {canManage ? (
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <MailPlus className="h-4 w-4" aria-hidden />
                Invite user
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Team members" value={String(stats.total)} icon={Users} />
        <StatCard label="Active" value={String(stats.active)} icon={ShieldCheck} tone="success" />
        <StatCard
          label="Pending invites"
          value={String(stats.pending)}
          icon={MailPlus}
          tone={stats.pending > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Suspended"
          value={String(Math.max(0, stats.total - stats.active))}
          icon={UserRound}
          tone={stats.total - stats.active > 0 ? "danger" : "neutral"}
        />
      </div>

      {error ? (
        <ErrorState title="Could not load the team" onRetry={load} retrying={loading} />
      ) : (
        <>
          <Panel>
            <PanelHeader>
              <PanelTitle>Members</PanelTitle>
            </PanelHeader>
            <PanelBody className="p-0">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner label="Loading members" />
                </div>
              ) : members.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No team members yet"
                  description="Invite colleagues so they can sell, manage stock, and view reports."
                  className="m-4 border-0 bg-transparent"
                  action={
                    canManage ? (
                      <Button size="sm" onClick={() => setInviteOpen(true)}>
                        <MailPlus className="h-4 w-4" aria-hidden />
                        Invite user
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {members.map((member) => {
                    const isSelf = member.id === user?.id;
                    return (
                      <li
                        key={member.id}
                        className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={member.name} size="sm" />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium text-foreground">
                                {member.name}
                              </p>
                              {isSelf ? <StatusBadge tone="info">You</StatusBadge> : null}
                              {!member.is_active ? <StatusBadge tone="danger">Suspended</StatusBadge> : null}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                              {member.last_login
                                ? `Last active ${formatRelative(member.last_login)}`
                                : `Joined ${formatDate(member.created_at)}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {canManage && !isSelf ? (
                            <>
                              <div className="w-36">
                                <Select
                                  value={member.role}
                                  onValueChange={(role) => changeRole(member, role)}
                                >
                                  <SelectTrigger
                                    aria-label={`Role for ${member.name}`}
                                    className="h-8"
                                    disabled={busyId === member.id}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ROLES.map((role) => (
                                      <SelectItem key={role.value} value={role.value}>
                                        {role.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleActive(member)}
                                disabled={busyId === member.id}
                              >
                                {member.is_active ? "Suspend" : "Reactivate"}
                              </Button>
                            </>
                          ) : (
                            <StatusBadge tone="neutral">{member.role}</StatusBadge>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </PanelBody>
          </Panel>

          {invitations.length > 0 ? (
            <Panel>
              <PanelHeader>
                <PanelTitle>Invitations</PanelTitle>
              </PanelHeader>
              <PanelBody className="p-0">
                <ul className="divide-y divide-border">
                  {invitations.map((invite) => (
                    <li
                      key={invite.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{invite.email}</p>
                          <StatusBadge
                            tone={
                              invite.status === "accepted"
                                ? "success"
                                : invite.status === "pending"
                                  ? "warning"
                                  : "neutral"
                            }
                          >
                            {invite.status}
                          </StatusBadge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {invite.role}
                          {invite.invited_by_name ? ` · invited by ${invite.invited_by_name}` : ""}
                          {invite.status === "pending" && invite.expires_at
                            ? ` · expires ${formatDate(invite.expires_at)}`
                            : ""}
                        </p>
                      </div>
                      {canManage && invite.status === "pending" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeInvite(invite)}
                          disabled={busyId === invite.id}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                          Revoke
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          ) : null}
        </>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>
              They will receive an email invitation that expires in 7 days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="invite-email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="colleague@business.co.ke"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="invite-role" className="text-sm font-medium text-foreground">
                Role
              </label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role" aria-label="Role for the new member">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.filter((role) => role.value !== "owner").map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? "Sending…" : "Send invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
