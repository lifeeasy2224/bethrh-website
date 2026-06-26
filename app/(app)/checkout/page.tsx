'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Check, CreditCard, Lock, Shield, BadgeCheck,
  ChevronDown, ChevronUp, Loader,
} from 'lucide-react';

const PLAN_META: Record<string, {
  name: string; icon: string; tagline: string;
  monthly: number; annual: number; annualTotal: number;
  features: string[]; color: string; bg: string;
}> = {
  growth: {
    name: 'نمو', icon: '🌿', tagline: 'للمؤسسين الجادين',
    monthly: 9, annual: 7, annualTotal: 84,
    color: 'text-teal-700', bg: 'bg-teal-50',
    features: ['حتى ٣ أفكار', 'المدرب الذكي بلا حدود', 'نموذج العمل (Canvas)', 'مشوار الـ ٩٠ يوماً', 'مجموعات المساءلة', 'تقويم البذرة الكامل'],
  },
  launch: {
    name: 'إطلاق', icon: '🍎', tagline: 'للجاهزين لمقابلة المستثمرين',
    monthly: 24, annual: 19, annualTotal: 228,
    color: 'text-rose-700', bg: 'bg-rose-50',
    features: ['كل ما في "نمو"', 'عرض فكرتك في المشتل', 'عرض للتمويل (يُنشأ تلقائياً)', 'تصدير ملف العرض PDF', 'أولوية رد المستثمرين (٤٨ ساعة)', 'دعم فني بأولوية'],
  },
  family: {
    name: 'عائلي', icon: '👨‍👩‍👧‍👦', tagline: 'للعائلات التي تبني معاً',
    monthly: 19, annual: 15, annualTotal: 180,
    color: 'text-amber-700', bg: 'bg-amber-50',
    features: ['كل ما في "نمو"', 'حتى ٣ أعضاء في حساب واحد', 'مساحة عمل مشتركة', 'Canvas تعاوني', 'مشوار الـ ٩٠ يوماً مشترك', 'لوحة تقدم العائلة'],
  },
};

