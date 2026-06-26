'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check, X, ArrowLeft, ChevronDown, ChevronUp, Sprout, Users, Rocket,
  Leaf, Star, CreditCard, BadgeCheck,
} from 'lucide-react';

/* ── Types ── */
type BillingCycle = 'monthly' | 'annual';

/* ── Plan definitions ── */
const PLANS = [
  {
    id: 'free',
    icon: '🌱',
    name: 'بذرة',
    tagline: 'للاستكشاف والبداية',
    monthlyPrice: 0,
    annualPrice: 0,
    cta: 'ابدأ مجاناً',
    ctaHref: '/signup',
    popular: false,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-border',
    features: [
      'فكرة واحدة فقط',
      'المدرب الذكي (١٠ رسائل/يوم)',
      'متتبع التحقق (عرض فقط)',
      'مكتبة الأفكار (تصفح فقط)',
      'الوصول للمجتمع',
      'تقويم البذرة (عرض فقط)',
    ],
  },
  {
    id: 'growth',
    icon: '🌿',
    name: 'نمو',
    tagline: 'للمؤسسين الجادين',
    monthlyPrice: 9,
    annualPrice: 7,
    annualTotal: 84,
    cta: 'ابدأ البناء',
    ctaHref: '/checkout?plan=growth',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-primary',
    features: [
      'كل ما في "بذرة"',
      'حتى ٣ أفكار',
      'المدرب الذكي بلا حدود',
      'متتبع التحقق الكامل',
      'نموذج العمل (Canvas)',
      'مشوار الـ ٩٠ يوماً',
      'مجموعات المساءلة',
      'مكتبة الأفكار (اختر حتى ٢)',
      'تقويم البذرة الكامل',
      'تصدير البيانات (CSV)',
    ],
  },
  {
    id: 'launch',
    icon: '🍎',
    name: 'إطلاق',
    tagline: 'للجاهزين لمقابلة المستثمرين',
    monthlyPrice: 24,
    annualPrice: 19,
    annualTotal: 228,
    cta: 'أطلق الآن',
    ctaHref: '/checkout?plan=launch',
    bg: 'bg-rose-50',
    border: 'border-border',
    features: [
      'كل ما في "نمو"',
      'حتى ٥ أفكار',
      'عرض فكرتك في المشتل',
      'عرض للتمويل (يُنشأ تلقائياً)',
      'المدرب الذكي المتقدم',
      'تصدير ملف العرض PDF',
      'روابط مشاركة خاصة',
      'أولوية رد المستثمرين (٤٨ ساعة)',
      'دعم فني بأولوية',
    ],
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧‍👦',
    name: 'عائلي',
    tagline: 'للعائلات التي تبني معاً',
    monthlyPrice: 19,
    annualPrice: 15,
    annualTotal: 180,
    cta: 'ابدأ كعائلة',
    ctaHref: '/checkout?plan=family',
    bg: 'bg-amber-50',
    border: 'border-border',
    features: [
      'كل ما في "نمو"',
      'حتى ٣ أعضاء في حساب واحد',
      'مساحة عمل مشتركة',
      'قوالب مشاريع عائلية',
      'Canvas تعاوني (تعديل جماعي)',
      'مشوار الـ ٩٠ يوماً مشترك',
      'لوحة تقدم العائلة',
    ],
  },
];

/* ── Comparison table rows ── */
const TABLE_ROWS = [
  { label: 'عدد الأفكار',                  free: '١',       growth: '٣',         launch: '٥',         family: '٣' },
  { label: 'المدرب الذكي',                 free: '١٠/يوم',  growth: '∞',         launch: '∞ متقدم',   family: '∞' },
  { label: 'متتبع التحقق',                 free: 'عرض',     growth: '✓',          launch: '✓',          family: '✓' },
  { label: 'نموذج العمل (Canvas)',          free: false,     growth: true,         launch: true,         family: 'تعاوني' },
  { label: 'مشوار الـ ٩٠ يوماً',           free: false,     growth: true,         launch: true,         family: 'مشترك' },
  { label: 'مجموعات المساءلة',              free: false,     growth: true,         launch: true,         family: true },
  { label: 'مكتبة الأفكار',               free: 'تصفح',    growth: 'اختر ٢',     launch: 'اختر ٢',     family: 'اختر ٢' },
  { label: 'تقويم البذرة',                 free: 'عرض',     growth: '✓',          launch: '✓',          family: '✓' },
  { label: 'عرض في المشتل',               free: false,     growth: false,         launch: true,         family: false },
  { label: 'عرض للتمويل',                 free: false,     growth: false,         launch: true,         family: false },
  { label: 'تصدير PDF',                    free: false,     growth: false,         launch: true,         family: false },
  { label: 'روابط مشاركة خاصة',            free: false,     growth: false,         launch: true,         family: false },
  { label: 'أعضاء الفريق',                 free: '١',       growth: '١',          launch: '١',          family: '٣' },
  { label: 'دعم فني بأولوية',              free: false,     growth: false,         launch: true,         family: false },
  { label: 'تصدير CSV',                    free: false,     growth: true,          launch: true,         family: true },
];

