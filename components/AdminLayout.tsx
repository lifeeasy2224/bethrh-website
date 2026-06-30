'use client';

import { useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Lightbulb, TrendingUp, MessageSquare,
  Tag, FileText, Headset, ClipboardList, Settings, Menu, X,
  LogOut, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useAdminAuth, type AdminRole } from '@/lib/admin-auth-context';

const SIDEBAR_BG = '#0F3D24';   // Bethrh deep green
const ACTIVE_BG  = '#1B6B3E';   // Bethrh brand green
const GOLD       = '#D4A653';

interface NavChild { label: string; path: string; }
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: NavChild[];
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, path: '/admin' },
  {
    id: 'users', label: 'المستخدمون', icon: Users,
    children: [
      { label: 'كل المستخدمين', path: '/admin/users' },
      { label: 'رواد الأعمال', path: '/admin/users?role=founder' },
      { label: 'المستثمرون', path: '/admin/users?role=investor' },
      { label: 'الموقوفون', path: '/admin/users?status=suspended' },
    ],
  },
  {
    id: 'seeds', label: 'مكتبة البذور', icon: Lightbulb,
    children: [
      { label: 'كل البذور', path: '/admin/seeds' },
      { label: 'إضافة بذرة جديدة', path: '/admin/seeds/new' },
      { label: 'القطاعات', path: '/admin/seeds/sectors' },
    ],
  },
  {
    id: 'analytics', label: 'التحليلات', icon: TrendingUp,
    children: [
      { label: 'الزيارات', path: '/admin/analytics/traffic' },
      { label: 'المستخدمون', path: '/admin/analytics/users' },
      { label: 'الأعمال', path: '/admin/analytics/business' },
    ],
  },
  { id: 'comments', label: 'التعليقات والملاحظات', icon: MessageSquare, path: '/admin/comments' },
  { id: 'promo-codes', label: 'أكواد الخصم', icon: Tag, path: '/admin/promo-codes' },
  { id: 'content', label: 'محتوى الموقع', icon: FileText, path: '/admin/content' },
  {
    id: 'support', label: 'تذاكر الدعم', icon: Headset,
    children: [
      { label: 'كل التذاكر', path: '/admin/support' },
      { label: 'استعادة الحساب', path: '/admin/support/recovery' },
    ],
  },
  { id: 'audit', label: 'سجل النشاطات', icon: ClipboardList, path: '/admin/audit-log' },
  { id: 'settings', label: 'الإعدادات', icon: Settings, path: '/admin/settings', superAdminOnly: true },
];

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'مدير عام',
  admin: 'مدير',
  moderator: 'مشرف',
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isActive = (path: string) => pathname === path.split('?')[0];
  const toggleGroup = (id: string) => setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));

  async function handleLogout() {
    await logout();
    router.replace('/admin/login');
  }

  return (
    <div className="flex flex-col h-full" dir="rtl" style={{ background: SIDEBAR_BG }}>
      {/* Brand header */}
      <div className="flex items-center gap-2 px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
          style={{ background: GOLD, color: SIDEBAR_BG }}
        >
          ب
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: GOLD }}>بذرة</p>
          <p className="text-[10px] tracking-wide" style={{ color: 'rgba(212,166,83,0.6)' }}>ADMIN PANEL</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          if (item.superAdminOnly && admin?.role !== 'super_admin') return null;

          if (item.children) {
            const open = openGroups[item.id] ?? false;
            return (
              <div key={item.id}>
                <button
                  onClick={() => toggleGroup(item.id)}
                  className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: open ? GOLD : 'rgba(255,255,255,0.65)' }}
                >
                  {open ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                  <span className="flex-1 text-right">{item.label}</span>
                  <item.icon className="w-4 h-4 shrink-0" />
                </button>
                {open && (
                  <div className="mt-0.5 space-y-0.5 pr-3 mr-5 border-r" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    {item.children.map(child => {
                      const active = isActive(child.path);
                      return (
                        <Link
                          key={child.path}
                          href={child.path}
                          onClick={onNavigate}
                          className="flex items-center w-full px-3 py-2 rounded-lg text-xs transition-colors"
                          style={{
                            background: active ? ACTIVE_BG : 'transparent',
                            color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                          }}
                        >
                          <span className="flex-1 text-right">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const active = isActive(item.path!);
          return (
            <Link
              key={item.id}
              href={item.path!}
              onClick={onNavigate}
              className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? ACTIVE_BG : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
              }}
            >
              <span className="flex-1 text-right">{item.label}</span>
              <item.icon className="w-4 h-4 shrink-0" />
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: ACTIVE_BG, color: '#fff' }}
          >
            {admin?.full_name?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <div className="min-w-0 text-right">
            <p className="text-sm font-medium text-white truncate">{admin?.full_name ?? admin?.email}</p>
            <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {admin ? ROLE_LABELS[admin.role] : ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          <span className="flex-1 text-right">تسجيل الخروج</span>
          <LogOut className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen" style={{ background: '#F0EDE6' }} dir="rtl">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar (slide-in) */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 z-50 transform transition-transform md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:block w-60 shrink-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Main content column */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b md:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 -mr-2">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold" style={{ color: ACTIVE_BG }}>لوحة الإدارة</span>
          <span className="w-9" />
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