const PRIMARY = 'var(--green-brand)';
const TEXT_MAIN = 'var(--text-dark)';
const TEXT_MUTED = 'var(--gray-mid)';
const BORDER = 'var(--gray-light)';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') ?? 'growth';
  const billingParam = (searchParams.get('billing') ?? 'monthly') as 'monthly' | 'annual';

  const plan = PLAN_META[planId] ?? PLAN_META.growth;
  const [billing, setBilling] = useState<'monthly' | 'annual'>(billingParam);
  const price = billing === 'annual' ? plan.annual : plan.monthly;
  const total = billing === 'annual' ? plan.annualTotal : plan.monthly;

  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  function formatCard(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return;
    setLoading(true);
    // Stripe integration point — wire up here once Stripe is configured
    await new Promise(r => setTimeout(r, 1500));
    router.push('/checkout/success?plan=' + planId);
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 flex-row-reverse"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          العودة
        </button>

        <div className="grid md:grid-cols-5 gap-8">

          {/* ── Left: Form ── */}
          <div className="md:col-span-3 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-right" style={{ color: TEXT_MAIN }}>إتمام الاشتراك</h1>
              <p className="text-sm text-muted-foreground text-right mt-1">تجربة مجانية ١٤ يوماً — ألغِ في أي وقت</p>
            </div>

            {/* Billing toggle */}
            <div className="bg-secondary/50 rounded-xl p-1 flex gap-1">
              {(['monthly', 'annual'] as const).map(b => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${billing === b ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {b === 'monthly' ? 'شهري' : (
                    <span className="flex items-center justify-center gap-1.5">
                      سنوي
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: PRIMARY }}>وفّر ٢٠٪</span>
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Card form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-center gap-2 flex-row-reverse mb-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm" style={{ color: TEXT_MAIN }}>بيانات البطاقة</h2>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-right" style={{ color: TEXT_MAIN }}>الاسم على البطاقة</label>
                  <input
                    dir="rtl"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="محمد أحمد"
                    required
                    className="w-full h-11 px-4 rounded-lg border text-sm outline-none transition-all"
                    style={{ borderColor: BORDER, color: TEXT_MAIN }}
                    onFocus={e => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px hsl(144,58%,22%,0.1)`; }}
                    onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Card number */}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-right" style={{ color: TEXT_MAIN }}>رقم البطاقة</label>
                  <div className="relative">
                    <input
                      dir="ltr"
                      type="text"
                      inputMode="numeric"
                      value={cardNum}
                      onChange={e => setCardNum(formatCard(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      required
                      maxLength={19}
                      className="w-full h-11 px-4 pl-10 rounded-lg border text-sm outline-none transition-all text-left"
                      style={{ borderColor: BORDER, color: TEXT_MAIN }}
                      onFocus={e => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px rgba(27, 107, 62, 0.1)`; }}
                      onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: TEXT_MUTED }} />
                  </div>
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-right" style={{ color: TEXT_MAIN }}>تاريخ الانتهاء</label>
                    <input
                      dir="ltr"
                      type="text"
                      inputMode="numeric"
                      value={expiry}
                      onChange={e => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      required
                      maxLength={5}
                      className="w-full h-11 px-4 rounded-lg border text-sm outline-none transition-all text-left"
                      style={{ borderColor: BORDER, color: TEXT_MAIN }}
                      onFocus={e => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px rgba(27, 107, 62, 0.1)`; }}
                      onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-right" style={{ color: TEXT_MAIN }}>رمز CVV</label>
                    <input
                      dir="ltr"
                      type="text"
                      inputMode="numeric"
                      value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="000"
                      required
                      maxLength={4}
                      className="w-full h-11 px-4 rounded-lg border text-sm outline-none transition-all text-left"
                      style={{ borderColor: BORDER, color: TEXT_MAIN }}
                      onFocus={e => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px rgba(27, 107, 62, 0.1)`; }}
                      onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
              </div>

              {/* Agree */}
              <label className="flex items-start gap-3 cursor-pointer flex-row-reverse">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={e => setAgree(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded shrink-0"
                  style={{ accentColor: PRIMARY }}
                />
                <span className="text-xs text-muted-foreground text-right leading-relaxed">
                  أوافق على{' '}
                  <Link href="/terms" className="underline hover:text-foreground transition-colors">الشروط والأحكام</Link>
                  {' '}و{' '}
                  <Link href="/privacy" className="underline hover:text-foreground transition-colors">سياسة الخصوصية</Link>
                  {' '}— سيبدأ الاشتراك بعد انتهاء التجربة المجانية (١٤ يوماً)
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={!agree || loading || !name || !cardNum || !expiry || !cvv}
                className="w-full h-13 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all py-3.5"
                style={{
                  background: (!agree || !name || !cardNum || !expiry || !cvv) ? 'rgba(27, 107, 62, 0.5)' : PRIMARY,
                  boxShadow: agree ? `0 2px 16px rgba(27, 107, 62, 0.3)` : 'none',
                  cursor: (!agree || loading) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading
                  ? <Loader className="w-5 h-5 animate-spin" />
                  : <>
                    <Lock className="w-4 h-4" />
                    ابدأ التجربة المجانية — ${price}/شهر بعد ١٤ يوماً
                  </>
                }
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" />تشفير SSL ٢٥٦-bit</span>
                <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" />بدون رسوم خفية</span>
                <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" />إلغاء في أي وقت</span>
              </div>
            </form>
          </div>

          {/* ── Right: Order summary ── */}
          <div className="md:col-span-2">
            <div className="sticky top-20 space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-semibold text-sm mb-5 text-right" style={{ color: TEXT_MAIN }}>ملخص الطلب</h2>

                {/* Plan */}
                <div className="flex items-center gap-3 flex-row-reverse mb-5 pb-5 border-b border-border">
                  <div className={`w-11 h-11 rounded-xl ${plan.bg} flex items-center justify-center text-xl shrink-0`}>
                    {plan.icon}
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${plan.color}`}>باقة {plan.name}</div>
                    <div className="text-xs text-muted-foreground">{plan.tagline}</div>
                    <div className="text-xs mt-0.5 text-muted-foreground">
                      {billing === 'annual' ? `$${plan.annualTotal} سنوياً ($${plan.annual}/شهر)` : `$${plan.monthly}/شهر`}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 flex-row-reverse">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground text-right">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Total */}
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex items-center justify-between flex-row-reverse text-sm">
                    <span className="text-muted-foreground">التجربة المجانية</span>
                    <span className="font-medium text-emerald-600">١٤ يوماً مجاناً</span>
                  </div>
                  <div className="flex items-center justify-between flex-row-reverse text-sm">
                    <span className="text-muted-foreground">{billing === 'annual' ? 'السعر السنوي' : 'السعر الشهري'}</span>
                    <span className="font-bold" style={{ color: TEXT_MAIN }}>${total}</span>
                  </div>
                  {billing === 'annual' && (
                    <div className="flex items-center justify-between flex-row-reverse text-xs">
                      <span className="text-emerald-600 font-medium">توفير سنوي</span>
                      <span className="text-emerald-600 font-medium">-${(plan.monthly - plan.annual) * 12}</span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="rounded-xl p-4 text-right bg-primary/5 border border-primary/20"
              >
                <p className="text-xs font-medium mb-1" style={{ color: PRIMARY }}>ضمان استرداد ١٤ يوماً</p>
                <p className="text-xs text-muted-foreground">
                  غير راضٍ؟ نرد لك المبلغ كاملاً خلال ١٤ يوماً بدون أي أسئلة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
