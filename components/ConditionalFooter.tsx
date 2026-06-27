'use client';
// Renders SiteFooter only on public (non-app) routes
// Inner app routes get their footer from AppShell
import { usePathname } from 'next/navigation';
import SiteFooter from '@/components/SiteFooter';

const APP_PATHS = [
  '/dashboard', '/founder-dashboard', '/greenhouse', '/investor-assistant',
  '/profile', '/pods', '/chat', '/ideas', '/canvas', '/validation',
  '/pitch', '/journey', '/seeds', '/billing', '/admin', '/checkout',
];

export default function ConditionalFooter() {
  const pathname = usePathname();
  const isAppRoute = APP_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (isAppRoute) return null;
  return <SiteFooter />;
}
