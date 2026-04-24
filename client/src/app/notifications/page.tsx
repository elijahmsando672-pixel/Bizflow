"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Check, Clock, AlertTriangle, Info, CheckCircle } from "lucide-react";

const notifications = [
  { id: 1, title: "Low Stock Alert", message: "Wireless Mouse is running low (5 remaining)", type: "warning", date: "2024-01-15 10:30", read: false },
  { id: 2, title: "New Sale", message: "John Doe made a purchase of $450", type: "success", date: "2024-01-15 09:15", read: false },
  { id: 3, title: "Payment Received", message: "$2,000 payment from Alice Brown", type: "success", date: "2024-01-14 16:45", read: true },
  { id: 4, title: "Expense Approved", message: "Office Supplies expense approved", type: "info", date: "2024-01-14 14:20", read: true },
  { id: 5, title: "Overdue Payment", message: "$150 payment from Bob Wilson is overdue", type: "warning", date: "2024-01-13 10:00", read: true },
];

const getIcon = (type: string) => {
  switch (type) {
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    default:
      return <Info className="h-5 w-5 text-blue-600" />;
  }
};

const getBgColor = (type: string) => {
  switch (type) {
    case "warning":
      return "bg-yellow-50";
    case "success":
      return "bg-green-50";
    default:
      return "bg-blue-50";
  }
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-500">Stay updated with your business</p>
        </div>
        <Button variant="outline">
          <Check className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Notifications</CardDescription>
            <CardTitle className="text-3xl">24</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Bell className="h-4 w-4" />
              Unread: 12
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Warnings</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">5</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              Requires attention
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-3xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              Latest updates
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
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 rounded-lg border border-gray-200 p-4 ${
                  !notification.read && "bg-blue-50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getBgColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{notification.title}</p>
                    <span className="text-sm text-gray-500">{notification.date}</span>
                  </div>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                </div>
                {!notification.read && (
                  <Button variant="ghost" size="sm">
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}