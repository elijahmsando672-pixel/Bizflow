"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
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
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshAccessToken = async () => {
    if (!refreshToken) return false;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/refresh-token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        }
      );
      if (!response.ok) return false;
      const data = await response.json();
      setToken(data.token);
      setRefreshToken(data.refreshToken);
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedRefreshToken = localStorage.getItem("refreshToken");
    const savedUser = localStorage.getItem("user");
    const savedBusiness = localStorage.getItem("business");

    if (savedToken && savedUser && savedBusiness) {
      setToken(savedToken);
      setRefreshToken(savedRefreshToken);
      setUser(JSON.parse(savedUser));
      setBusiness(JSON.parse(savedBusiness));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && token) {
      const decoded = decodeJWT(token);
      if (decoded) {
        const expiresIn = decoded.exp * 1000 - Date.now();
        if (expiresIn < 0) {
          refreshAccessToken();
        } else if (expiresIn < 5 * 60 * 1000) {
          refreshAccessToken();
        }
      }
    }
  }, [isLoading, token]);

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
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    setBusiness(data.business);

    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("business", JSON.stringify(data.business));

    router.push("/");
  };

  const logout = () => {
    setUser(null);
    setBusiness(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("business");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, business, token, refreshToken, login, logout, isLoading }}>
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