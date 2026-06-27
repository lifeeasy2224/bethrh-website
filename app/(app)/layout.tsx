// 📁 FILE: app/(app)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';

// ── Public paths — no auth required ──────────────────────────────
const PUBLIC_PATHS = [
  '/ip-policy', '/help', '/privacy', '/terms', '/cookies', '/pricing',
];

// ── Investor-only paths ───────────────────────────────────────────
const INVESTOR_ONLY_PATHS = [
  '/greenhouse', '/investor-assistant',
];

// ── Founder-only paths ────────────────────────────────────────────
const FOUNDER_ONLY_PATHS = [
  '/founder-dashboard', '/dashboard', '/pods', '/ideas', '/chat',
  '/canvas', '/validation', '/pitch', '/journey', '/seeds', '/billing',
  '/checkout', '/admin',
];

// ── Onboarding path — needs session but no profile yet ───────────
const ONBOARDING_PATHS = ['/profile'];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, isInvestor } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const isPublic       = PUBLIC_PATHS.includes(pathname);
  const isOnboarding   = ONBOARDING_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isInvestorPath = INVESTOR_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isFounderPath  = FOUNDER_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  // Block rendering while profile is loading (but not on onboarding or public pages)
  const profilePending = !isPublic && !isOnboarding && session && !profile;

  useEffect(() => {
    if (loading) return;

    // Not logged in → send to login
    if (!session && !isPublic) {
      router.replace('/login');
      return;
    }

    // Logged in but no profile yet → send to onboarding
    if (session && !profile && !isPublic && !isOnboarding) {
      router.replace('/profile?onboard=1');
      return;
    }

    // Investor trying to access founder pages → send to greenhouse
    if (session && isInvestor && isFounderPath) {
      router.replace('/greenhouse');
      return;
    }

    // Founder trying to access investor pages → send to dashboard
    if (session && !isInvestor && isInvestorPath) {
      router.replace('/founder-dashboard');
      return;
    }
  }, [loading, session, profile, router, isPublic, isOnboarding, isInvestor, isFounderPath, isInvestorPath]);

  // Always render public pages
  if (isPublic) return <>{children}</>;

  // Show spinner while loading
  if (loading || profilePending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!session) return null;

  // Onboarding — render without AppShell (no sidebar needed)
  if (isOnboarding) return <>{children}</>;

  // Role mismatch — render nothing (redirect in effect above)
  if (isInvestor && isFounderPath) return null;
  if (!isInvestor && isInvestorPath) return null;

  // All good — render with sidebar
  return <AppShell>{children}</AppShell>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
