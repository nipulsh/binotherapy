"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const lastActiveUpdateRef = useRef<number>(0);

  // Update user's last active timestamp in profile
  const updateLastActive = useCallback(
    async (userId: string) => {
      const now = Date.now();
      // Only update every 5 minutes to avoid excessive writes
      if (now - lastActiveUpdateRef.current < 5 * 60 * 1000) return;

      try {
        const { error: updateError } = await (
          supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from("profiles") as any
        )
          .update({ updated_at: new Date().toISOString() })
          .eq("id", userId);

        if (updateError) {
          console.error("Failed to update last active:", updateError);
        } else {
          lastActiveUpdateRef.current = now;
        }
      } catch (err) {
        console.error("Error updating last active:", err);
      }
    },
    [supabase]
  );

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session: newSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError) throw refreshError;

      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        await updateLastActive(newSession.user.id);
      }

      return newSession;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh session";
      setError(errorMessage);
      console.error("Session refresh error:", err);
      return null;
    }
  }, [supabase, updateLastActive]);

  // Update user profile
  const updateProfile = useCallback(
    async (updates: { full_name?: string; avatar_url?: string }) => {
      if (!user) {
        setError("No user logged in");
        return false;
      }

      try {
        const { error: updateError } = await (
          supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from("profiles") as any
        )
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) throw updateError;

        // Refresh user data
        await refreshSession();
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update profile";
        setError(errorMessage);
        console.error("Profile update error:", err);
        return false;
      }
    },
    [user, supabase, refreshSession]
  );

  useEffect(() => {
    let mounted = true;
    let refreshInterval: NodeJS.Timeout | null = null;

    // Get initial session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            await updateLastActive(initialSession.user.id);
          }
        }
      } catch (err) {
        if (mounted) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get session";
          setError(errorMessage);
          console.error("Auth initialization error:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up session refresh interval (every 55 minutes, before 60min expiry)
    refreshInterval = setInterval(() => {
      if (session && user) {
        refreshSession();
      }
    }, 55 * 60 * 1000);

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await updateLastActive(newSession.user.id);

        // Update profile if it doesn't exist
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", newSession.user.id)
          .single();

        if (!profile && newSession.user.email) {
          // Create profile if it doesn't exist
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (
            supabase
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .from("profiles") as any
          ).insert({
            id: newSession.user.id,
            email: newSession.user.email,
            full_name: newSession.user.user_metadata?.full_name || null,
          });
        }

        router.refresh();
      } else {
        router.push("/login");
      }
    });

    return () => {
      mounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      subscription.unsubscribe();
    };
  }, [router, supabase, updateLastActive, refreshSession, session, user]);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) throw signOutError;

      setUser(null);
      setSession(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign out";
      setError(errorMessage);
      console.error("Sign out error:", err);
    }
  }, [supabase, router]);

  return {
    user,
    session,
    loading,
    error,
    signOut,
    refreshSession,
    updateProfile,
  };
}
