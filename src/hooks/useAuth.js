import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession),
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    signUp,
    signIn,
    signOut,
    isSupabaseConfigured,
  };
}
