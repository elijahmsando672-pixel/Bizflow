"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }
    api.auth.verifyEmail(token).then(() => {
      setStatus("success");
      setMessage("Email verified successfully! You can now access all features.");
    }).catch((err: any) => {
      setStatus("error");
      setMessage(err?.message || "Invalid or expired verification link.");
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full shadow-lg text-center">
        {status === "loading" && (
          <>
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Verifying your email...</h1>
            <p className="text-sm text-muted-foreground">Please wait a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-7 w-7 text-success" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Email Verified!</h1>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            <button
              onClick={() => router.push("/login")}
              className="py-2.5 px-6 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Go to Login
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Verification Failed</h1>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            <button
              onClick={() => router.push("/login")}
              className="py-2.5 px-6 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
