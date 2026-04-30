"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building, User, Bell, Shield, Palette, Database, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

export default function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState({ name: "", email: "", phone: "", address: "", tax_id: "" });
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [notifications, setNotifications] = useState({ email: true, lowStock: true, dailyReports: false });
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [twoFADialog, setTwoFADialog] = useState(false);
  const [loginHistoryDialog, setLoginHistoryDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [theme, setTheme] = useState("Light");
  const [accentColor, setAccentColor] = useState("blue");
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const me = await api.auth.me();
      const meAny = me as any;
      setProfile({ name: meAny.name || "", email: meAny.email || "" });
      setBusiness({
        name: meAny.business_name || "",
        email: meAny.business_email || "",
        phone: meAny.phone || "",
        address: meAny.address || "",
        tax_id: meAny.tax_id || "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    toast.success("Business settings saved (demo)");
  };

  const handleUpdateProfile = async () => {
    if (!profile.name || !profile.email) {
      toast.error("Name and email are required");
      return;
    }
    toast.success("Profile updated (demo)");
  };

  const handleSaveNotifications = async () => {
    toast.success("Notification preferences saved");
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.error("All fields are required");
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordForm.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    toast.success("Password changed successfully");
    setChangePasswordDialog(false);
    setPasswordForm({ current: "", new: "", confirm: "" });
  };

  const handleEnable2FA = () => {
    toast.info("2FA setup: Scan QR code with your authenticator app (demo)");
    setTwoFADialog(true);
  };

  const handleViewLoginHistory = async () => {
    setLoginHistory([
      { ip: "192.168.1.1", device: "Chrome on Linux", date: new Date().toISOString(), status: "Success" },
      { ip: "192.168.1.2", device: "Firefox on Windows", date: new Date(Date.now() - 86400000).toISOString(), status: "Success" },
      { ip: "10.0.0.5", device: "Safari on Mac", date: new Date(Date.now() - 172800000).toISOString(), status: "Failed" },
    ]);
    setLoginHistoryDialog(true);
  };

  const handleExportData = async () => {
    try {
      const data = await api.importExport.exportData("customers", "json");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bizflow-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    } catch (err: any) {
      toast.error(err?.message || "Failed to export data");
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm !== "DELETE") {
      toast.error('Type "DELETE" to confirm');
      return;
    }
    toast.error("Account deletion is disabled in demo mode");
    setDeleteDialog(false);
    setDeleteConfirm("");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
              <Label className="text-sm font-medium">Business Name</Label>
              <Input placeholder="Your business name" value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <Input placeholder="business@example.com" value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm font-medium">Phone</Label>
              <Input placeholder="+1 555-0000" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSaveBusiness}>Save Changes</Button>
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
              <Label className="text-sm font-medium">Full Name</Label>
              <Input placeholder="Your name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <Input placeholder="email@example.com" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleUpdateProfile}>Update Profile</Button>
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
              <input type="checkbox" className="h-5 w-5" checked={notifications.email} onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-gray-500">When products run low</p>
              </div>
              <input type="checkbox" className="h-5 w-5" checked={notifications.lowStock} onChange={(e) => setNotifications({ ...notifications, lowStock: e.target.checked })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Reports</p>
                <p className="text-sm text-gray-500">Daily summary email</p>
              </div>
              <input type="checkbox" className="h-5 w-5" checked={notifications.dailyReports} onChange={(e) => setNotifications({ ...notifications, dailyReports: e.target.checked })} />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSaveNotifications}>Save Preferences</Button>
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
              <Button variant="outline" size="sm" onClick={handleEnable2FA}>Enable</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Login History</p>
                <p className="text-sm text-gray-500">View recent logins</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleViewLoginHistory}>View</Button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setChangePasswordDialog(true)}>Change Password</Button>
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
              <Label className="text-sm font-medium">Theme</Label>
              <select className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2" value={theme} onChange={(e) => { setTheme(e.target.value); toast.success(`Theme set to ${e.target.value}`); }}>
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Accent Color</Label>
              <div className="mt-2 flex gap-2">
                {["blue", "green", "purple", "red"].map((color) => (
                  <button
                    key={color}
                    className={`h-8 w-8 rounded-full bg-${color}-600 ${accentColor === color ? "ring-2 ring-offset-2" : ""}`}
                    onClick={() => { setAccentColor(color); toast.success(`Accent color set to ${color}`); }}
                  />
                ))}
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
              <Button variant="outline" size="sm" onClick={handleExportData}>Export</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Backup Settings</p>
                <p className="text-sm text-gray-500">Configure backups</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("Backup configuration (demo)")}>Configure</Button>
            </div>
            <Button variant="destructive" className="w-full" onClick={() => setDeleteDialog(true)}>Delete Account</Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={changePasswordDialog} onOpenChange={setChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current and new password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setChangePasswordDialog(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleChangePassword}>Change Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={twoFADialog} onOpenChange={setTwoFADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>Scan the QR code with your authenticator app</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-sm text-center">QR Code Placeholder<br/>(demo mode)</p>
            </div>
            <p className="text-sm text-gray-500">Enter the 6-digit code from your app to verify</p>
            <Input placeholder="000000" className="w-32 text-center text-2xl tracking-widest" maxLength={6} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTwoFADialog(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { toast.success("2FA enabled (demo)"); setTwoFADialog(false); }}>Verify & Enable</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={loginHistoryDialog} onOpenChange={setLoginHistoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {loginHistory.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{entry.device}</p>
                  <p className="text-sm text-gray-500">{entry.ip}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${entry.status === "Success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {entry.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{new Date(entry.date).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>This action cannot be undone. Type DELETE to confirm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="Type DELETE" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDeleteDialog(false); setDeleteConfirm(""); }}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
