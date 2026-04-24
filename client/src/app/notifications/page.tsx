"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Check, Clock, AlertTriangle, Info, CheckCircle, Loader2 } from "lucide-react";
import { ReactNode } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.notifications.getAll();
      setNotifications(data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      toast.success("All notifications marked as read");
      loadNotifications();
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark as read");
    }
  };

  const unread = notifications.filter((n) => !n.read).length;
  const warnings = notifications.filter((n) => n.type === "warning").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-500">Stay updated with your business</p>
        </div>
        <Button variant="outline" onClick={markAllRead}>
          <Check className="mr-2 h-4 w-4" /> Mark all as read
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{notifications.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Bell className="h-4 w-4" /> Unread: {unread}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Warnings</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{warnings}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" /> Requires attention
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" /> Latest updates
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>View and manage your notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.length === 0 && (
                <p className="text-center py-8 text-gray-500">No notifications</p>
              )}
              {notifications.map((notification) => {
                const icons: Record<string, ReactNode> = { warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />, success: <CheckCircle className="h-5 w-5 text-green-600" />, info: <Info className="h-5 w-5 text-blue-600" /> };
                const bgColors: Record<string, string> = { warning: "bg-yellow-50", success: "bg-green-50", info: "bg-blue-50" };
                const type = notification.type || "info";
                return (
                  <div key={notification.id} className={`flex items-start gap-4 rounded-lg border border-gray-200 p-4 ${!notification.read ? "bg-blue-50" : ""}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColors[type] || bgColors.info}`}>
                      {icons[type] || icons.info}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{notification.title}</p>
                        <span className="text-sm text-gray-500">{new Date(notification.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-500">{notification.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}