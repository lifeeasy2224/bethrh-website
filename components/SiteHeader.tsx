'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import BethrhWordmark from '@/components/BethrhWordmark';

const navLinks = [
  { label: 'الرئيسية',      href: '/' },
  { label: 'مكتبة الأفكار', href: '/ideas-library' },
  { label: 'الأسعار',       href: '/pricing' },
  { label: 'المساعدة',      href: '/help' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b shadow-sm"
      style={{ background: 'var(--white)', borderColor: 'var(--gray-light)' }}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">

        {/* Logo — clean green wordmark on white header */}
        <Link href="/" className="shrink-0">
          <BethrhWordmark color="#1B6B3E" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navLinks.map(({ label, href }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn('transition-colors', active ? 'font-bold' : 'hover:opacity-80')}
                style={{
                  color: active ? 'var(--green-brand)' : 'var(--green-deep)',
                  borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
                  paddingBottom: '2px',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* CTA buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: 'var(--green-brand)', color: 'var(--green-brand)', background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/register"
            className="hidden sm:inline-flex items-center px-5 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90 shadow-sm"
            style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
          >
            ابدأ مجاناً
          </Link>

          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--green-brand)' }}
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'إغلاق' : 'القائمة'}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t px-5 py-4 space-y-1"
          style={{ background: 'var(--white)', borderColor: 'var(--gray-light)' }}
        >
          {navLinks.map(({ label, href }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-sm font-medium transition-colors text-right"
                style={{ color: active ? 'var(--green-brand)' : 'var(--gray-mid)', fontWeight: active ? 700 : 500 }}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="block mt-3 py-2.5 px-4 rounded-lg text-sm font-bold text-center"
            style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
          >
            ابدأ مجاناً
          </Link>
        </div>
      )}
    </header>
  );
}
