'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'الرئيسية',      href: '/' },
  { label: 'مكتبة الأفكار', href: '/ideas-library' },
  { label: 'الأسعار',       href: '/pricing' },
  { label: 'المساعدة',      href: '/help' },
];

/* ── Inline header logo — "Light Background" variant from corporate identity ── */
function HeaderLogo() {
  return (
    <div
      className="flex items-center justify-center rounded-xl px-2 py-1"
      style={{ background: '#0F3D24' }}
    >
      <svg width="72" height="48" viewBox="0 0 320 340" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="بذرة">
        {/* Open-top shield */}
        <line x1="52" y1="20" x2="52" y2="188" stroke="#D4A653" strokeWidth="2" strokeLinecap="round"/>
        <line x1="268" y1="20" x2="268" y2="188" stroke="#D4A653" strokeWidth="2" strokeLinecap="round"/>
        <path d="M52,188 Q52,280 160,310 Q268,280 268,188" fill="rgba(212,166,83,0.04)" stroke="#D4A653" strokeWidth="2"/>
        {/* Inner shield echo */}
        <line x1="68" y1="20" x2="68" y2="185" stroke="rgba(212,166,83,0.2)" strokeWidth="0.8"/>
        <line x1="252" y1="20" x2="252" y2="185" stroke="rgba(212,166,83,0.2)" strokeWidth="0.8"/>
        <path d="M68,185 Q68,260 160,288 Q252,260 252,185" fill="none" stroke="rgba(212,166,83,0.18)" strokeWidth="0.8"/>
        {/* Anchor dots */}
        <circle cx="52" cy="188" r="5" fill="#D4A653"/>
        <circle cx="268" cy="188" r="5" fill="#D4A653"/>
        <circle cx="160" cy="310" r="5.5" fill="#D4A653"/>
        {/* Top rule */}
        <line x1="88" y1="52" x2="232" y2="52" stroke="rgba(212,166,83,0.2)" strokeWidth="0.8"/>
        {/* بذرة wordmark */}
        <text x="160" y="148" textAnchor="middle" fontFamily="'Noto Kufi Arabic', sans-serif" fontSize="110" fontWeight="700" fill="#D4A653">بذرة</text>
        {/* Bottom rule */}
        <line x1="88" y1="168" x2="232" y2="168" stroke="rgba(212,166,83,0.2)" strokeWidth="0.8"/>
        {/* Rising bars */}
        <rect x="118" y="178" width="10" height="14" rx="2" fill="#D4A653" opacity="0.35"/>
        <rect x="131" y="172" width="10" height="20" rx="2" fill="#D4A653" opacity="0.52"/>
        <rect x="144" y="166" width="10" height="26" rx="2" fill="#D4A653" opacity="0.70"/>
        <rect x="157" y="160" width="10" height="32" rx="2" fill="#D4A653" opacity="0.87"/>
        <rect x="170" y="154" width="10" height="38" rx="2" fill="#D4A653"/>
        <polygon points="175,151 179,155 183,151" fill="#D4A653"/>
        {/* Coin stack */}
        <line x1="184" y1="175" x2="202" y2="175" stroke="#D4A653" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="184" y1="181" x2="198" y2="181" stroke="#D4A653" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="184" y1="186" x2="194" y2="186" stroke="#D4A653" strokeWidth="1.1" strokeLinecap="round"/>
        {/* BETHRA */}
        <text x="160" y="228" textAnchor="middle" fontFamily="'Montserrat', sans-serif" fontSize="17" fontWeight="800" letterSpacing="6" fill="rgba(212,166,83,0.5)">BETHRA</text>
        {/* Diamonds */}
        <polygon points="160,248 164,252 160,256 156,252" fill="rgba(212,166,83,0.55)"/>
        <polygon points="145,248 149,252 145,256 141,252" fill="rgba(212,166,83,0.32)"/>
        <polygon points="175,248 179,252 175,256 171,252" fill="rgba(212,166,83,0.32)"/>
      </svg>
    </div>
  );
}

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

        {/* Logo — full shield on deep green pill */}
        <Link href="/" className="shrink-0">
          <HeaderLogo />
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
