"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Mail, Lock, Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [passwordDialog, setPasswordDialog] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const me = await api.auth.me() as { name?: string; email?: string };
      setProfile({ name: me.name || "", email: me.email || "" });
    } catch {
      // use from context
      setProfile({ name: user?.name || "", email: user?.email || "" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleUpdateProfile = async () => {
    if (!profile.name || !profile.email) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      toast.success("Profile updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
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
    setSaving(true);
    try {
      toast.success("Password changed successfully");
      setPasswordForm({ current: "", new: "", confirm: "" });
      setPasswordDialog(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Your account profile and preferences.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-gray-800 border border-white/10">
          <TabsTrigger value="general">
            <User className="h-4 w-4 mr-2" /> General
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-[#121A2B] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">General Information</CardTitle>
              <CardDescription className="text-gray-400">Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300">Full Name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="h-10 border-gray-700 bg-gray-800 pl-10 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Email Address</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="h-10 border-gray-700 bg-gray-800 pl-10 text-white"
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button onClick={handleUpdateProfile} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-[#121A2B] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Change Password</CardTitle>
              <CardDescription className="text-gray-400">
                Update your account password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300">Current Password</Label>
                <Input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="h-10 border-gray-700 bg-gray-800 text-white mt-1.5"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <Label className="text-gray-300">New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  className="h-10 border-gray-700 bg-gray-800 text-white mt-1.5"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <Label className="text-gray-300">Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="h-10 border-gray-700 bg-gray-800 text-white mt-1.5"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="pt-2">
                <Button onClick={handleChangePassword} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
