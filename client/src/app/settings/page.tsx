"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building, User, Bell, Shield, Palette, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500">Manage your application preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business
            </CardTitle>
            <CardDescription>Company information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Business Name</label>
              <Input placeholder="Your business name" defaultValue="BizFlow Inc." />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input placeholder="business@example.com" defaultValue="info@bizflow.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input placeholder="+1 555-0000" defaultValue="+1 555-0000" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>User account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input placeholder="Your name" defaultValue="John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input placeholder="email@example.com" defaultValue="john@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" placeholder="Enter new password" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Update Profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive email updates</p>
              </div>
              <Input type="checkbox" className="h-5 w-5" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-gray-500">When products run low</p>
              </div>
              <Input type="checkbox" className="h-5 w-5" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Reports</p>
                <p className="text-sm text-gray-500">Daily summary email</p>
              </div>
              <Input type="checkbox" className="h-5 w-5" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Save Preferences</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Account security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Auth</p>
                <p className="text-sm text-gray-500">Add extra security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Login History</p>
                <p className="text-sm text-gray-500">View recent logins</p>
              </div>
              <Button variant="outline" size="sm">View</Button>
            </div>
            <Button variant="outline" className="w-full">Change Password</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Theme</label>
              <select className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Accent Color</label>
              <div className="mt-2 flex gap-2">
                <button className="h-8 w-8 rounded-full bg-blue-600 ring-2 ring-offset-2" />
                <button className="h-8 w-8 rounded-full bg-green-600" />
                <button className="h-8 w-8 rounded-full bg-purple-600" />
                <button className="h-8 w-8 rounded-full bg-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data
            </CardTitle>
            <CardDescription>Data management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-gray-500">Download your data</p>
              </div>
              <Button variant="outline" size="sm">Export</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Backup Settings</p>
                <p className="text-sm text-gray-500">Configure backups</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <Button variant="destructive" className="w-full">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}