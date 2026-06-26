'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Lightbulb, MessageSquare, Users, CircleUser as UserCircle,
  LogOut, Menu, X, Shield, Cookie, ChevronDown, Sprout,
  CircleHelp as HelpCircle, Bot, ArrowRight, BookOpen, Tag, CreditCard,
} from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

/* ── Founder nav ── */
const founderNavItems = [
  { href: '/profile',           label: 'الملف الشخصي',  icon: UserCircle },
  { href: '/founder-dashboard', label: 'لوحة المؤسس',   icon: LayoutDashboard },
  { href: '/seeds',             label: 'بذور جاهزة',     icon: BookOpen },
  { href: '/pods',              label: 'مجموعتي',        icon: Users },
  { href: '/chat',              label: 'المدرب الذكي',   icon: MessageSquare },
  { href: '/help',              label: 'المساعدة',        icon: HelpCircle },
];

/* ── Investor nav ── */
const investorNavItems = [
  { href: '/profile',            label: 'الملف الشخصي', icon: UserCircle },
  { href: '/greenhouse',         label: 'معرض البذور',  icon: Sprout },
  { href: '/investor-assistant', label: 'دليل المستثمر', icon: Bot },
];

const ideasStages = [
  { href: '/ideas?stage=ideation', label: 'الفكرة' },
  { href: '/validation',           label: 'التحقق' },
  { href: '/ideas?stage=canvas',   label: 'نموذج العمل (Canvas)' },
  { href: '/pitch',                label: 'عرض للتمويل' },
  { href: '/journey',              label: 'مشوار الـ ٩٠ يوماً' },
];

const bottomItems = [
  { href: '/billing',   label: 'الفوترة والاشتراك',      icon: CreditCard },
  { href: '/pricing',   label: 'الأسعار',              icon: Tag },
  { href: '/privacy',   label: 'الخصوصية والكوكيز',    icon: Cookie },
  { href: '/ip-policy', label: 'حماية الملكية الفكرية', icon: Shield },
];

/* ── Brand sidebar logo ── */
function SidebarLogo() {
  return (
    <div className="flex items-center gap-2.5 flex-row-reverse">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center relative shrink-0"
        style={{ background: 'var(--green-deep)' }}
      >
        <Sprout className="w-5 h-5 absolute" style={{ color: 'var(--gold)', opacity: 0.45 }} />
        <span
          className="relative font-bold text-sm font-latin leading-none"
          style={{ color: 'var(--gold)' }}
        >
          $
        </span>
      </div>
      <span
        className="font-bold text-2xl font-arabic tracking-tight"
        style={{ color: 'var(--green-deep)' }}
      >
        بذرة
      </span>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const { profile, isAdmin, isInvestor } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(
    pathname.startsWith('/ideas') || pathname.startsWith('/canvas') ||
    pathname.startsWith('/validation') || pathname === '/pitch' || pathname === '/journey'
  );

  const navItems = isInvestor ? investorNavItems : founderNavItems;

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const isNavActive = (href: string) =>
    pathname === href ||
    (href !== '/founder-dashboard' && href !== '/dashboard' && pathname.startsWith(href));

  const NavLink = ({ item, onClick }: { item: { href: string; label: string; icon: React.ElementType }; onClick?: () => void }) => {
    const active = isNavActive(item.href);
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
        style={{
          background:  active ? 'var(--green-brand)' : 'transparent',
          color:       active ? 'var(--white)' : 'var(--gray-mid)',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--green-deep)'; }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray-mid)'; } }}
      >
        <span className="flex-1 text-right">{item.label}</span>
        <item.icon className="w-4 h-4 shrink-0" />
      </Link>
    );
  };

  const IdeasAccordion = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div>
      <button
        onClick={() => setIdeasOpen(o => !o)}
        className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
        style={{ color: ideasOpen ? 'var(--green-brand)' : 'var(--gray-mid)', background: ideasOpen ? 'var(--secondary)' : 'transparent' }}
      >
        <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', ideasOpen && 'rotate-180')} />
        <span className="flex-1 text-right">رحلتي</span>
        <Lightbulb className="w-4 h-4 shrink-0" />
      </button>
      {ideasOpen && (
        <div className="mt-0.5 space-y-0.5 pr-3 border-r mr-5" style={{ borderColor: 'var(--gray-light)' }}>
          {ideasStages.map(stage => {
            const [stagePath, stageQuery] = stage.href.split('?');
            const stageParam = stageQuery ? new URLSearchParams(stageQuery).get('stage') : null;
            const isActive = stageParam
              ? pathname === stagePath && searchParams.get('stage') === stageParam
              : pathname === stagePath && !searchParams.get('stage');
            return (
              <Link
                key={stage.href}
                href={stage.href}
                onClick={onItemClick}
                className="flex items-center w-full px-3 py-2 rounded-lg text-xs transition-all"
                style={{
                  color:      isActive ? 'var(--green-brand)' : 'var(--gray-mid)',
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                <span className="flex-1 text-right">{stage.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)' }}>
      <SiteHeader />

      <div className="flex min-h-screen pt-16">
        {/* Desktop Sidebar */}
        <aside
          className="hidden md:flex flex-col w-60 shrink-0 border-r order-last"
          style={{
            background:   'var(--white)',
            borderColor:  'var(--gray-light)',
          }}
          dir="rtl"
        >
          {/* Brand + back-to-home */}
          <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--gray-light)' }}>
            <div className="flex items-center justify-center mb-3">
              <SidebarLogo />
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-row-reverse"
              style={{ color: 'var(--gray-mid)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--green-brand)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray-mid)'; }}
            >
              <span className="flex-1 text-right">العودة للرئيسية</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
          </div>

          {/* Main nav */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map(item => <NavLink key={item.href} item={item} />)}
            {!isInvestor && <IdeasAccordion />}

            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-1"
                style={{
                  background: pathname.startsWith('/admin') ? 'var(--green-brand)' : 'transparent',
                  color:      pathname.startsWith('/admin') ? 'var(--white)' : 'var(--gray-mid)',
                }}
              >
                <span className="flex-1 text-right">لوحة الإدارة</span>
                <Shield className="w-4 h-4 shrink-0" />
              </Link>
            )}
          </nav>

          {/* Bottom section */}
          <div className="p-3 border-t space-y-0.5" style={{ borderColor: 'var(--gray-light)' }}>
            {!isInvestor && bottomItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center w-full gap-3 px-3 py-2 rounded-lg text-xs transition-all"
                style={{ color: pathname.startsWith(item.href) ? 'var(--green-brand)' : 'var(--gray-mid)' }}
              >
                <span className="flex-1 text-right">{item.label}</span>
                <item.icon className="w-3.5 h-3.5 shrink-0" />
              </Link>
            ))}

            {/* User info */}
            <div className="flex items-center gap-3 px-3 py-2 mt-1 flex-row-reverse">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                style={{ background: 'var(--green-brand)' }}
              >
                {profile?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text-dark)' }}>
                  {profile?.name ?? 'مستخدم'}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--gray-mid)' }}>
                  {isInvestor ? 'مستثمر' : (profile?.country ?? '')}
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--gray-mid)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--gray-mid)'; }}
            >
              <span className="flex-1 text-right">تسجيل الخروج</span>
              <LogOut className="w-4 h-4 shrink-0" />
            </button>

            <div className="px-3 pt-2 pb-1 text-[10px] leading-tight text-right" style={{ color: 'var(--gray-mid)', opacity: 0.6 }}>
              © ٢٠٢٦ Life Easy LLC
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <SiteFooter />
        </main>
      </div>
    </div>
  );
}
