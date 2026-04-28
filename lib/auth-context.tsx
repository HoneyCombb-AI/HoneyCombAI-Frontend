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
import { useRouter } from "next/navigation";
import axios from "axios";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  role: 'admin' | 'user' | null;
  approvalRequired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const router = useRouter();

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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      setRole(null);
      setApprovalRequired(false);
      setError(null);
    } catch (error: unknown) {
      console.error("Error signing out:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }, [supabase]);

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        setSession(session);
        setUser(session?.user ?? null);
        setError(null);
      } catch (error: unknown) {
        console.error("Error getting user:", error);
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === "SIGNED_OUT") {
        setRole(null);
        setApprovalRequired(false);
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Non-blocking role fetch — runs independently after auth resolves.
  // Does NOT affect `loading` state so the app never hangs waiting for this.
  useEffect(() => {
    if (!user) {
      setRole(null);
      setApprovalRequired(false);
      return;
    }

    axios
      .get("/api/admin/role")
      .then((res) => {
        setRole(res.data.role || 'user');
        setApprovalRequired(res.data.approval_required ?? false);
      })
      .catch(() => {
        // Default to user role if the call fails — app still works
        setRole('user');
        setApprovalRequired(false);
      });
  }, [user]);

  const value = {
    user,
    session,
    loading,
    error,
    signOut,
    refreshSession,
    role,
    approvalRequired,
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
