"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { Sun, Moon, Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, ArrowLeft, Smartphone, KeyRound, ShieldAlert } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import dynamic from "next/dynamic";

const Turnstile = dynamic(() => import("@/components/auth/Turnstile"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const BASE_URL = API_URL.replace(/\/api$/, "").replace(/\/$/, "");

type LoginMode = "password" | "otp";
type ResetStep = "email" | "otp" | "password";

export default function LoginPage() {
  const [email, setEmail] = useState("elijah@bizflow.com");
  const [password, setPassword] = useState("Test@1234");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("password");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [requireCaptcha, setRequireCaptcha] = useState(false);
  const { login, loginWithOTP, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (token) router.replace("/modules");
  }, [token, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setError({ google_auth_failed: "Google sign-in failed. Please try again.", apple_auth_failed: "Apple sign-in failed. Please try again.", server_error: "Something went wrong. Please try again.", invalid_callback_data: "Invalid sign-in data received.", missing_params: "Missing sign-in parameters." }[err] || "Sign-in failed. Please try again.");
  }, []);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const id = setInterval(() => setOtpTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [otpTimer]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      const code = (err as any)?.code || "";
      if (code === "CAPTCHA_REQUIRED" || msg.includes("security check")) {
        setRequireCaptcha(true);
        setError("Please complete the security check.");
      } else if (msg === "Failed to fetch" || msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("Network")) {
        setError("Unable to reach server. Check your internet connection or the API URL may be misconfigured.");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaLogin = async (captchaToken: string) => {
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, captcha_token: captchaToken }),
          credentials: 'include',
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Login failed");
      }
      const data = await response.json();
      localStorage.setItem("token", data.token);
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`;
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("business", JSON.stringify(data.business));
      if (data.shops) localStorage.setItem("shops", JSON.stringify(data.shops));
      window.location.href = "/modules";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setRequireCaptcha(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, purpose: "login" }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to send OTP");
      } else {
        setMessage("OTP sent to your email");
        setOtpTimer(600);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await loginWithOTP({ email, otp });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetOTP = async () => {
    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, purpose: "password_reset" }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to send OTP");
      } else {
        setMessage("OTP sent to your email");
        setOtpTimer(600);
        setResetStep("otp");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetOTP = async () => {
    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/verify-otp-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Invalid OTP");
      } else {
        setResetToken(data.reset_token);
        setResetStep("password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, password: newPassword }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to reset password");
      } else {
        setMessage("Password reset successfully! Redirecting to login...");
        setIsForgotPassword(false);
        setResetStep("email");
        setOtp("");
        setNewPassword("");
        setResetToken("");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const otpExpiry = otpTimer > 0 ? `${Math.floor(otpTimer / 60)}:${String(otpTimer % 60).padStart(2, "0")}` : "";

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-primary/25 dark:bg-primary/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-warning/20 dark:bg-warning/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute w-96 h-96 bg-destructive/15 dark:bg-destructive/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <button
        onClick={toggleTheme}
        className="absolute right-6 top-6 z-20 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
        aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      >
        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="text-center mb-8 animate-slide-up">
          <Link href="/">
            <div className="w-16 h-16 relative mb-4 mx-auto rounded-lg overflow-hidden shadow-md shadow-primary/20 hover:scale-105 transition-transform cursor-pointer">
              <Image src="/logo.png" alt="BizFlow" fill sizes="64px" className="object-contain" />
            </div>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">BizFlow</h1>
          <p className="text-muted-foreground">Modern Business Management Software</p>
        </div>

        <div className="bg-card/90 backdrop-blur-xl rounded-lg p-8 shadow-modal border border-border animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isForgotPassword
                ? resetStep === "password" ? "Set New Password" : "Reset Password"
                : "Welcome Back"}
            </h2>
            <p className="text-muted-foreground">
              {isForgotPassword
                ? resetStep === "email" ? "Enter your email to receive a reset code"
                  : resetStep === "otp" ? "Enter the code sent to your email"
                  : "Choose a new password"
                : "Sign in to your account to continue"}
            </p>
          </div>

          {!isForgotPassword && (
            <div className="flex mb-6 bg-muted rounded-md p-1">
              <button
                type="button"
                onClick={() => { setLoginMode("password"); setError(""); setMessage(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginMode === "password" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Lock className="h-3.5 w-3.5 inline mr-1.5" />
                Password
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode("otp"); setError(""); setMessage(""); setOtp(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginMode === "otp" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Smartphone className="h-3.5 w-3.5 inline mr-1.5" />
                Send Code
              </button>
            </div>
          )}

          {/* Password Login */}
          {!isForgotPassword && loginMode === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-muted/60 border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all h-auto"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Password</label>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setResetStep("email"); setOtp(""); setError(""); setMessage(""); }}
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-muted/60 border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all h-auto"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    aria-label="Show password"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                  {error.includes("security check") && <ShieldAlert className="h-4 w-4 flex-shrink-0" />}
                  {error}
                </div>
              )}

              {requireCaptcha && (
                <div className="space-y-3">
                  <Turnstile onVerify={handleCaptchaLogin} />
                  <p className="text-xs text-muted-foreground text-center">Complete the security check to continue</p>
                </div>
              )}

              {!requireCaptcha && (
                <Button type="submit" disabled={isLoading} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-auto">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              )}
            </form>
          )}

          {/* OTP Login */}
          {!isForgotPassword && loginMode === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-muted/60 border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all h-auto"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {!message && !otpTimer ? (
                <Button type="button" onClick={handleSendOTP} disabled={isLoading || !email} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-auto">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Smartphone className="h-5 w-5" />}
                  {isLoading ? "Sending..." : "Send OTP"}
                </Button>
              ) : (
                <>
                  {message && !error && (
                    <div className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success flex items-center justify-between">
                      <span>{message}</span>
                      {otpExpiry && <span className="font-mono text-xs">{otpExpiry}</span>}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">One-Time Code</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        maxLength={6}
                        className="w-full pl-12 pr-4 py-3 bg-muted/60 border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all h-auto text-center text-2xl tracking-widest"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={isLoading || otp.length !== 6} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-auto">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                    {isLoading ? "Verifying..." : "Verify & Sign In"}
                  </Button>

                  {otpTimer === 0 && (
                    <button type="button" onClick={handleSendOTP} className="w-full text-center text-sm text-primary hover:underline mt-2 bg-transparent border-none cursor-pointer">
                      Resend OTP
                    </button>
                  )}
                </>
              )}
            </form>
          )}

          {/* Forgot Password - Step 1: Email */}
          {isForgotPassword && resetStep === "email" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-muted/60 border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all h-auto"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                  {message}
                </div>
              )}

              <Button type="button" onClick={handleSendResetOTP} disabled={isLoading || !email} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-auto">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                {isLoading ? "Sending..." : "Send Reset Code"}
              </Button>
            </div>
          )}

          {/* Forgot Password - Step 2: OTP */}
          {isForgotPassword && resetStep === "otp" && (
            <div className="space-y-5">
              {message && (
                <div className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success flex items-center justify-between">
                  <span>{message}</span>
                  {otpExpiry && <span className="font-mono text-xs">{otpExpiry}</span>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">One-Time Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    className="w-full pl-12 pr-4 py-3 bg-muted/60 border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all h-auto text-center text-2xl tracking-widest"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="button" onClick={handleVerifyResetOTP} disabled={isLoading || otp.length !== 6} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-auto">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <button type="button" onClick={handleSendResetOTP} className="w-full text-center text-sm text-primary hover:underline bg-transparent border-none cursor-pointer">
                Resend code
              </button>
            </div>
          )}

          {/* Forgot Password - Step 3: New Password */}
          {isForgotPassword && resetStep === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 10 characters"
                    className="w-full pl-12 pr-12 py-3 bg-muted/60 border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all h-auto"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                  {message}
                </div>
              )}

              <Button type="submit" disabled={isLoading || !newPassword} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-auto">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          {/* Footer links */}
          {isForgotPassword && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setResetStep("email"); setOtp(""); setNewPassword(""); setError(""); setMessage(""); }}
                className="text-primary hover:text-primary/80 font-semibold transition-colors bg-transparent border-none cursor-pointer"
              >
                Back to login
              </button>
            </p>
          )}

          {!isForgotPassword && (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => window.location.href = `${BASE_URL}/auth/google`}
                    className="flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.href = `${BASE_URL}/auth/apple`}
                    className="flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Apple
                  </button>
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <a href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  Register your business
                </a>
              </p>
            </>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <p>Multi-tenant support &bull; Secure &bull; Scalable</p>
        </div>
      </div>
    </main>
  );
}
