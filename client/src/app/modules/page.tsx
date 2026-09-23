"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "@/components/modules/dashboard";
import { WelcomeScreen } from "@/components/modules/welcome-screen";
import { ONBOARDING_STORAGE_KEY } from "@/lib/modules-data";

export default function ModulesHomePage() {
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      setDone(localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1");
    } catch {
      setDone(false);
    }
    setReady(true);
  }, []);

  const markComplete = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDone(true);
  };

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return done ? <Dashboard /> : <WelcomeScreen onComplete={markComplete} onSkip={markComplete} />;
}