// 📁 FILE: components/SiteHeader.tsx
// 📋 ACTION: REPLACE existing file (overwrite completely)
// ─────────────────────────────────────────
// Bethrh branded header — Deep Green + Gold
// Preserves: all nav links, mobile menu, active states,
//            login/register buttons, RTL layout
// Changes:   background → deep green, logo → BethrhLogo SVG,
//            colors → brand tokens, hover states → gold
// ─────────────────────────────────────────
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import BethrhLogo from '@/components/BethrhLogo';

const navLinks = [
  { label: 'الرئيسية',      href: '/' },
  { label: 'مكتبة الأفكار', href: '/ideas-library' },
  { label: 'البيت الزجاجي', href: '/greenhouse' },
  { label: 'الأسعار',       href: '/pricing' },
  { label: 'المساعدة',      href: '/help' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        background: 'var(--green-deep)',
        borderColor: 'rgba(212,166,83,0.12)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.25)',
      }}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href="/" className="shrink-0 flex items-center" aria-label="بذرة — الصفحة الرئيسية">
          <BethrhLogo size="sm" color="#D4A653" />
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium font-arabic">
          {navLinks.map(({ label, href }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'transition-colors duration-150 font-arabic',
                  active ? 'font-bold' : 'hover:opacity-100'
                )}
                style={{
                  color: active ? 'var(--gold)' : 'rgba(212,166,83,0.55)',
                  borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
                  paddingBottom: '2px',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.color = 'var(--gold)';
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.color = 'rgba(212,166,83,0.55)';
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* ── CTA buttons ── */}
        <div className="flex items-center gap-3">
          {/* Login — ghost button */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 font-arabic"
            style={{
              borderColor: 'rgba(212,166,83,0.35)',
              color: 'var(--gold)',
              background: 'transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(212,166,83,0.08)';
              e.currentTarget.style.borderColor = 'rgba(212,166,83,0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(212,166,83,0.35)';
            }}
          >
            تسجيل الدخول
          </Link>

          {/* Register — gold CTA */}
          <Link
            href="/register"
            className="hidden sm:inline-flex items-center px-5 py-2 rounded-lg text-sm font-bold transition-all duration-150 shadow-sm font-arabic"
            style={{
              background: 'var(--gold)',
              color: 'var(--green-deep)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--gold-light)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(212,166,83,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--gold)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            ابدأ مجاناً
          </Link>

          {/* ── Mobile hamburger ── */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--gold)' }}
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {open && (
        <div
          className="md:hidden border-t px-5 py-4 space-y-1"
          style={{
            background: 'var(--green-deep)',
            borderColor: 'rgba(212,166,83,0.12)',
          }}
        >
          {navLinks.map(({ label, href }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="block py-3 text-sm font-medium transition-colors text-right font-arabic"
                style={{
                  color: active ? 'var(--gold)' : 'rgba(212,166,83,0.5)',
                  fontWeight: active ? 700 : 500,
                  borderBottom: '1px solid rgba(212,166,83,0.06)',
                }}
              >
                {label}
              </Link>
            );
          })}

          {/* Mobile CTA buttons */}
          <div className="flex flex-col gap-2 pt-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block py-2.5 px-4 rounded-lg text-sm font-medium text-center border font-arabic"
              style={{
                borderColor: 'rgba(212,166,83,0.35)',
                color: 'var(--gold)',
                background: 'transparent',
              }}
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="block py-2.5 px-4 rounded-lg text-sm font-bold text-center font-arabic"
              style={{
                background: 'var(--gold)',
                color: 'var(--green-deep)',
              }}
            >
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
