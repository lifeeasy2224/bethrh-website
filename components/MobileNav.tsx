'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'عن بذرة',        href: '/#what' },
  { label: 'النموذج المالي',  href: '/#financial' },
  { label: 'كيف تعمل',       href: '/#how-it-works' },
  { label: 'مكتبة الأفكار',  href: '/ideas-library', highlight: true },
  { label: 'الأسعار',         href: '/#pricing' },
  { label: 'التمويل',         href: '/#investors' },
  { label: 'آراء المستخدمين', href: '/#testimonials' },
  { label: 'المساعدة',        href: '/help' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div
          className="md:hidden fixed inset-x-0 top-16 z-40 border-b shadow-lg"
          style={{ background: 'var(--white)', borderColor: 'var(--gray-light)' }}
        >
          <nav className="px-5 py-4 space-y-1" dir="rtl">
            {NAV_LINKS.map(link => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-secondary"
                style={{
                  color: link.highlight ? 'var(--green-brand)' : 'var(--text-dark)',
                  fontWeight: link.highlight ? 600 : undefined,
                }}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--gray-light)' }}>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'var(--green-deep)', color: 'var(--white)' }}
              >
                ابدأ رحلتك الآن
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
