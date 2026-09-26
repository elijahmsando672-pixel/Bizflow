"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

/** Routes that render without the authenticated application chrome. */
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/register",
  "/reset-password",
  "/accept-invite",
  "/verify-email",
  "/select-shop",
  "/modules",
  "/features",
  "/about",
  "/pricing",
  "/contact",
]);

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return pathname.startsWith("/auth");
}

/**
 * Single decision point for application chrome: public and auth-flow routes
 * render bare, every other route is wrapped in the BizFlow app shell.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";

  if (isPublicRoute(pathname)) return <>{children}</>;

  return <AppShell>{children}</AppShell>;
}
