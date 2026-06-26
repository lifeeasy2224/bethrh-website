'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard, Users, Lightbulb, ChartBar as BarChart2, MessageSquare,
  Tag, Ticket, ClipboardList, Settings, ChevronDown, ChevronRight,
  LogOut, Menu, Bell, Sprout, Star, Boxes,
} from 'lucide-react';

type NavChild = { label: string; href: string };
type NavItem  = { icon: React.ElementType; label: string; href?: string; children?: NavChild[] };

const NAV: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',          href: '/admin/dashboard' },
  { icon: Users,           label: 'Users',               href: '/admin/users' },
  {
    icon: Lightbulb, label: 'Seeds Library',
    children: [
      { label: 'All Seeds',    href: '/admin/seeds' },
      { label: 'Add New Seed', href: '/admin/seeds/new' },
      { label: 'Sectors',      href: '/admin/seeds/sectors' },
    ],
  },
  {
    icon: BarChart2, label: 'Analytics',
    children: [
      { label: 'Traffic',  href: '/admin/analytics' },
      { label: 'Users',    href: '/admin/analytics/users' },
      { label: 'Business', href: '/admin/analytics/business' },
    ],
  },
  { icon: MessageSquare, label: 'Comments & Feedback', href: '/admin/comments' },
  { icon: Star,          label: 'Reviews',              href: '/admin/reviews' },
  { icon: Boxes,         label: 'Features',              href: '/admin/features' },
  { icon: Tag,           label: 'Promo Codes',          href: '/admin/promo-codes' },
  {
    icon: Ticket, label: 'Support Tickets',
    children: [
      { label: 'All Tickets',      href: '/admin/tickets' },
      { label: 'Account Recovery', href: '/admin/tickets' },
    ],
  },
  { icon: ClipboardList, label: 'Audit Log', href: '/admin/audit' },
  { icon: Settings,      label: 'Settings',  href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading, session, supaUser } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [open,   setOpen]   = useState<string[]>(['Seeds Library', 'Support Tickets', 'Analytics']);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session)  { router.replace('/login');              return; }
    if (!isAdmin)  { router.replace('/founder-dashboard');  return; }
  }, [loading, session, isAdmin, router]);

  const toggle = (label: string) =>
    setOpen(p => p.includes(label) ? p.filter(l => l !== label) : [...p, label]);

  const isActive      = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const sectionActive = (item: NavItem) =>
    item.href ? isActive(item.href) : (item.children?.some(c => isActive(c.href)) ?? false);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--green-deep)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-[var(--green-brand)]" />
      </div>
    );
  }

  const initial = (supaUser?.email?.[0] ?? 'A').toUpperCase();

  const Sidebar = () => (
    <div className="flex flex-col h-full w-[220px] shrink-0" style={{ background: 'var(--green-deep)' }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-[18px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center relative shrink-0"
          style={{ background: 'rgba(212,166,83,0.15)' }}
        >
          <Sprout className="w-4 h-4 absolute" style={{ color: 'var(--gold)', opacity: 0.45 }} />
          <span className="relative font-bold text-xs font-latin" style={{ color: 'var(--gold)' }}>$</span>
        </div>
        <div>
          <div className="font-bold text-base leading-tight font-arabic" style={{ color: 'var(--gold)' }}>بذرة</div>
          <div className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'rgba(212,166,83,0.6)' }}>Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {NAV.map(item => {
          const active   = sectionActive(item);
          const expanded = open.includes(item.label);
          if (!item.children) {
            return (
              <Link
                key={item.label}
                href={item.href!}
                onClick={() => setMobile(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(212,166,83,0.15)' : 'transparent',
                  color:      active ? 'var(--gold)' : 'rgba(247,243,236,0.55)',
                }}
              >
                <item.icon className="w-[15px] h-[15px] shrink-0" style={{ color: active ? 'var(--gold)' : undefined }} />
                {item.label}
              </Link>
            );
          }
          return (
            <div key={item.label}>
              <button
                onClick={() => toggle(item.label)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ color: active ? 'var(--off-white)' : 'rgba(247,243,236,0.55)' }}
              >
                <item.icon className="w-[15px] h-[15px] shrink-0" style={{ color: active ? 'var(--gold)' : undefined }} />
                <span className="flex-1 text-left">{item.label}</span>
                {expanded
                  ? <ChevronDown className="w-3 h-3" style={{ color: 'rgba(247,243,236,0.3)' }} />
                  : <ChevronRight className="w-3 h-3" style={{ color: 'rgba(247,243,236,0.3)' }} />}
              </button>
              {expanded && (
                <div className="mt-0.5 ml-4 pl-3 space-y-0.5" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                  {item.children.map(child => (
                    <Link
                      key={child.label + child.href}
                      href={child.href}
                      onClick={() => setMobile(false)}
                      className="block px-3 py-2 rounded-lg text-[13px] transition-colors"
                      style={{
                        background: isActive(child.href) ? 'rgba(212,166,83,0.12)' : 'transparent',
                        color:      isActive(child.href) ? 'var(--gold-light)' : 'rgba(247,243,236,0.45)',
                      }}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User + signout */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: 'var(--green-brand)' }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium" style={{ color: 'var(--off-white)' }}>Admin</div>
            <div className="text-[11px] truncate" style={{ color: 'rgba(247,243,236,0.45)' }}>{supaUser?.email}</div>
          </div>
        </div>
        <button
          onClick={async () => {
            const { supabase } = await import('@/lib/supabase');
            await supabase.auth.signOut();
            router.replace('/login');
          }}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'rgba(247,243,236,0.45)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fca5a5')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,243,236,0.45)')}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--off-white)' }} dir="ltr">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobile(false)} />
          <aside className="absolute left-0 top-0 bottom-0 z-10">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-5 border-b shrink-0" style={{ background: 'var(--white)', borderColor: 'var(--gray-light)' }}>
          <button
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--green-brand)' }}
            onClick={() => setMobile(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--gray-mid)' }}>
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
