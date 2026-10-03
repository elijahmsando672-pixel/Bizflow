"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import AuthGuard from "@/components/auth/AuthGuard";

const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/register",
  "/reset-password",
  "/accept-invite",
  "/verify-email",
  "/select-shop",
  "/features",
  "/about",
  "/pricing",
  "/contact",
  "/business",
]);

/**
 * Authenticated routes that render full-bleed — no sidebar, no topbar, no
 * footer — but still pass through AuthGuard so the session is validated.
 * Useful for kiosk/POS screens and other pages where every pixel matters.
 */
const FULL_BLEED_ROUTES = new Set([
  "/dashboard/sales/new",
]);

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return pathname.startsWith("/auth");
}

function isFullBleedRoute(pathname: string): boolean {
  return FULL_BLEED_ROUTES.has(pathname);
}

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";

  if (isPublicRoute(pathname)) return <>{children}</>;
  if (isFullBleedRoute(pathname)) return <AuthGuard>{children}</AuthGuard>;

  return <AppShell>{children}</AppShell>;
}
