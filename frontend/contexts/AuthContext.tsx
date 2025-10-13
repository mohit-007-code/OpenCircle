"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "./ToastContext";

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  profile_picture?: string;
  cover_image?: string;
  date_joined?: string;
  created_at?: string;
}

interface Tokens {
  access: string;
  refresh: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (user: User, tokens: Tokens) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { showToast } = useToast();

  // ✅ Check authentication once on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      checkAuth();
    }
  }, []);

  // ✅ Verify stored token and fetch profile
  const checkAuth = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/profile/");
      setUser(response.data);
    } catch (error: any) {
      console.error("Auth check failed:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Called after manual or Google login
  const login = (userData: User, tokens: Tokens) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
    }
    setUser(userData);
    showToast(`Welcome back, ${userData.username}! 🎉`, "success");
    router.push("/");
  };

  // ✅ Logout + Toast + Redirect
  const logout = () => {
    const username = user?.username || "User";

    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    setUser(null);
    showToast(`Goodbye, ${username}! See you soon! 👋`, "info");

    // Small delay for animation/toast
    setTimeout(() => router.push("/auth"), 600);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
