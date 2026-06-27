"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userRaw = searchParams.get("user");
    const businessRaw = searchParams.get("business");
    const error = searchParams.get("error");

    if (error) {
      router.push(`/login?error=${error}`);
      return;
    }

    if (token && userRaw && businessRaw) {
      try {
        const user = JSON.parse(userRaw);
        const business = JSON.parse(businessRaw);

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("business", JSON.stringify(business));

        window.location.href = "/";
      } catch {
        router.push("/login?error=invalid_callback_data");
      }
    } else {
      router.push("/login?error=missing_params");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Completing sign-in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Completing sign-in...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
