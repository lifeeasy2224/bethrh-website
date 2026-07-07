import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  totp_enabled: boolean;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  sessionToken: string | null;
  login: (email: string, password: string) => Promise<{ requires_2fa: boolean; session_token: string }>;
  verifyTotp: (sessionToken: string, totpCode: string, backupCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

const SESSION_KEY = 'adminSessionToken';
const ADMIN_API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`;

function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
}

async function callApi(action: string, body?: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${ADMIN_API}/${action}`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error: string }).error ?? 'Request failed');
  return data;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAdmin = useCallback(async () => {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) { setLoading(false); return; }
    try {
      const data = await callApi('me', { session_token: token }) as AdminUser;
      setAdmin(data);
      setSessionToken(token);
    } catch {
      localStorage.removeItem(SESSION_KEY);
      setAdmin(null);
      setSessionToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshAdmin(); }, [refreshAdmin]);

  // Inactivity timeout — 30 min
  useEffect(() => {
    if (!admin) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, 30 * 60 * 1000);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(e => document.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach(e => document.removeEventListener(e, reset));
    };
  }, [admin]);

  async function login(email: string, password: string) {
    const data = await callApi('login', { email, password }) as {
      session_token: string;
      requires_2fa: boolean;
      admin: AdminUser | null;
    };
    if (!data.requires_2fa && data.admin) {
      localStorage.setItem(SESSION_KEY, data.session_token);
      setSessionToken(data.session_token);
      setAdmin(data.admin);
    }
    return { requires_2fa: data.requires_2fa, session_token: data.session_token };
  }

  async function verifyTotp(token: string, totpCode: string, backupCode?: string) {
    const data = await callApi('verify-2fa', {
      session_token: token,
      totp_code: totpCode,
      backup_code: backupCode,
    }) as { admin: AdminUser };
    localStorage.setItem(SESSION_KEY, token);
    setSessionToken(token);
    setAdmin(data.admin);
  }

  async function logout() {
    const token = localStorage.getItem(SESSION_KEY);
    try { await callApi('logout', { session_token: token ?? '' }); } catch { /* ignore */ }
    localStorage.removeItem(SESSION_KEY);
    setAdmin(null);
    setSessionToken(null);
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, sessionToken, login, verifyTotp, logout, refreshAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}

export { callApi, apiHeaders, ADMIN_API, SESSION_KEY };
