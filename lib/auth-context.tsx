"use client";

import { createClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import type { RoleResponse } from "@/types/admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  role: 'admin' | 'user' | null;
  approvalRequired: boolean;
  setApprovalRequired: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();
      if (error) throw error;

      setSession(session);
      setUser(session?.user ?? null);
      setError(null);
    } catch (error: unknown) {
      console.error("Error refreshing session:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    setRole(null);
    setApprovalRequired(false);
    setError(null);

    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
    } catch (error: unknown) {
      console.error("Error signing out locally:", error);
    } finally {
      window.location.replace("/auth/signout");
    }
  }, [supabase]);

  useEffect(() => {
    // Single source of truth: onAuthStateChange handles INITIAL_SESSION
    // as well as subsequent auth events — no separate getSession() needed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setError(null);
      setLoading(false);

      if (event === "SIGNED_OUT") {
        setRole(null);
        setApprovalRequired(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Scope browser cache per user — prevents stale data after sign-out → sign-in
  // with a different account. Adds _uid=<userId> to all GET /api/* requests so
  // each user's responses are cached under unique URLs.
  useEffect(() => {
    const id = axios.interceptors.request.use((config) => {
      if (config.method === 'get' && user?.id && config.url?.startsWith('/api/')) {
        config.params = { ...config.params, _uid: user.id };
      }
      return config;
    });
    return () => axios.interceptors.request.eject(id);
  }, [user?.id]);

  // Non-blocking role fetch — runs independently after auth resolves.
  // Does NOT affect `loading` state so the app never hangs waiting for this.
  useEffect(() => {
    if (!user) {
      setRole(null);
      setApprovalRequired(false);
      return;
    }

    axios
      .get<RoleResponse>("/api/admin/role")
      .then((res) => {
        setRole(res.data.role || 'user');
        setApprovalRequired(res.data.approval_required ?? false);
      })
      .catch(() => {
        // Default to user role if the call fails — app still works
        setRole('user');
        setApprovalRequired(false);
      });
  }, [user?.id]);

  const value = {
    user,
    session,
    loading,
    error,
    signOut,
    refreshSession,
    role,
    approvalRequired,
    setApprovalRequired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
