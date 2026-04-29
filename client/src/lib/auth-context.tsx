"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasPermission: (resource: string, action: 'create' | 'read' | 'update' | 'delete') => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJWT(token: string): { exp: number } | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/refresh-token`,
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
        return false;
      }
      const data = await response.json();
      setToken(data.token);
      localStorage.setItem("token", data.token);
      return true;
    } catch {
      setUser(null);
      setBusiness(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("business");
      return false;
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedBusiness = localStorage.getItem("business");

    if (savedToken && savedUser && savedBusiness) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setBusiness(JSON.parse(savedBusiness));
      // Fetch fresh CSRF token for state-changing requests
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/csrf-token`,
        { method: "GET", credentials: 'include' }
      ).catch(() => {});
      setIsLoading(false);
    } else {
      // No token in storage, try to refresh using httpOnly cookie
      refreshAccessToken().then((success) => {
        if (success) {
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/csrf-token`,
            { method: "GET", credentials: 'include' }
          ).catch(() => {});
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
  }, [refreshAccessToken]);

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
      if (window.location.pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [isLoading, token, router]);

  const login = async (email: string, password: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Accept httpOnly cookie
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    setBusiness(data.business);

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("business", JSON.stringify(data.business));

    router.push("/");
  };

  const logout = async () => {
    try {
      // Call server to invalidate refresh token and clear cookie
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/logout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
        }
      );
    } catch (err) {
      // Silently fail - server may be unreachable
    } finally {
      setUser(null);
      setBusiness(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("business");
      router.push("/login");
    }
  };

  const hasPermission = useCallback(async (resource: string, action: 'create' | 'read' | 'update' | 'delete'): Promise<boolean> => {
    if (!user) return false;
    if (user.role === 'owner' || user.role === 'admin') return true;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/permissions/check?role=${user.role}&resource=${resource}`,
        { method: "GET", credentials: 'include' }
      );
      if (!response.ok) return false;
      const data = await response.json();
      return data[`can_${action}`] === true;
    } catch {
      return false;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, business, token, login, logout, isLoading, hasPermission }}>
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