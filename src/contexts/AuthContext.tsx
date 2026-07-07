import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, type Profile } from '../supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'founder' | 'investor') => Promise<{ error: Error | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setProfile(data ?? null);
  }

  async function updateStreak(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: prof } = await supabase.from('profiles').select('last_login_date, current_streak').eq('user_id', userId).maybeSingle();
    if (!prof) return;

    const last = prof.last_login_date as string | null;
    let newStreak = prof.current_streak as number ?? 0;

    if (last === today) {
      return; // already logged in today
    } else if (last) {
      const diff = (new Date(today).getTime() - new Date(last).getTime()) / 86400000;
      newStreak = diff <= 1 ? newStreak + 1 : 1;
    } else {
      newStreak = 1;
    }

    await supabase.from('profiles').update({ last_login_date: today, current_streak: newStreak }).eq('user_id', userId);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        supabase.auth.signOut();
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        await updateStreak(session.user.id);
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setUser(session?.user ?? null);
          if (session?.user) {
            await updateStreak(session.user.id);
            await fetchProfile(session.user.id);
          } else setProfile(null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'INITIAL_SESSION') {
          setUser(session?.user ?? null);
          if (session?.user) {
            await updateStreak(session.user.id);
            await fetchProfile(session.user.id);
          } else setProfile(null);
          setLoading(false);
        } else if ((event as string) === 'TOKEN_REFRESH_ERROR') {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string, fullName: string, role: 'founder' | 'investor') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    // When email confirmation is required, signUp succeeds but returns no session.
    return { error: error as Error | null, needsConfirmation: !error && !data.session };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