const FAQ_ITEMS = [
  { q: 'هل يمكنني تغيير الباقة في أي وقت؟', a: 'نعم. يمكنك الترقية أو التخفيض في أي لحظة. التغييرات تسري فوراً.' },
  { q: 'هل هناك عقد أو التزام؟', a: 'لا. اشتراك شهري بدون عقود. ألغِ في أي وقت بضغطة واحدة.' },
  { q: 'هل يوجد تجربة مجانية للباقات المدفوعة؟', a: 'نعم — تجربة مجانية ١٤ يوماً على أي باقة مدفوعة. بدون بطاقة ائتمان.' },
  { q: 'ما طرق الدفع المتاحة؟', a: 'بطاقات الائتمان (Visa, Mastercard)، Apple Pay، Google Pay، وPayPal.' },
  { q: 'هل يوجد خصم للطلاب؟', a: 'نعم! أرسل لنا إيميل من بريدك الجامعي واحصل على ٥٠٪ خصم على أي باقة.' },
  { q: 'ماذا يحدث لبياناتي إذا ألغيت؟', a: 'بياناتك تبقى متاحة لمدة ٣٠ يوماً بعد الإلغاء. يمكنك تصدير كل شيء قبل ذلك.' },
  { q: 'هل الباقة العائلية تشمل ٣ حسابات منفصلة؟', a: 'لا — حساب واحد مشترك يمكن لـ ٣ أعضاء الوصول إليه والعمل على نفس الأفكار معاً.' },
  { q: 'هل أحتاج باقة "إطلاق" لعرض فكرتي على المستثمرين؟', a: 'نعم. العرض في المشتل وأدوات التمويل متاحة فقط في باقة "إطلاق". لكن يمكنك بناء كل شيء في باقة "نمو" والترقية عندما تكون جاهزاً.' },
];

