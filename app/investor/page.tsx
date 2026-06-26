'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, TrendingUp, Shield, Users, Star, SquareCheck as CheckSquare, Square, Mail } from 'lucide-react';

const perks = [
  { icon: TrendingUp, text: 'أفكار مُحللة مالياً جاهزة للتمويل' },
  { icon: Shield,     text: 'تواصل آمن وسري مع المؤسسين' },
  { icon: Star,       text: 'تقويم بذرة لكل فكرة من ١٠٠ نقطة' },
  { icon: Users,      text: 'شبكة متنامية من المؤسسين' },
];

const checklist = [
  'المشكلة حقيقية؟',
  'السوق > $100M؟',
  'IRO > 300%؟',
  'Break-even < 18 شهر؟',
  'شريك مؤسس؟',
  'منافس واحد على الأقل؟',
  'خطة 90 يوم؟',
  'إنفاق على المنتج والمبيعات فقط؟',
  'قيمة مضافة منك؟',
  'تقبّل خسارة 100%؟',
];

export default function InvestorLoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState<boolean[]>(Array(checklist.length).fill(false));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/greenhouse');
      else setChecking(false);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }
      if (data.user) {
        await supabase.from('users').upsert({ id: data.user.id, role: 'investor' }, { onConflict: 'id' });
      }
      router.replace('/greenhouse');
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); setLoading(false); return; }
      router.replace('/greenhouse');
    }
    setLoading(false);
  }

  function toggleCheck(i: number) {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(144,20%,97%)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'hsl(144,58%,26%)' }} />
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ background: 'hsl(144,20%,97%)' }}>

      {/* ── SECTION 1: Login Split ── */}
      <div className="min-h-screen flex">

        {/* Decorative panel */}
        <div
          className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden order-last"
          style={{ background: 'linear-gradient(145deg, hsl(158,30%,10%) 0%, hsl(158,30%,18%) 55%, hsl(43,65%,26%) 100%)' }}
        >
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`
          }} />

          <div className="flex items-center gap-2.5 relative flex-row-reverse">
            <div className="rounded-2xl overflow-hidden shrink-0" style={{ background: 'hsl(0,0%,94%)' }}>
              <Image src="/bazra-icon copy.png" alt="بذرة" width={64} height={64} className="block" />
            </div>
            <div>
              <span className="font-kufam font-bold text-3xl text-white block">بذرة</span>
              <span className="text-xs font-medium" style={{ color: 'hsl(43,90%,65%)' }}>المشتل · للمستثمرين</span>
            </div>
          </div>

          <div className="relative">
            <div className="text-4xl mb-5">🪴</div>
            <h1 className="text-white text-3xl font-extrabold leading-tight mb-4 text-right">
              استثمر في الأفكار<br />
              <span style={{ color: 'hsl(43,90%,62%)' }}>قبل أن تُطلَق</span>
            </h1>
            <p className="text-white/75 text-base mb-10 text-right leading-relaxed">
              نقدم لك فرصاً مبكرة مُحللة ومُقيَّمة — شفافية كاملة، تواصل مباشر، وحماية متبادلة.
            </p>
            <div className="space-y-4">
              {perks.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 justify-end">
                  <span className="text-white font-medium text-sm text-right">{text}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsl(0,0%,100%,0.12)', border: '1px solid hsl(0,0%,100%,0.15)' }}>
                    <Icon className="w-4 h-4" style={{ color: 'hsl(43,90%,65%)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-xs text-right">بذرة تعمل كمنصة وساطة فقط ولا تتدخل في الصفقات</p>
        </div>

        {/* Form panel */}
        <div className="flex-1 flex items-center justify-center p-8" style={{ background: 'hsl(0,0%,100%)' }}>
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2.5 mb-8 flex-row-reverse">
              <div className="rounded-2xl overflow-hidden shrink-0" style={{ background: 'hsl(0,0%,94%)' }}>
                <Image src="/bazra-icon copy.png" alt="بذرة" width={56} height={56} className="block" />
              </div>
              <div>
                <span className="font-kufam font-bold text-2xl block" style={{ color: 'hsl(158,30%,14%)' }}>بذرة</span>
                <span className="text-xs font-medium" style={{ color: 'hsl(144,58%,26%)' }}>المشتل · للمستثمرين</span>
              </div>
            </div>

            <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors" style={{ color: 'hsl(158,20%,32%)' }}>
              <ArrowLeft className="w-4 h-4 rotate-180" />
              العودة للرئيسية
            </Link>

            <div className="mb-8 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: 'hsl(43,85%,92%)', color: 'hsl(43,65%,26%)' }}>
                🪴 بوابة المستثمرين
              </div>
              <h2 className="text-2xl font-extrabold mb-1" style={{ color: 'hsl(158,30%,14%)' }}>
                {mode === 'signin' ? 'أهلاً بعودتك' : 'انضم كمستثمر'}
              </h2>
              <p className="text-sm" style={{ color: 'hsl(158,20%,32%)' }}>
                {mode === 'signin'
                  ? 'سجّل دخولك للوصول إلى المشتل'
                  : 'أنشئ حسابك للوصول إلى أفكار مُحللة وجاهزة للتمويل'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right" style={{ color: 'hsl(158,25%,20%)' }}>
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition text-left"
                  style={{ borderColor: 'hsl(42,25%,82%)', background: 'hsl(42,25%,98%)' }}
                  onFocus={e => e.target.style.borderColor = 'hsl(144,58%,36%)'}
                  onBlur={e => e.target.style.borderColor = 'hsl(42,25%,82%)'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right" style={{ color: 'hsl(158,25%,20%)' }}>
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition text-left"
                  style={{ borderColor: 'hsl(42,25%,82%)', background: 'hsl(42,25%,98%)' }}
                  onFocus={e => e.target.style.borderColor = 'hsl(144,58%,36%)'}
                  onBlur={e => e.target.style.borderColor = 'hsl(42,25%,82%)'}
                />
              </div>

              {error && (
                <div className="px-3.5 py-2.5 rounded-lg text-sm text-right" style={{ background: 'hsl(0,65%,95%)', color: 'hsl(0,65%,36%)' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 shadow-md hover:shadow-lg disabled:opacity-60"
                style={{ background: 'hsl(144,58%,22%)', color: 'white' }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' ? 'دخول إلى المشتل' : 'إنشاء حساب مستثمر'}
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: 'hsl(158,20%,32%)' }}>
              {mode === 'signin' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                className="font-semibold hover:underline"
                style={{ color: 'hsl(144,58%,26%)' }}
              >
                {mode === 'signin' ? 'سجّل كمستثمر' : 'سجّل دخولك'}
              </button>
            </p>

            <div className="mt-10 p-4 rounded-xl text-right" style={{ background: 'hsl(43,85%,96%)', border: '1px solid hsl(43,80%,84%)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: 'hsl(43,65%,26%)' }}>هل أنت رائد أعمال لديك فكرة؟</p>
              <p className="text-xs mb-2" style={{ color: 'hsl(43,50%,38%)' }}>
                هذه البوابة للمستثمرين فقط. لتسجيل فكرتك في بذرة، استخدم الصفحة الرئيسية.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                style={{ color: 'hsl(144,58%,26%)' }}
              >
                انضم كرائد أعمال
                <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 2 — لماذا أنشأنا المشتل؟
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: 'hsl(0,0%,100%)' }}>
        <div className="max-w-4xl mx-auto text-right">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5" style={{ background: 'hsl(144,58%,92%)', color: 'hsl(144,58%,26%)' }}>
            🌍 لماذا أنشأنا المشتل؟
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-5" style={{ color: 'hsl(158,30%,14%)' }}>
            السوق مليء بالأفكار… لكن قليل منها ينمو
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: 'hsl(158,20%,28%)' }}>
            في آخر 5 سنوات، شهدت المنطقة (MENA + تركيا + باكستان) أكثر من 12,000 شركة ناشئة جديدة، لكن:
          </p>
          <ul className="space-y-3 mb-10">
            {[
              '45% تفشل قبل الوصول للمرحلة التالية',
              '90% لا تتجاوز عامها الثاني',
              'التمويل انخفض 50% منذ 2022',
              'المستثمرون يضيعون 20 ساعة أسبوعياً في فرز أفكار غير جاهزة',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 justify-end">
                <span className="text-base leading-relaxed" style={{ color: 'hsl(158,20%,28%)' }}>{item}</span>
                <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: 'hsl(0,65%,46%)' }} />
              </li>
            ))}
          </ul>
          <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, hsl(144,58%,16%) 0%, hsl(144,55%,24%) 100%)' }}>
            <p className="text-lg font-bold text-white leading-relaxed">
              🌱 المشتل يحل المشكلة عبر اختيار البذور التي تنمو فقط.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — كيف نساعد المستثمر؟
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: 'hsl(42,28%,95%)' }}>
        <div className="max-w-4xl mx-auto text-right">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5" style={{ background: 'hsl(43,85%,92%)', color: 'hsl(43,80%,30%)' }}>
            🛡️ كيف نساعد المستثمر؟
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8" style={{ color: 'hsl(158,30%,14%)' }}>
            نظام فلترة يحمي وقتك ومالك
          </h2>
          <ol className="space-y-5 mb-10">
            {[
              { n: '١', title: 'اختبار البذرة', desc: 'نرفض 70% من الأفكار قبل الدخول' },
              { n: '٢', title: 'تقويم البذرة', desc: 'أقل من 75/100 لا يُنشر' },
              { n: '٣', title: 'مرحلة المثمر 🍎', desc: 'لا نعرض إلا الشركات التي لديها عميل دفع فعلياً' },
            ].map((item) => (
              <li key={item.n} className="flex items-start gap-5 flex-row-reverse">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shrink-0" style={{ background: 'hsl(144,58%,22%)', color: 'white' }}>
                  {item.n}
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-bold text-base mb-0.5" style={{ color: 'hsl(158,30%,14%)' }}>{item.title}</p>
                  <p className="text-sm" style={{ color: 'hsl(158,20%,28%)' }}>{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl p-5 border" style={{ background: 'hsl(144,58%,97%)', borderColor: 'hsl(144,50%,78%)' }}>
            <p className="font-bold text-base" style={{ color: 'hsl(144,58%,20%)' }}>
              النتيجة: 60% من بذور المشتل تصل للإثمار مقابل 10% فقط في السوق.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 4 — كيف تقرأ بطاقة البذرة؟
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: 'hsl(0,0%,100%)' }}>
        <div className="max-w-4xl mx-auto text-right">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5" style={{ background: 'hsl(144,58%,92%)', color: 'hsl(144,58%,26%)' }}>
            📊 كيف تقرأ بطاقة البذرة؟
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8" style={{ color: 'hsl(158,30%,14%)' }}>
            4 أرقام تحدد مستقبل أي بذرة
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {[
              { label: 'اسم العلامة + القطاع', icon: '🏷️', note: 'هوية المشروع' },
              { label: 'IRO (العائد المتوقع) — فوق 300% ممتاز', icon: '📈', note: 'العائد على الاستثمار' },
              { label: 'نقطة التعادل — أقل من 12 شهراً مثالي', icon: '⚖️', note: 'متى تسترد استثمارك' },
              { label: 'تقويم البذرة — مثمر 🍎 = جاهز للنمو', icon: '🌟', note: 'درجة الجاهزية' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border flex-row-reverse" style={{ background: 'hsl(42,25%,98%)', borderColor: 'hsl(42,25%,86%)' }}>
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <p className="font-bold text-sm mb-0.5" style={{ color: 'hsl(158,30%,14%)' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: 'hsl(158,20%,38%)' }}>{item.note}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-6 border-r-4" style={{ background: 'hsl(43,85%,96%)', borderColor: 'hsl(43,80%,42%)' }}>
            <p className="font-extrabold text-base mb-1" style={{ color: 'hsl(43,65%,22%)' }}>قاعدة الـ 10 ثوانٍ:</p>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(43,55%,28%)' }}>
              IRO (العائد المتوقع) &gt; 300% + نقطة التعادل &lt; 12 شهر + مثمر 🍎 = اطلب التواصل فوراً.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 5 — أفضل القطاعات 2026
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: 'hsl(158,30%,8%)' }}>
        <div className="max-w-5xl mx-auto text-right">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5" style={{ background: 'hsl(0,0%,100%,0.12)', color: 'hsl(43,90%,70%)' }}>
            🥇 أفضل القطاعات 2026
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-10 text-white">
            أين تزرع أموالك في 2026؟
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                region: 'السعودية والخليج',
                sector: 'B2B SaaS',
                iro: '450%',
                breakeven: '9 أشهر',
                example: 'فاتورة',
                accent: 'hsl(43,90%,65%)',
              },
              {
                region: 'مصر + باكستان',
                sector: 'Fintech',
                iro: '380%',
                breakeven: '14 شهراً',
                example: 'حصالتي',
                accent: 'hsl(144,60%,55%)',
              },
              {
                region: 'تركيا',
                sector: 'E-commerce للخليج',
                iro: '520%',
                breakeven: '7 أشهر',
                example: 'Anatolia Box',
                accent: 'hsl(200,72%,65%)',
              },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl p-6 text-right" style={{ background: 'hsl(0,0%,100%,0.07)', border: '1px solid hsl(0,0%,100%,0.12)' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: card.accent }}>{card.region}</p>
                <h3 className="text-xl font-extrabold text-white mb-5">{card.sector}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <span className="text-xs" style={{ color: 'hsl(42,30%,72%)' }}>IRO</span>
                    <span className="font-bold text-base" style={{ color: card.accent }}>{card.iro}</span>
                  </div>
                  <div className="flex justify-between items-center flex-row-reverse">
                    <span className="text-xs" style={{ color: 'hsl(42,30%,72%)' }}>Break-even</span>
                    <span className="font-bold text-sm text-white">{card.breakeven}</span>
                  </div>
                  <div className="pt-3 border-t" style={{ borderColor: 'hsl(0,0%,100%,0.12)' }}>
                    <p className="text-xs" style={{ color: 'hsl(42,30%,72%)' }}>مثال</p>
                    <p className="font-semibold text-sm text-white">{card.example}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 6 — Checklist المستثمر الذكي
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: 'hsl(42,28%,95%)' }}>
        <div className="max-w-2xl mx-auto text-right">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5" style={{ background: 'hsl(144,58%,92%)', color: 'hsl(144,58%,26%)' }}>
            🧠 قائمة التحقق
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8" style={{ color: 'hsl(158,30%,14%)' }}>
            Checklist المستثمر الذكي
          </h2>
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'hsl(0,0%,100%)', borderColor: 'hsl(42,25%,84%)' }}>
            {checklist.map((item, i) => (
              <button
                key={i}
                onClick={() => toggleCheck(i)}
                className="w-full flex items-center gap-4 px-5 py-4 text-right transition-colors hover:bg-gray-50 flex-row-reverse border-b last:border-b-0"
                style={{ borderColor: 'hsl(42,25%,90%)' }}
              >
                {checked[i]
                  ? <CheckSquare className="w-5 h-5 shrink-0" style={{ color: 'hsl(144,58%,26%)' }} />
                  : <Square className="w-5 h-5 shrink-0" style={{ color: 'hsl(42,25%,65%)' }} />
                }
                <span className="text-sm font-medium flex-1" style={{ color: checked[i] ? 'hsl(144,58%,26%)' : 'hsl(158,20%,28%)' }}>
                  {item}
                </span>
              </button>
            ))}
            <div className="px-5 py-3 flex items-center justify-between flex-row-reverse" style={{ background: 'hsl(144,58%,97%)', borderTop: '1px solid hsl(144,40%,86%)' }}>
              <span className="text-xs font-bold" style={{ color: 'hsl(144,58%,26%)' }}>
                {checked.filter(Boolean).length} / {checklist.length} اكتملت
              </span>
              <div className="h-1.5 rounded-full w-40" style={{ background: 'hsl(144,40%,85%)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(checked.filter(Boolean).length / checklist.length) * 100}%`, background: 'hsl(144,58%,36%)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 7 — قصة نجاح
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: 'hsl(0,0%,100%)' }}>
        <div className="max-w-3xl mx-auto text-right">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5" style={{ background: 'hsl(43,85%,92%)', color: 'hsl(43,80%,30%)' }}>
            🍎 قصة نجاح
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6" style={{ color: 'hsl(158,30%,14%)' }}>
            من بذرة 🌱 إلى عائد 12x خلال 18 شهراً
          </h2>
          <div className="rounded-2xl p-8 border" style={{ background: 'linear-gradient(135deg, hsl(43,85%,97%) 0%, hsl(144,58%,97%) 100%)', borderColor: 'hsl(43,80%,84%)' }}>
            <div className="flex items-center gap-4 mb-5 flex-row-reverse">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'hsl(43,85%,92%)' }}>
                ☕
              </div>
              <div>
                <p className="font-extrabold text-xl" style={{ color: 'hsl(158,30%,14%)' }}>Qahwa Office</p>
                <p className="text-sm" style={{ color: 'hsl(158,20%,38%)' }}>توصيل قهوة مختصة للمكاتب</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'MRR البداية', value: '$530' },
                { label: 'MRR النهاية', value: '$48K' },
                { label: 'التقييم', value: '$1.6M' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'hsl(0,0%,100%)' }}>
                  <p className="text-xl font-extrabold" style={{ color: 'hsl(144,58%,26%)' }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(158,20%,38%)' }}>{label}</p>
                </div>
              ))}
            </div>
            <p className="text-base font-bold text-center" style={{ color: 'hsl(43,65%,26%)' }}>
              عائد 12x — خلال 18 شهراً فقط
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 8 — بطاقة الحصاد المبكر
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: 'linear-gradient(145deg, hsl(158,30%,10%) 0%, hsl(158,30%,18%) 60%, hsl(43,65%,22%) 100%)' }}>
        <div className="max-w-3xl mx-auto text-right">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5" style={{ background: 'hsl(0,0%,100%,0.12)', color: 'hsl(43,90%,70%)' }}>
            🎟️ عرض محدود
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-white">
            بطاقة الحصاد المبكر
          </h2>
          <p className="text-base mb-10" style={{ color: 'hsl(42,35%,75%)' }}>لأول 100 مستثمر فقط</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-10">
            {[
              { icon: '🆓', text: 'اشتراك سنوي مجاني' },
              { icon: '⚡', text: 'أولوية 7 أيام على الفرص الجديدة' },
              { icon: '📬', text: 'نشرة أسبوعية حصرية' },
              { icon: '🎖️', text: 'دعوة VIP لفعاليات بذرة' },
              { icon: '📞', text: 'خط مباشر مع المؤسس' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4 rounded-2xl flex-row-reverse" style={{ background: 'hsl(0,0%,100%,0.08)', border: '1px solid hsl(0,0%,100%,0.12)' }}>
                <span className="text-xl shrink-0">{item.icon}</span>
                <span className="text-sm font-medium text-white">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/greenhouse/early-pass"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-extrabold transition-all shadow-xl hover:shadow-2xl hover:opacity-90"
              style={{ background: 'hsl(43,90%,44%)', color: 'hsl(158,30%,8%)' }}
            >
              احجز مقعدك الآن
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <p className="text-xs mt-4" style={{ color: 'hsl(42,30%,65%)' }}>متبقي أقل من 100 مقعد — لا تفوّت الفرصة</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 9 — تواصل معنا
      ══════════════════════════════════════════ */}
      <section className="py-16 px-6" style={{ background: 'hsl(42,25%,97%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold mb-3" style={{ color: 'hsl(158,30%,14%)' }}>تواصل معنا</h2>
          <p className="text-sm mb-6" style={{ color: 'hsl(158,20%,28%)' }}>
            لأي استفسار حول البذور أو الاستثمار:
          </p>
          <a
            href="mailto:lifeeasy2224@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
            style={{ background: 'hsl(144,58%,92%)', color: 'hsl(144,58%,20%)' }}
          >
            <Mail className="w-4 h-4" />
            lifeeasy2224@gmail.com
          </a>
        </div>
      </section>

    </div>
  );
}
