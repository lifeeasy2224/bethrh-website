'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Plus, TrendingUp, Star, ArrowLeft, Loader as Loader2 } from 'lucide-react';

export default function FounderDashboardPage() {
  const { profile, isInvestor, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isInvestor) router.replace('/investor-assistant');
  }, [loading, isInvestor, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--off-white)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--green-brand)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)' }} dir="rtl">
      {/* Header */}
      <div className="bg-white border-b px-6 py-8" style={{ borderColor: 'var(--gray-light)' }}>
        <div className="max-w-5xl mx-auto text-right">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4" style={{ background: 'rgba(27,107,62,0.08)', color: 'var(--green-brand)' }}>
            لوحة المؤسس
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: 'var(--text-dark)' }}>
            أهلاً{profile?.name ? `، ${profile.name}` : ''} 👋
          </h1>
          <p style={{ color: 'var(--gray-mid)' }}>هنا تجد مشاريعك، تقييماتها، ونصائح رفع الدرجات</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { href: '/ideas',     icon: Plus,       label: 'أضف بذرة جديدة',   desc: 'ابدأ فكرة جديدة',             color: 'var(--green-brand)', bg: 'rgba(27,107,62,0.08)' },
            { href: '/dashboard', icon: TrendingUp,  label: 'لوحة المؤسس',       desc: 'رحلتك الكاملة',               color: 'var(--green-deep)',  bg: 'rgba(15,61,36,0.07)' },
            { href: '/ideas',     icon: Star,        label: 'بذوري وتقييماتها',   desc: 'راجع Scores الخاصة بك',       color: 'var(--gold)',        bg: 'rgba(212,166,83,0.1)' },
          ].map(({ href, icon: Icon, label, desc, color, bg }) => (
            <Link
              key={label}
              href={href}
              className="p-6 rounded-2xl border bg-white hover:shadow-md transition-all text-right"
              style={{ borderColor: 'var(--gray-light)' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: bg }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <p className="font-bold mb-1" style={{ color: 'var(--text-dark)' }}>{label}</p>
              <p className="text-sm" style={{ color: 'var(--gray-mid)' }}>{desc}</p>
            </Link>
          ))}
        </div>

        {/* Score tips */}
        <div className="bg-white rounded-2xl p-8 border text-right" style={{ borderColor: 'var(--gray-light)' }}>
          <h2 className="text-xl font-extrabold mb-5" style={{ color: 'var(--text-dark)' }}>نصائح لرفع تقييم بذرتك</h2>
          <div className="space-y-4">
            {[
              { score: '75–80', tip: 'أضف بيانات سوق حقيقية وحدد شريحة العملاء بدقة',             color: 'var(--gold)' },
              { score: '80–90', tip: 'أضف عميلاً دافعاً وطوّر نموذجك المالي مع أرقام واقعية',     color: 'var(--green-brand)' },
              { score: '90+',   tip: 'ركز على Break-even أقل من 12 شهراً ونسبة IRO فوق 300%',     color: 'var(--green-deep)' },
            ].map(({ score, tip, color }) => (
              <div key={score} className="flex items-start gap-4 p-4 rounded-xl border flex-row-reverse" style={{ borderColor: 'var(--gray-light)' }}>
                <span className="font-bold text-sm px-2 py-1 rounded-lg shrink-0" style={{ background: 'rgba(27,107,62,0.08)', color }}>
                  Score {score}
                </span>
                <p className="text-sm flex-1" style={{ color: 'var(--text-dark)' }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA to ideas */}
        <div className="text-center">
          <Link
            href="/ideas"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white transition-all shadow-lg hover:opacity-90"
            style={{ background: 'var(--green-brand)' }}
          >
            اذهب إلى بذوري
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
