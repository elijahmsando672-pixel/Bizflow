"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface AcceptInviteResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await api.team.accept({ token: token!, name, password });
      const data = result as AcceptInviteResponse;
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSuccess(true);
      setTimeout(() => { window.location.href = "/"; }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to accept invitation";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>
            This link is missing its invitation token. Ask whoever invited you to send it again.
          </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to BizFlow!</CardTitle>
            <CardDescription>Redirecting to dashboard...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>Create your account to join the team</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-md bg-destructive/10 p-4 text-destructive">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="accept-name" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="accept-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                minLength={2}
              />
            </div>
            <div>
              <label htmlFor="accept-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="accept-password"
                name="password"
                autoComplete="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 10 characters"
                aria-describedby="accept-password-hint"
                required
                minLength={10}
              />
              <p id="accept-password-hint" className="text-xs text-muted-foreground">
                Use at least 10 characters.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating Account..." : "Accept & Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
