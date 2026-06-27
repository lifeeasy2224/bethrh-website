// 📁 FILE: app/pricing/page.tsx
'use client';

import Link from 'next/link';
import { CircleCheck as CheckCircle, ArrowLeft, Zap } from 'lucide-react';

const TIERS = [
  {
    icon: '🌱',
    name: 'مجاني',
    nameEn: 'Free',
    price: '$0',
    period: 'دائماً',
    description: 'ابدأ واستكشف المنصة',
    color: 'var(--gray-mid)',
    bg: 'var(--white)',
    border: 'var(--gray-light)',
    cta: 'ابدأ مجاناً',
    ctaHref: '/register',
    ctaStyle: { background: 'var(--off-white)', color: 'var(--text-dark)', border: '1px solid var(--gray-light)' },
    popular: false,
    features: [
      'تصفح مكتبة الأفكار كاملة',
      'عرض المشكلة فقط لكل فكرة',
      'التقط فكرة واحدة فقط',
      'التحقق الأساسي من الفكرة',
      'الملف الشخصي',
    ],
    locked: [
      'تفاصيل الفكرة الكاملة',
      'مدرب AI غير محدود',
      'نموذج الإيرادات والتقديرات المالية',
      'خطوات البدء السريع',
    ],
  },
  {
    icon: '🌿',
    name: 'برو',
    nameEn: 'Pro',
    price: '$9',
    period: '/شهر',
    description: 'للمؤسس الجاد',
    color: 'var(--white)',
    bg: 'var(--green-brand)',
    border: 'var(--green-brand)',
    cta: 'اشترك في برو',
    ctaHref: '/register',
    ctaStyle: { background: 'var(--gold)', color: 'var(--green-deep)' },
    popular: true,
    features: [
      'كل ما في المجاني',
      'تفاصيل الأفكار كاملة',
      'التقاط أفكار غير محدودة',
      'مدرب AI — 50 رسالة/يوم',
      'التحقق من الفكرة (AI)',
      'نموذج الإيرادات والتحليل المالي',
      'خطوات البدء السريع',
      'أفضل الأسواق',
      'تتبع التقدم (90 يوم)',
    ],
    locked: [],
  },
  {
    icon: '🚀',
    name: 'نمو',
    nameEn: 'Growth',
    price: '$19',
    period: '/شهر',
    description: 'للفريق الريادي',
    color: 'var(--text-dark)',
    bg: 'var(--white)',
    border: 'var(--gray-light)',
    cta: 'اشترك في نمو',
    ctaHref: '/register',
    ctaStyle: { background: 'var(--green-brand)', color: 'var(--white)' },
    popular: false,
    features: [
      'كل ما في برو',
      'فريق حتى 3 أعضاء',
      'مدرب AI — 200 رسالة/يوم',
      'تقارير متقدمة',
      'دعم أولوية (24 ساعة)',
      'Pitch Deck AI',
      'تحليل SWOT متقدم',
      'ربط مع المستثمرين',
    ],
    locked: [],
  },
  {
    icon: '🏢',
    name: 'المسرعات',
    nameEn: 'Accelerator',
    price: 'مخصص',
    period: '',
    description: 'للمسرعات والشركات',
    color: 'var(--text-dark)',
    bg: 'var(--off-white)',
    border: 'var(--gray-light)',
    cta: 'تواصل معنا',
    ctaHref: '/help',
    ctaStyle: { background: 'var(--green-deep)', color: 'var(--white)' },
    popular: false,
    features: [
      'كل ما في نمو',
      'فريق غير محدود',
      'لوحة تحكم مخصصة',
      'تكامل API',
      'تقارير مخصصة',
      'مدير حساب مخصص',
      'تدريب الفريق',
      'SLA مضمون',
    ],
    locked: [],
  },
];

