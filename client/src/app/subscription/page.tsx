"use client";

import { useEffect, useState } from "react";
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
import { Check, Crown, AlertCircle, CreditCard } from "lucide-react";
import api from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
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
    try {
      await api.subscriptions.activate(planId);
      setSuccess("Subscription activated");
      loadData();
    } catch (err: Error) {
      setError(err.message);
    }
  }

  async function handleCancel() {
    try {
      await api.subscriptions.cancel();
      setSuccess("Subscription cancelled");
      loadData();
    } catch (_err: Error) {
      setError(_err.message);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Subscription & Billing</h2>
        <p className="text-gray-500">Manage your subscription plan and billing</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 p-4 text-green-600">{success}</div>}

      {currentSub && currentSub.status !== "no_subscription" ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-blue-600" />
              Current Plan: {currentSub.plan_name || "Unknown"}
            </CardTitle>
            <CardDescription>
              Status:{" "}
              <Badge
                className={
                  currentSub.status === "active"
                    ? "bg-green-100 text-green-700"
                    : currentSub.status === "trial"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-red-100 text-red-700"
                }
              >
                {currentSub.status}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Next Billing Date</p>
                <p className="text-lg font-semibold">
                  {currentSub.next_billing_date
                    ? new Date(currentSub.next_billing_date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-lg font-semibold">
                  {currentSub.amount ? `${parseFloat(currentSub.amount).toLocaleString()}` : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Trial Ends</p>
                <p className="text-lg font-semibold">
                  {currentSub.trial_ends_at
                    ? new Date(currentSub.trial_ends_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            {currentSub.status === "active" && (
              <Button variant="destructive" className="mt-4" onClick={handleCancel}>
                Cancel Subscription
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              No Active Subscription
            </CardTitle>
            <CardDescription>
              You are currently on a free trial. Choose a plan to continue.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div>
        <h3 className="text-xl font-semibold mb-4">Available Plans</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No plans configured. Contact admin.
              </CardContent>
            </Card>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold">
                    {plan.currency} {parseFloat(plan.price).toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">
                      /{plan.billing_cycle}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {plan.features &&
                      Array.isArray(plan.features) &&
                      plan.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      Up to {plan.max_users || "unlimited"} users
                    </li>
                    {plan.trial_days > 0 && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {plan.trial_days} day free trial
                      </li>
                    )}
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleActivate(plan.id)}
                    disabled={currentSub?.plan_id === plan.id && currentSub?.status === "active"}
                  >
                    {currentSub?.plan_id === plan.id && currentSub?.status === "active"
                      ? "Current Plan"
                      : "Select Plan"}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
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
                      {payment.currency} {parseFloat(payment.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>{payment.payment_method || "-"}</TableCell>
                    <TableCell className="text-sm">{payment.transaction_id || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          payment.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }
                      >
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
