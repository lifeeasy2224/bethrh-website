'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupaUser } from '@supabase/supabase-js';
import { supabase, User } from './supabase';

type AuthContextType = {
  session: Session | null;
  supaUser: SupaUser | null;
  profile: User | null;
  isAdmin: boolean;
  isInvestor: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  supaUser: null,
  profile: null,
  isAdmin: false,
  isInvestor: false,
  loading: true,
  refreshProfile: async () => {},
});

function getIsAdmin(session: Session | null): boolean {
  return session?.user?.app_metadata?.role === 'admin';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supaUser, setSupaUser] = useState<SupaUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string): Promise<User | null> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return data;
  }

  async function refreshProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const data = await fetchProfile(session.user.id);
      setProfile(data);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setSupaUser(session?.user ?? null);
      if (session?.user) {
        const data = await fetchProfile(session.user.id);
        setProfile(data);
      }
      setLoading(false);  // only set false AFTER profile is loaded
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      setSession(session);
      setSupaUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          const data = await fetchProfile(session.user.id);
          setProfile(data);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      supaUser,
      profile,
      isAdmin: getIsAdmin(session),
      isInvestor: profile?.role === 'investor',
      loading,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
