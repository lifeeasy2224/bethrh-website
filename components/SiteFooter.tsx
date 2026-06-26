// 📁 FILE: components/SiteFooter.tsx
// 📋 ACTION: REPLACE existing file (overwrite completely)
// ─────────────────────────────────────────
// Bethrh branded footer — Deep Green + Gold
// Preserves: all link columns, copyright, RTL layout
// Changes:   logo → BethrhLogo SVG, gold accent top border,
//            hover states → gold, tagline updated
// ─────────────────────────────────────────
'use client';

import Link from 'next/link';
import BethrhLogo from '@/components/BethrhLogo';

const footerColumns = [
  {
    title: 'المنتج',
    links: [
      { label: 'الميزات',         href: '/#features' },
      { label: 'مكتبة الأفكار',   href: '/ideas-library' },
      { label: 'البيت الزجاجي',   href: '/greenhouse' },
      { label: 'الأسعار',         href: '/pricing' },
      { label: 'المدرب الذكي',    href: '/ai-coach' },
    ],
  },
  {
    title: 'الشركة',
    links: [
      { label: 'عن بذرة',    href: '/about' },
      { label: 'المدونة',    href: '/blog' },
      { label: 'وظائف',     href: '/careers' },
      { label: 'الصحافة',    href: '/press' },
    ],
  },
  {
    title: 'قانوني',
    links: [
      { label: 'سياسة الخصوصية',       href: '/privacy' },
      { label: 'الشروط والأحكام',       href: '/terms' },
      { label: 'حماية الملكية الفكرية', href: '/ip-policy' },
      { label: 'سياسة ملفات الارتباط',  href: '/cookies' },
    ],
  },
  {
    title: 'الدعم',
    links: [
      { label: 'مركز المساعدة',  href: '/help' },
      { label: 'تواصل معنا',     href: '/contact' },
      { label: 'إلغاء الاشتراك', href: '/unsubscribe' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer dir="rtl" style={{ background: 'var(--green-deep)' }}>

      {/* ── Gold accent top border ── */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold))' }} />

      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">

        {/* ── Brand row ── */}
        <div className="flex flex-col items-end mb-10">
          <BethrhLogo size="sm" color="#D4A653" />
          <p
            className="text-sm mt-3 text-right font-arabic"
            style={{ color: 'rgba(232,192,122,0.5)', fontStyle: 'italic' }}
          >
            انطلق بفكرتك — اصنع مستقبلك
          </p>

          {/* ── Social / contact row ── */}
          <div className="flex items-center gap-4 mt-4">
            <a
              href="mailto:hello@bethrh.co"
              className="text-xs transition-colors font-latin"
              style={{ color: 'rgba(212,166,83,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,166,83,0.4)')}
            >
              hello@bethrh.co
            </a>
            <span style={{ color: 'rgba(212,166,83,0.2)' }}>·</span>
            <a
              href="https://wa.me/14804476256"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs transition-colors font-latin"
              style={{ color: 'rgba(212,166,83,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#25D366')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,166,83,0.4)')}
            >
              WhatsApp
            </a>
            <span style={{ color: 'rgba(212,166,83,0.2)' }}>·</span>
            <a
              href="https://bethrh.co"
              className="text-xs transition-colors font-latin"
              style={{ color: 'rgba(212,166,83,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,166,83,0.4)')}
            >
              bethrh.co
            </a>
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          className="mb-10"
          style={{ height: '1px', background: 'rgba(212,166,83,0.1)' }}
        />

        {/* ── Link columns ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {footerColumns.map(col => (
            <div key={col.title} className="text-right">
              <h4
                className="text-xs font-bold uppercase tracking-widest mb-5 font-latin"
                style={{ color: 'var(--gold-light)', letterSpacing: '2px' }}
              >
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors font-arabic"
                      style={{ color: 'rgba(247,243,236,0.45)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold-light)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,243,236,0.45)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p
            className="text-xs text-right font-arabic"
            style={{ color: 'rgba(212,166,83,0.35)' }}
          >
            © ٢٠٢٦ Life Easy LLC — جميع الحقوق محفوظة
          </p>
          <p
            className="text-xs font-latin"
            style={{ color: 'rgba(212,166,83,0.2)', letterSpacing: '1px' }}
          >
            BETHRH · MENA STARTUP MARKETPLACE
          </p>
        </div>
      </div>
    </footer>
  );
}
