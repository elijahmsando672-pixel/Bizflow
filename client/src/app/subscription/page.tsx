"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Crown, AlertCircle, CreditCard, Clock, Zap, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  plan_name?: string;
  next_billing_date?: string;
  amount?: number;
  trial_ends_at?: string;
  features?: string[];
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  paid_at?: string;
  payment_method?: string;
  transaction_id?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  description?: string;
  billing_cycle?: string;
  max_users?: number;
  max_products?: number;
  trial_days?: number;
}

const planIcons: Record<string, typeof Crown> = {
  Pro: Zap,
  Max: Crown,
};

export default function SubscriptionPage() {
  const { subscription, refreshSubscription } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [plansRes, subRes, paymentsRes] = await Promise.all([
        api.subscriptions.getPlans(),
        api.subscriptions.getCurrent(),
        api.subscriptions.getPayments(),
      ]);
      setPlans(plansRes as Plan[]);
      setCurrentSub(subRes as Subscription);
      setPayments(paymentsRes as Payment[]);
    } catch {
      setError("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleActivate(planId: string) {
    setActivating(planId);
    setError(null);
    setSuccess(null);
    try {
      await api.subscriptions.activate(planId);
      setSuccess("Subscription activated successfully!");
      await loadData();
      await refreshSubscription();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to activate");
    } finally {
      setActivating(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    setError(null);
    setSuccess(null);
    try {
      await api.subscriptions.cancel();
      setSuccess("Subscription cancelled");
      await loadData();
      await refreshSubscription();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    }
  }

  const [now] = useState(() => Date.now());

  const getDaysLeft = (dateStr?: string) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isTrialExpired = subscription?.status === "trial" && subscription.trial_ends_at && new Date(subscription.trial_ends_at).getTime() < now;

  if (loading) return <div className="flex items-center justify-center p-12 text-gray-500">Loading subscription...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription & Billing</h1>
        <p className="mt-1 text-muted-foreground">Manage your plan and billing information</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
          {success}
        </div>
      )}

      {currentSub && currentSub.status !== "no_subscription" ? (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white dark:border-indigo-800 dark:from-indigo-950/30 dark:to-gray-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-indigo-600" />
                {currentSub.plan_name || "Current Plan"}
              </CardTitle>
              <Badge
                variant={
                  currentSub.status === "active" ? "secondary" :
                  currentSub.status === "trial" ? "default" : "destructive"
                }
              >
                {currentSub.status === "active" ? "Active" :
                 currentSub.status === "trial" ? "Trial" : currentSub.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</p>
                <p className="mt-1 text-lg font-semibold capitalize">{currentSub.status}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {currentSub.status === "trial" ? "Trial Ends" : "Next Billing"}
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {currentSub.trial_ends_at
                    ? new Date(currentSub.trial_ends_at).toLocaleDateString()
                    : currentSub.next_billing_date
                    ? new Date(currentSub.next_billing_date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</p>
                <p className="mt-1 text-lg font-semibold">
                  {currentSub.amount ? `KES ${Number(currentSub.amount).toLocaleString()}` : "Free Trial"}
                </p>
              </div>
            </div>
            {currentSub.status === "active" && (
              <Button variant="destructive" size="sm" className="mt-4" onClick={handleCancel}>
                Cancel Subscription
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white dark:border-yellow-800 dark:from-yellow-950/30 dark:to-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              {isTrialExpired ? "Trial Expired" : "No Active Subscription"}
            </CardTitle>
            <CardDescription>
              {isTrialExpired
                ? "Your 7-day free trial has ended. Choose a plan below to continue using BizFlow."
                : "Choose a plan below to get started with BizFlow."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {subscription?.status === "trial" && subscription.trial_ends_at && !isTrialExpired && (
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20">
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Your free trial is active</p>
              <p className="text-sm text-muted-foreground">
                {getDaysLeft(subscription.trial_ends_at)} days remaining. Upgrade to Pro or Max to keep access.
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center dark:bg-indigo-500/20">
              <span className="text-lg font-bold text-indigo-600">{getDaysLeft(subscription.trial_ends_at)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Choose Your Plan</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {plans
            .filter((p) => p.name !== "Free Trial")
            .map((plan) => {
            const Icon = planIcons[plan.name] || Crown;
            const isCurrent = currentSub?.plan_id === plan.id && currentSub?.status === "active";

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  isCurrent
                    ? "border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-700"
                    : plan.name === "Max"
                    ? "border-purple-200 dark:border-purple-800"
                    : ""
                }`}
              >
                {plan.name === "Max" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
                      <Sparkles className="mr-1 h-3 w-3" /> Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      plan.name === "Max" ? "bg-purple-100 dark:bg-purple-500/20" : "bg-indigo-100 dark:bg-indigo-500/20"
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        plan.name === "Max" ? "text-purple-600" : "text-indigo-600"
                      }`} />
                    </div>
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.description && (
                        <CardDescription>{plan.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">KES {Number(plan.price).toLocaleString()}</span>
                    <span className="ml-1 text-sm text-muted-foreground">/{plan.billing_cycle || "month"}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="mb-6 flex-1 space-y-3">
                    {plan.features && Array.isArray(plan.features) && plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span>Up to {plan.max_users || "unlimited"} team members</span>
                    </li>
                    {plan.max_products && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        <span>Up to {plan.max_products} products</span>
                      </li>
                    )}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.name === "Max"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        : ""
                    }`}
                    variant={plan.name === "Max" ? "default" : "outline"}
                    onClick={() => handleActivate(plan.id)}
                    disabled={isCurrent || activating === plan.id}
                  >
                    {activating === plan.id ? "Activating..." :
                     isCurrent ? "Current Plan" : `Choose ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{payment.payment_method || "-"}</TableCell>
                    <TableCell className="text-sm">{payment.transaction_id || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "completed" ? "secondary" : "warning"}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