function CellValue({ val }: { val: string | boolean }) {
  if (val === true) return <Check className="w-4 h-4 text-emerald-600 mx-auto" />;
  if (val === false) return <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-xs font-medium text-center block">{val}</span>;
}

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Back link */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-row-reverse"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للرئيسية
        </Link>
      </div>

      {/* ── Header ── */}
      <section className="pt-10 pb-8 max-w-6xl mx-auto px-6 text-center">
        <span
          className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 bg-primary/10"
          style={{ color: 'var(--green-brand)' }}
        >
          الأسعار
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3" style={{ color: 'var(--text-dark)' }}>
          أسعار بسيطة. بدون مفاجآت.
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          ابدأ مجاناً. ارتقِ عندما تكون جاهزاً.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 mt-8 bg-secondary rounded-xl p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              billing === 'monthly'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            شهري
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              billing === 'annual'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            سنوي
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: 'var(--green-brand)' }}
            >
              وفّر ٢٠٪
            </span>
          </button>
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section className="max-w-6xl mx-auto px-6 pb-14">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map(plan => {
            const price = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.id}
                className={`relative bg-card rounded-2xl border-2 ${plan.border} p-6 flex flex-col gap-5 ${
                  plan.popular ? 'shadow-lg' : 'shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3.5 right-5 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 text-white bg-primary"
                  >
                    <Star className="w-3 h-3" />
                    الأكثر شعبية
                  </div>
                )}

                {/* Icon + name */}
                <div>
                  <div className={`w-11 h-11 rounded-xl ${plan.bg} flex items-center justify-center text-xl mb-3`}>
                    {plan.icon}
                  </div>
                  <div className={`text-lg font-bold ${plan.color}`}>{plan.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{plan.tagline}</div>
                </div>

                {/* Price */}
                <div className="flex items-end gap-1 flex-row-reverse">
                  {price === 0 ? (
                    <span className="text-3xl font-extrabold" style={{ color: 'var(--text-dark)' }}>مجاناً</span>
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold" style={{ color: 'var(--text-dark)' }}>${price}</span>
                      <span className="text-sm text-muted-foreground mb-1">/شهر</span>
                    </>
                  )}
                </div>
                {billing === 'annual' && plan.annualTotal && (
                  <p className="text-xs text-muted-foreground -mt-3">
                    ${plan.annualTotal} سنوياً — وفّر ${(plan.monthlyPrice - plan.annualPrice) * 12}
                  </p>
                )}

                {/* CTA */}
                <Link
                  href={plan.ctaHref + (plan.monthlyPrice > 0 ? `&billing=${billing}` : '')}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold text-center transition-all ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                      : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
                  }`}
                >
                  {plan.cta}
                  {price > 0 && ` — $${price}/شهر`}
                </Link>

                {/* Features */}
                <ul className="space-y-2.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 flex-row-reverse text-right">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Trial notice */}
        <div className="mt-5 flex items-center justify-center gap-6 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />تجربة مجانية ١٤ يوماً</span>
          <span className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />بدون بطاقة ائتمان</span>
          <span className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />ألغِ في أي وقت</span>
        </div>
      </section>

      {/* ── Annual savings banner ── */}
      {billing === 'monthly' && (
        <section
          className="mx-6 max-w-6xl xl:mx-auto mb-14 rounded-2xl p-6 bg-primary/5 border border-primary/20"
        >
          <div className="text-center">
            <p className="font-bold text-sm mb-3" style={{ color: 'var(--green-brand)', opacity: 0.8 }}>
              وفّر ٢٠٪ مع الاشتراك السنوي
            </p>
            <div className="flex flex-wrap justify-center gap-5 text-sm">
              {PLANS.filter(p => p.annualPrice && p.annualPrice > 0).map(p => (
                <div key={p.id} className="text-center">
                  <span className="font-medium">{p.icon} {p.name}:</span>
                  <span className="text-muted-foreground mr-1">${p.monthlyPrice}/شهر →</span>
                  <span className="font-bold" style={{ color: 'var(--green-brand)' }}>${p.annualPrice}/شهر</span>
                  <span className="text-muted-foreground text-xs mr-1">(${p.annualTotal}/سنة)</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setBilling('annual')}
              className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold transition-all text-white bg-primary"
            >
              تحويل للاشتراك السنوي
            </button>
          </div>
        </section>
      )}

      {/* ── Comparison table ── */}
      <section className="max-w-6xl mx-auto px-6 pb-14">
        <h2 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--text-dark)' }}>
          مقارنة الباقات
        </h2>
        <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(27,107,62,0.07)' }}>
                  <th className="text-right px-5 py-3.5 font-semibold text-muted-foreground w-[35%]">الميزة</th>
                  {PLANS.map(p => (
                    <th key={p.id} className="text-center px-3 py-3.5 font-bold" style={{ color: 'var(--text-dark)' }}>
                      <div>{p.icon}</div>
                      <div className="text-xs font-semibold mt-0.5">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground font-normal">
                        {p.monthlyPrice === 0 ? 'مجاناً' : `$${billing === 'annual' ? p.annualPrice : p.monthlyPrice}/شهر`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}>
                    <td className="px-5 py-3 text-right font-medium text-sm">{row.label}</td>
                    <td className="px-3 py-3 text-center"><CellValue val={row.free} /></td>
                    <td className="px-3 py-3 text-center"><CellValue val={row.growth} /></td>
                    <td className="px-3 py-3 text-center"><CellValue val={row.launch} /></td>
                    <td className="px-3 py-3 text-center"><CellValue val={row.family} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Investor section ── */}
      <section
        className="mx-6 max-w-6xl xl:mx-auto mb-14 rounded-2xl p-8 text-center text-white"
        style={{ background: 'linear-gradient(135deg, var(--text-dark) 0%, var(--green-deep) 100%)' }}
      >
        <div className="text-3xl mb-3">💰</div>
        <h2 className="text-xl font-bold mb-2">للمستثمرين</h2>
        <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: 'var(--off-white)', opacity: 0.8 }}>
          المشتل مجاني بالكامل للمستثمرين. تصفّح البذور، فلتر حسب القطاع والعائد، وتواصل مع المؤسسين — بدون أي رسوم.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: 'var(--gold)', color: 'var(--text-dark)' }}
        >
          سجّل كمستثمر — مجاناً
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Social proof ── */}
      <section className="max-w-6xl mx-auto px-6 pb-14">
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { text: 'بدأت بالباقة المجانية وخلال شهر ترقيت لـ نمو. أفضل $٩ أصرفها كل شهر.', name: 'أحمد م.', city: 'الرياض' },
            { text: 'الباقة العائلية غيّرت طريقة عملنا. أنا وأخوي وأبوي نشتغل على نفس الفكرة بسلاسة.', name: 'نور ع.', city: 'إسطنبول' },
          ].map((q, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-6 text-right">
              <p className="text-sm leading-relaxed mb-4 text-muted-foreground">
                &ldquo;{q.text}&rdquo;
              </p>
              <div className="flex items-center gap-2 flex-row-reverse">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'var(--green-brand)' }}
                >
                  {q.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold">{q.name}</div>
                  <div className="text-xs text-muted-foreground">{q.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-6 pb-14">
        <h2 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--text-dark)' }}>
          الأسئلة الشائعة
        </h2>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-right gap-3 flex-row-reverse hover:bg-secondary/30 transition-colors"
              >
                <span className="font-medium text-sm">{item.q}</span>
                {openFaq === i
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                }
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-muted-foreground text-right leading-relaxed border-t border-border pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        className="py-20 text-center px-6 bg-text-dark text-white"
      >
        <h2 className="text-3xl font-extrabold text-white mb-3">
          جاهز تبدأ؟
        </h2>
        <p className="text-muted-foreground mb-8">
          ابدأ مجاناً اليوم. بدون بطاقة ائتمان. بدون التزام.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-extrabold transition-all shadow-xl hover:shadow-2xl hover:opacity-90 text-white"
          style={{ background: 'var(--gold)', color: 'var(--text-dark)' }}
        >
          ابدأ الآن — مجاناً
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
