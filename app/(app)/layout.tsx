'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';

const PUBLIC_PATHS = ['/ip-policy', '/help', '/privacy', '/terms', '/cookies', '/pricing'];
const INVESTOR_ONLY_PATHS = ['/greenhouse', '/investor-assistant'];
const FOUNDER_ONLY_PATHS = [
  '/founder-dashboard', '/dashboard', '/pods', '/ideas', '/chat', '/canvas', '/validation',
];
// ✅ Admin paths — skip AppShell entirely
const ADMIN_PATHS = ['/admin'];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, isInvestor } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const isPublic       = PUBLIC_PATHS.includes(pathname);
  const isInvestorPath = INVESTOR_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isFounderPath  = FOUNDER_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isAdminPath    = ADMIN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  const profilePending = !isPublic && session && !profile;

  useEffect(() => {
    if (loading || profilePending) return;
    if (!session && !isPublic) { router.replace('/login'); return; }
    if (session && isInvestor && isFounderPath) { router.replace('/greenhouse'); return; }
    if (session && !isInvestor && isInvestorPath) { router.replace('/founder-dashboard'); return; }
  }, [loading, profilePending, session, router, isPublic, isInvestor, isFounderPath, isInvestorPath]);

  if (isPublic) return <>{children}</>;

  if (loading || profilePending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  // ✅ Admin — render WITHOUT AppShell, no sidebar
  if (isAdminPath) return <>{children}</>;

  if (isInvestor && isFounderPath) return null;
  if (!isInvestor && isInvestorPath) return null;

  return <AppShell>{children}</AppShell>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
