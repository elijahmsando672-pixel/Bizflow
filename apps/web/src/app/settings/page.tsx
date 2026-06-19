'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Building2, Save, Loader2 } from 'lucide-react';
import { authApi, businessApi } from '@/lib/api';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('');
  const [timezone, setTimezone] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [businessSaved, setBusinessSaved] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
  });

  const { data: business } = useQuery({
    queryKey: ['business'],
    queryFn: () => businessApi.getBusiness(),
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (business) {
      setBusinessName(business.name || '');
      setCurrency(business.currency || 'USD');
      setTimezone('UTC');
    }
  }, [business]);

  const profileMutation = useMutation({
    mutationFn: (data: { name: string; phone: string }) => authApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    },
  });

  const businessMutation = useMutation({
    mutationFn: (data: { name: string; currency: string; timezone: string }) => businessApi.updateBusiness(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      setBusinessSaved(true);
      setTimeout(() => setBusinessSaved(false), 2000);
    },
  });

  const handleProfileSave = () => {
    profileMutation.mutate({ name, phone });
  };

  const handleBusinessSave = () => {
    businessMutation.mutate({ name: businessName, currency, timezone });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Profile
        </h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={profile?.email ?? ''}
            disabled
            className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={profile?.name ?? 'Enter your name'}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleProfileSave}
            disabled={profileMutation.isPending}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm disabled:opacity-50"
          >
            {profileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {profileSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Business
        </h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter business name"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="KES">KES - Kenyan Shilling</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="NGN">NGN - Nigerian Naira</option>
            <option value="ZAR">ZAR - South African Rand</option>
            <option value="TZS">TZS - Tanzanian Shilling</option>
            <option value="UGX">UGX - Ugandan Shilling</option>
            <option value="RWF">RWF - Rwandan Franc</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="UTC">UTC</option>
            <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
            <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
            <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
            <option value="Africa/Cairo">Africa/Cairo (EET)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleBusinessSave}
            disabled={businessMutation.isPending}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm disabled:opacity-50"
          >
            {businessMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {businessSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
