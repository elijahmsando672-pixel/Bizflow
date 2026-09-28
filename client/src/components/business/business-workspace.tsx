"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BUSINESS_MODULES, type BusinessModule } from "@/lib/business-modules";
import { businessCodeOf, firstNameOf } from "@/lib/initials";
import { BusinessHeader } from "@/components/business/business-header";
import { ModuleGrid } from "@/components/business/module-grid";
import { WorkspaceError } from "@/components/business/workspace-error";
import { WorkspaceLoading } from "@/components/business/workspace-loading";

interface WorkspaceIdentity {
  userName: string;
  userRole: string;
  businessName: string;
  businessLogo: string | null;
}

/**
 * Flat row from `GET /auth/me`. The endpoint resolves the business through the
 * caller's JWT, so no business id is ever taken from the browser.
 */
interface MeResponse {
  name?: string | null;
  role?: string | null;
  business_name?: string | null;
  logo_url?: string | null;
}

type WorkspaceStatus = "loading" | "ready" | "error";

/**
 * Post-authentication launcher: the first screen after registering a business or
 * signing in. Presents the business and lets the owner pick a module.
 */
export function BusinessWorkspace() {
  const router = useRouter();
  const { token, isLoading, selectedShop, shops, setSelectedShop, logout } = useAuth();

  const [status, setStatus] = useState<WorkspaceStatus>("loading");
  const [identity, setIdentity] = useState<WorkspaceIdentity | null>(null);

  useEffect(() => {
    if (!isLoading && !token) router.replace("/login");
  }, [isLoading, token, router]);

  const loadIdentity = useCallback(async () => {
    setStatus("loading");
    try {
      const data = (await api.auth.me()) as MeResponse | null;
      const businessName = (data?.business_name ?? "").trim();
      if (!businessName) throw new Error("Business name missing from account payload");

      setIdentity({
        userName: (data?.name ?? "").trim(),
        userRole: (data?.role ?? "").trim(),
        businessName,
        businessLogo: data?.logo_url?.trim() || null,
      });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (isLoading || !token) return;
    void loadIdentity();
  }, [isLoading, token, loadIdentity]);

  // A business with exactly one shop has nothing to pick, so skip the chooser.
  useEffect(() => {
    if (selectedShop || shops.length !== 1) return;
    setSelectedShop(shops[0]);
  }, [selectedShop, shops, setSelectedShop]);

  const handleSelect = useCallback(
    (module: BusinessModule) => {
      // A multi-shop business picks its branch first, then lands on the module.
      if (!selectedShop) {
        router.push(`/select-shop?next=${encodeURIComponent(module.href)}`);
        return;
      }
      router.push(module.href);
    },
    [router, selectedShop]
  );

  if (status === "loading") return <WorkspaceLoading />;
  if (status === "error" || !identity) return <WorkspaceError onRetry={loadIdentity} />;

  const code = businessCodeOf({ name: identity.businessName });
  const greeting = firstNameOf(identity.userName);

  return (
    <div className="bw-root">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-4 min-[651px]:gap-6 min-[651px]:px-6 min-[651px]:py-6">
        <BusinessHeader
          businessName={identity.businessName}
          businessLogo={identity.businessLogo}
          userName={identity.userName}
          userRole={identity.userRole}
          shopName={selectedShop?.name ?? null}
          onSignOut={logout}
        />

        <section className="animate-fade-in px-1">
          <h1 className="bw-ink text-lg font-bold min-[651px]:text-2xl">
            Welcome back, {greeting} <span aria-hidden>👋</span>
          </h1>
          <p className="bw-ink-soft mt-1 text-[13px] min-[651px]:text-sm">
            Managing {identity.businessName}
            {code ? <span> ({code})</span> : null}
          </p>
        </section>

        <ModuleGrid modules={BUSINESS_MODULES} onSelect={handleSelect} />
      </div>
    </div>
  );
}

export default BusinessWorkspace;
