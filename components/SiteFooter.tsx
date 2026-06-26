'use client';

import Link from 'next/link';
import { Sprout } from 'lucide-react';

const footerColumns = [
  {
    title: 'المنتج',
    links: [
      { label: 'الميزات',       href: '/#what' },
      { label: 'مكتبة الأفكار', href: '/ideas-library' },
      { label: 'الأسعار',       href: '/pricing' },
      { label: 'المدرب الذكي',  href: '/signup' },
    ],
  },
  {
    title: 'الشركة',
    links: [
      { label: 'عن بذرة',  href: '/#what' },
      { label: 'المدونة',  href: '/help' },
      { label: 'وظائف',   href: '/help' },
      { label: 'الصحافة',  href: '/help' },
    ],
  },
  {
    title: 'قانوني',
    links: [
      { label: 'سياسة الخصوصية',         href: '/privacy' },
      { label: 'الشروط والأحكام',         href: '/terms' },
      { label: 'حماية الملكية الفكرية',   href: '/ip-policy' },
      { label: 'سياسة ملفات الارتباط',    href: '/cookies' },
    ],
  },
  {
    title: 'الدعم',
    links: [
      { label: 'مركز المساعدة', href: '/help' },
      { label: 'تواصل معنا',    href: '/help' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer dir="rtl" style={{ background: 'var(--green-deep)' }}>
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">

        {/* Brand row */}
        <div className="flex items-center gap-3 flex-row-reverse mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center relative shrink-0"
            style={{ background: 'rgba(212,166,83,0.15)' }}
          >
            <Sprout className="w-5 h-5 absolute" style={{ color: 'var(--gold)', opacity: 0.45 }} />
            <span className="relative font-bold text-sm font-latin" style={{ color: 'var(--gold)' }}>$</span>
          </div>
          <span className="font-bold text-xl font-arabic" style={{ color: 'var(--gold)' }}>بذرة</span>
        </div>
        <p className="text-sm mb-12 text-right" style={{ color: 'rgba(232,192,122,0.55)', fontStyle: 'italic' }}>
          حيث تنمو الأفكار.
        </p>

        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {footerColumns.map(col => (
            <div key={col.title} className="text-right">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--gold-light)' }}>
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: 'rgba(247,243,236,0.5)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold-light)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,243,236,0.5)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t pt-6 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <p className="text-xs" style={{ color: 'rgba(212,166,83,0.4)' }}>
            © ٢٠٢٦ Life Easy LLC — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
}
