"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min idle
const WARNING_BEFORE_MS = 60 * 1000; // warn 1 min before

export interface Shop {
  id: string;
  name: string;
  location?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Business {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  business: Business | null;
  shops: Shop[];
  selectedShop: Shop | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithOTP: (data: { email?: string; phone?: string; otp: string }) => Promise<void>;
  register: (name: string, email: string, password: string, businessName: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  setSelectedShop: (shop: Shop) => void;
  fetchShops: () => Promise<void>;
  hasPermission: (resource: string, action: 'create' | 'read' | 'update' | 'delete') => Promise<boolean>;
  showIdleWarning: boolean;
  resetIdleTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setTokenCookie(token: string) {
  document.cookie = `token=${token}; path=/; max-age=${7 * 86400}; SameSite=Lax`;
}

function removeTokenCookie() {
  document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
}

function decodeJWT(token: string): { exp: number } | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShopState] = useState<Shop | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const refreshCooldown = useRef(false);

  const fetchShops = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api"}/shops`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setShops(data);
        return data;
      }
    } catch {}
    return [];
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (refreshCooldown.current) return false;
    refreshCooldown.current = true;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/refresh-token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) {
        setUser(null);
        setBusiness(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("business");
        removeTokenCookie();
        return false;
      }
      const data = await response.json();
      setToken(data.token);
      localStorage.setItem("token", data.token);
      setTokenCookie(data.token);
      return true;
    } catch {
      setUser(null);
      setBusiness(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("business");
      removeTokenCookie();
      return false;
    } finally {
      setTimeout(() => { refreshCooldown.current = false; }, 10000);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedBusiness = localStorage.getItem("business");

    if (savedToken && savedUser && savedBusiness) {
      setToken(savedToken);
      setTokenCookie(savedToken);
      try { setUser(JSON.parse(savedUser)); } catch { setUser(null); }
      try { setBusiness(JSON.parse(savedBusiness)); } catch { setBusiness(null); }
      const savedShop = localStorage.getItem("selectedShop");
      if (savedShop) { try { setSelectedShopState(JSON.parse(savedShop)); } catch {} }
      fetchShops();
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/csrf-token`,
        { method: "GET", credentials: 'include' }
      ).catch(() => {});
      setIsLoading(false);
    } else {
      refreshAccessToken().then((success) => {
        if (success) {
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/csrf-token`,
            { method: "GET", credentials: 'include' }
          ).catch(() => {});
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
  }, [refreshAccessToken, fetchShops]);

  useEffect(() => {
    if (!isLoading && token) {
      const decoded = decodeJWT(token);
      if (decoded) {
        const expiresIn = decoded.exp * 1000 - Date.now();
        if (expiresIn < 0 || expiresIn < 5 * 60 * 1000) {
          refreshAccessToken();
        }
      }
    }
  }, [isLoading, token, refreshAccessToken]);

  useEffect(() => {
    if (!isLoading && !token && router) {
      const publicPages = ["/", "/login", "/signup", "/register", "/reset-password", "/accept-invite", "/pricing", "/features", "/about", "/contact", "/select-shop"];
      if (!publicPages.includes(window.location.pathname)) {
        router.push("/login");
      }
    }
  }, [isLoading, token, router]);

  const login = async (email: string, password: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      let msg = "Login failed";
      try { const err = await response.json(); msg = err.error || msg; } catch {}
      throw new Error(msg);
    }

    let data: any;
    try { data = await response.json(); } catch { throw new Error("Invalid server response"); }
    setToken(data.token);
    setUser(data.user);
    setBusiness(data.business);
    if (data.shops) setShops(data.shops);

    localStorage.setItem("token", data.token);
    setTokenCookie(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("business", JSON.stringify(data.business));

    if (data.shops && data.shops.length === 1) {
      setSelectedShopState(data.shops[0]);
      localStorage.setItem("selectedShop", JSON.stringify(data.shops[0]));
      router.push("/dashboard");
    } else {
      router.push("/select-shop");
    }
  };

  const loginWithOTP = async (data: { email?: string; phone?: string; otp: string }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/verify-otp-login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      let msg = "Invalid OTP";
      try { const err = await response.json(); msg = err.error || msg; } catch {}
      throw new Error(msg);
    }

    let result: any;
    try { result = await response.json(); } catch { throw new Error("Invalid server response"); }
    setToken(result.token);
    setUser(result.user);
    setBusiness(result.business);
    if (result.shops) setShops(result.shops);

    localStorage.setItem("token", result.token);
    setTokenCookie(result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    localStorage.setItem("business", JSON.stringify(result.business));

    if (result.shops && result.shops.length === 1) {
      setSelectedShopState(result.shops[0]);
      localStorage.setItem("selectedShop", JSON.stringify(result.shops[0]));
      router.push("/dashboard");
    } else {
      router.push("/select-shop");
    }
  };

  const register = async (name: string, email: string, password: string, businessName: string, phone?: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, business_name: businessName, phone }),
        credentials: 'include',
      }
    );

    let data: any;
    try { data = await response.json(); } catch { throw new Error("Invalid server response"); }
    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    setToken(data.token);
    setUser(data.user);
    setBusiness(data.business);
    if (data.shops) setShops(data.shops);

    localStorage.setItem("token", data.token);
    setTokenCookie(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("business", JSON.stringify(data.business));

    if (data.shops && data.shops.length === 1) {
      setSelectedShopState(data.shops[0]);
      localStorage.setItem("selectedShop", JSON.stringify(data.shops[0]));
      router.push("/dashboard");
    } else {
      router.push("/select-shop");
    }
  };

  // ── Session idle timeout ──
  const clearIdleTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/logout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
        }
      );
    } catch {
      console.error('Logout request failed');
    }
    setUser(null);
    setBusiness(null);
    setShops([]);
    setSelectedShopState(null);
    setToken(null);
    setShowIdleWarning(false);
    clearIdleTimers();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("business");
    localStorage.removeItem("selectedShop");
    removeTokenCookie();
    router.push("/login");
  }, [router, clearIdleTimers]);

  const startIdleTimer = useCallback(() => {
    clearIdleTimers();
    if (!token) return;
    idleTimer.current = setTimeout(() => {
      setShowIdleWarning(true);
      warningTimer.current = setTimeout(() => {
        logout();
      }, WARNING_BEFORE_MS);
    }, SESSION_TIMEOUT_MS);
  }, [token, logout, clearIdleTimers]);

  const resetIdleTimer = useCallback(() => {
    setShowIdleWarning(false);
    clearIdleTimers();
    startIdleTimer();
  }, [startIdleTimer, clearIdleTimers]);

  useEffect(() => {
    if (!token) { clearIdleTimers(); setShowIdleWarning(false); return; }
    startIdleTimer();
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    events.forEach(e => window.addEventListener(e, resetIdleTimer));
    return () => {
      clearIdleTimers();
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
    };
  }, [token, startIdleTimer, resetIdleTimer, clearIdleTimers]);

  const hasPermission = useCallback(async (resource: string, action: 'create' | 'read' | 'update' | 'delete'): Promise<boolean> => {
    if (!user) return false;
    if (user.role === 'owner' || user.role === 'admin') return true;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api"}/permissions/check?role=${encodeURIComponent(user.role)}&resource=${encodeURIComponent(resource)}`,
        { method: "GET", credentials: 'include' }
      );
      if (!response.ok) return false;
      const data = await response.json();
      return data[`can_${action}`] === true;
    } catch {
      return false;
    }
  }, [user]);

  const setSelectedShop = (shop: Shop) => {
    setSelectedShopState(shop);
    localStorage.setItem("selectedShop", JSON.stringify(shop));
  };

  return (
    <AuthContext.Provider value={{ user, business, shops, selectedShop, token, login, loginWithOTP, register, logout, isLoading, setSelectedShop, fetchShops, hasPermission, showIdleWarning, resetIdleTimer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