export default function PricingPage() {
  return (
    <div dir="rtl" className="min-h-screen" style={{ background: 'var(--off-white)' }}>
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(27,107,62,0.08)', color: 'var(--green-brand)' }}
          >
            الأسعار
          </span>
          <h1
            className="font-extrabold mb-3"
            style={{ color: 'var(--text-dark)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
          >
            أسعار تناسب كل مرحلة
          </h1>
          <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--gray-mid)' }}>
            ابدأ مجاناً — اشترك عندما تكون جاهزاً. بدون عقود أو التزامات.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {TIERS.map(tier => (
            <div
              key={tier.name}
              className="rounded-2xl border p-6 flex flex-col relative"
              style={{
                background: tier.bg,
                borderColor: tier.border,
                boxShadow: tier.popular ? '0 8px 32px rgba(27,107,62,0.2)' : '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              {tier.popular && (
                <div
                  className="absolute -top-3 right-1/2 translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
                  style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
                >
                  الأكثر شعبية ⭐
                </div>
              )}

              <div className="text-3xl mb-3">{tier.icon}</div>
              <div className="font-extrabold text-lg mb-0.5" style={{ color: tier.color }}>
                {tier.name}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-extrabold text-3xl" style={{ color: tier.popular ? 'var(--gold)' : 'var(--text-dark)' }}>
                  {tier.price}
                </span>
                <span className="text-sm" style={{ color: tier.popular ? 'rgba(255,255,255,0.7)' : 'var(--gray-mid)' }}>
                  {tier.period}
                </span>
              </div>
              <p className="text-xs mb-5" style={{ color: tier.popular ? 'rgba(255,255,255,0.65)' : 'var(--gray-mid)' }}>
                {tier.description}
              </p>

              <Link
                href={tier.ctaHref}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 mb-5"
                style={tier.ctaStyle}
              >
                {tier.cta}
                {tier.name !== 'المسرعات' && <ArrowLeft className="w-4 h-4" />}
              </Link>

              <ul className="space-y-2.5 flex-1">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 flex-row-reverse text-right">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: tier.popular ? 'var(--gold)' : 'var(--green-brand)' }} />
                    <span className="text-xs leading-relaxed" style={{ color: tier.popular ? 'rgba(255,255,255,0.85)' : 'var(--text-dark)' }}>
                      {f}
                    </span>
                  </li>
                ))}
                {tier.locked.length > 0 && (
                  <>
                    <li className="border-t pt-2 mt-2" style={{ borderColor: 'var(--gray-light)' }} />
                    {tier.locked.map(f => (
                      <li key={f} className="flex items-start gap-2 flex-row-reverse text-right opacity-40">
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--gray-mid)' }} />
                        <span className="text-xs leading-relaxed line-through" style={{ color: 'var(--gray-mid)' }}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ strip */}
        <div className="rounded-2xl p-8" style={{ background: 'var(--white)', border: '1px solid var(--gray-light)' }}>
          <h2 className="font-extrabold text-xl mb-6 text-right" style={{ color: 'var(--text-dark)' }}>
            أسئلة شائعة
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: 'هل يمكنني الإلغاء في أي وقت؟', a: 'نعم، يمكنك إلغاء اشتراكك في أي وقت دون رسوم إضافية.' },
              { q: 'ما الفرق بين برو ونمو؟', a: 'نمو يضيف دعم الفريق (3 أعضاء)، مدرب AI أكثر، وتقارير متقدمة.' },
              { q: 'هل هناك تجربة مجانية للخطط المدفوعة؟', a: 'الخطة المجانية متاحة دائماً. يمكنك الترقية متى شئت.' },
              { q: 'ما هي "المسرعات"؟', a: 'للمسرعات والحاضنات والشركات التي تحتاج حلولاً مخصصة. تواصل معنا.' },
            ].map(({ q, a }) => (
              <div key={q} className="text-right">
                <h3 className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text-dark)' }}>{q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <p className="text-sm mb-4" style={{ color: 'var(--gray-mid)' }}>
            هل تحتاج مساعدة في اختيار الخطة المناسبة؟
          </p>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={{ background: 'var(--green-brand)', color: 'var(--white)' }}
          >
            <Zap className="w-4 h-4" />
            تواصل معنا
          </Link>
        </div>

      </div>
    </div>
  );
}
