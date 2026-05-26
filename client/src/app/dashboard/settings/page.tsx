"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { user, business } = useAuth();
  const [businessName, setBusinessName] = useState(business?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleSave = async () => {
    setStatus("saving");
    await new Promise((r) => setTimeout(r, 800));
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure your business settings.</p>
      </div>

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-white">Business Profile</h2>

        <div>
          <label className="text-gray-400 text-sm block mb-1">Business Name</label>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-1">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved ✓" : "Save Changes"}
        </button>

        {status === "saved" && (
          <p className="text-green-400 text-sm">Settings updated successfully.</p>
        )}
      </div>
    </div>
  );
}
