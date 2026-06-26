// 📁 FILE: app/page.tsx
// 📋 ACTION: REPLACE existing file (overwrite completely)
// ─────────────────────────────────────────
// CHANGE: Removed SiteHeader + SiteFooter imports and usage
//         (layout.tsx now handles both globally)
//         Removed <div className="h-16" /> spacer
//         (layout.tsx adds pt-16 to <main> already)
// KEPT:   All page content exactly as-is
// ─────────────────────────────────────────
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, FileText, Trash2, Star, Users, Lightbulb, Target, Rocket, ChartLine as LineChart, BadgeCheck, Layers, Sprout, CheckCircle } from 'lucide-react'
import Testimonials from '@/components/Testimonials'
import GreenhouseLink from '@/components/GreenhouseLink'

export default function LandingPage() {
  return (
    <div dir="rtl" className="min-h-screen overflow-x-hidden" style={{ background: 'var(--off-white)', fontFamily: "'Noto Kufi Arabic', sans-serif" }}>

      {/* ══════════════════════════════════════
          HERO — full-bleed dark green
      ══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'var(--green-deep)', paddingTop: '96px', paddingBottom: '112px' }}
      >
        {/* Subtle diagonal pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 40px,
              rgba(255,255,255,0.02) 40px,
              rgba(255,255,255,0.02) 41px
            )`,
          }}
        />
        {/* Glow accent */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(27,107,62,0.45) 0%, transparent 70%)', top: '-100px' }}
        />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
            style={{ background: 'rgba(212,166,83,0.12)', color: 'var(--gold)', border: '1px solid rgba(212,166,83,0.25)' }}
          >
            <Sprout className="w-3.5 h-3.5" />
            منصة تطوير المشاريع الريادية
          </div>
          <h1
            className="font-extrabold leading-tight mb-6 text-white"
            style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', letterSpacing: '-0.02em', lineHeight: 1.15 }}
          >
            حوّل فكرتك إلى مشروع
            <br />
            <span style={{ color: 'var(--gold)' }}>جاهز للإطلاق والتمويل</span>
          </h1>
          <p
            className="mx-auto mb-10 leading-relaxed"
            style={{ color: 'rgba(247,243,236,0.72)', fontSize: '1.125rem', maxWidth: '540px' }}
          >
            بذرة تأخذك من الفكرة إلى ملف جاهز للمستثمر — تحليلاً وتصميماً وتخطيطاً مالياً بخطوات واضحة.
          </p>
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-extrabold transition-all hover:opacity-90 shadow-lg"
              style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
            >
              ابدأ رحلتك مجاناً
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <GreenhouseLink
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-base font-medium transition-all border"
              style={{ borderColor: 'rgba(255,255,255,0.18)', color: 'rgba(247,243,236,0.85)', background: 'rgba(255,255,255,0.06)' }}
            >
              مستثمر؟ تفضّل للمشتل
            </GreenhouseLink>
          </div>
          {/* Social proof strip */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
            {[
              { value: '+٢٠٠٠', label: 'مؤسس نشط' },
              { value: '+٤٠٠',  label: 'مستثمر مسجّل' },
              { value: '+٨٠٠٠', label: 'فكرة محلّلة' },
              { value: '٤ خطوات', label: 'رحلة ريادية واضحة' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-extrabold text-2xl" style={{ color: 'var(--gold)' }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(247,243,236,0.5)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TRUST BAR
      ══════════════════════════════════════ */}
      <div
        className="border-b border-t"
        style={{ background: 'var(--white)', borderColor: 'var(--gray-light)' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: 'var(--gray-mid)' }}>
          {[
            '✅ تجربة مجانية — بدون بطاقة',
            '✅ بيانات مشفّرة بالكامل',
            '✅ ملكية فكرية كاملة للمؤسس',
            '✅ إلغاء في أي وقت',
          ].map(t => <span key={t} className="font-medium">{t}</span>)}
        </div>
      </div>

      {/* ══════════════════════════════════════
          1. ماذا تفعل بذرة؟
      ══════════════════════════════════════ */}
      <section className="py-24 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(27,107,62,0.08)', color: 'var(--green-brand)' }}
          >
            ماذا تفعل بذرة؟
          </span>
          <h2
            className="font-extrabold mb-4"
            style={{ color: 'var(--text-dark)', fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}
          >
            من فكرة مبعثرة … إلى مشروع جاهز للتنفيذ
          </h2>
          <p className="text-base max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--gray-mid)' }}>
            رحلة منظّمة تحوّل فكرتك الخامة إلى ملف كامل يشمل التحليل والتصميم والأرقام.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              icon: Lightbulb,
              color: 'var(--gold)',
              bg: 'rgba(212,166,83,0.1)',
              title: 'تحليل الفكرة والجمهور',
              desc: 'نحدد المشكلة بدقة، نعرّف جمهورك المستهدف، ونصوغ القيمة الفريدة لمشروعك.',
              tags: ['القيمة المقترحة', 'شريحة العملاء', 'المشكلة والحل'],
            },
            {
              icon: Layers,
              color: 'var(--green-brand)',
              bg: 'rgba(27,107,62,0.08)',
              title: 'تصميم تجربة المستخدم',
              desc: 'تدفق المستخدم والإطارات الأولية لتخيّل المنتج بوضوح قبل البناء.',
              tags: ['تدفق المستخدم', 'الإطارات الأولية', 'مسار التجربة'],
            },
            {
              icon: LineChart,
              color: 'var(--green-deep)',
              bg: 'rgba(15,61,36,0.07)',
              title: 'التحليل المالي الكامل',
              desc: 'نموذج مالي يشمل الإيرادات والنفقات والتدفقات النقدية ونقطة التعادل.',
              tags: ['نقطة التعادل', 'التدفق النقدي', 'الربحية'],
            },
            {
              icon: Rocket,
              color: 'var(--gold)',
              bg: 'rgba(212,166,83,0.1)',
              title: 'ملف جاهز للممولين',
              desc: 'عرض تقديمي احترافي يشمل خلاصة الفكرة والأرقام والخطة للمستثمرين.',
              tags: ['العرض التقديمي', 'الملخص التنفيذي', 'خطة النمو'],
            },
          ].map(({ icon: Icon, color, bg, title, desc, tags }, i) => (
            <div
              key={i}
              className="group p-7 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-right"
              style={{
                background: 'var(--white)',
                borderColor: 'var(--gray-light)',
                boxShadow: '0 2px 8px rgba(15,61,36,0.06)',
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: bg }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-dark)' }}>{title}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--gray-mid)' }}>{desc}</p>
              <div className="flex flex-wrap gap-2 flex-row-reverse">
                {tags.map(t => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: bg, color }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          2. رحلة الريادي — 4 STEPS
      ══════════════════════════════════════ */}
      <section className="py-24" style={{ background: 'var(--green-deep)' }} id="how-it-works">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: 'rgba(212,166,83,0.12)', color: 'var(--gold)', border: '1px solid rgba(212,166,83,0.2)' }}
            >
              رحلة الريادي
            </span>
            <h2 className="font-extrabold mb-4 text-white" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}>
              من البذرة إلى الإثمار في ٤ خطوات
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: '١', icon: Lightbulb, title: 'اكتشف الفكرة', desc: 'حلّل المشكلة، حدّد جمهورك، وصُغ قيمتك الفريدة.' },
              { n: '٢', icon: Target,    title: 'ابنِ القيمة',  desc: 'حوّل الفكرة إلى قيمة قابلة للقياس والتحقق.' },
              { n: '٣', icon: LineChart, title: 'حلّل الأرقام', desc: 'نموذج مالي كامل — إيرادات، نفقات، تدفقات نقدية.' },
              { n: '٤', icon: Rocket,    title: 'أطلق وانمُ',  desc: 'ملف جاهز للمستثمرين ومسار واضح للنمو.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className="relative inline-flex w-14 h-14 rounded-2xl items-center justify-center mx-auto mb-5 font-extrabold text-xl"
                  style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
                >
                  {s.n}
                </div>
                <h3 className="font-bold text-base mb-2 text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(247,243,236,0.55)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-extrabold text-base transition-all hover:opacity-90 shadow-lg"
              style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
            >
              ابدأ رحلتك الآن
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. لمن صُممت بذرة؟
      ══════════════════════════════════════ */}
      <section className="py-24 max-w-5xl mx-auto px-6" id="what">
        <div className="text-center mb-14">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(212,166,83,0.1)', color: 'var(--gold)' }}
          >
            لمن صُممت بذرة؟
          </span>
          <h2 className="font-extrabold" style={{ color: 'var(--text-dark)', fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}>
            منصة مبنية لك أنت
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: Lightbulb, title: 'رواد الأعمال',            desc: 'في مرحلة الفكرة أو البناء الأول.' },
            { icon: Rocket,    title: 'أصحاب المشاريع الصغيرة', desc: 'يريدون نمواً منظماً وخطة واضحة.' },
            { icon: Layers,    title: 'طلاب التقنية والأعمال',  desc: 'لديهم فكرة تطبيق أو مشروع ريادي.' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div
              key={i}
              className="p-7 rounded-2xl border text-center transition-all hover:-translate-y-1"
              style={{ background: 'var(--white)', borderColor: 'var(--gray-light)', boxShadow: '0 2px 8px rgba(15,61,36,0.06)' }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(27,107,62,0.07)' }}
              >
                <Icon className="w-6 h-6" style={{ color: 'var(--green-brand)' }} />
              </div>
              <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text-dark)' }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--gray-mid)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          4. التحليل المالي
      ══════════════════════════════════════ */}
      <section
        id="financial"
        className="py-24"
        style={{ background: 'var(--white)', borderTop: '1px solid var(--gray-light)', borderBottom: '1px solid var(--gray-light)' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="text-right">
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
                style={{ background: 'rgba(27,107,62,0.07)', color: 'var(--green-brand)' }}
              >
                التحليل المالي
              </span>
              <h2
                className="font-extrabold mb-5"
                style={{ color: 'var(--text-dark)', fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', lineHeight: 1.3 }}
              >
                تحليل مالي واقعي…
                <br />
                <span style={{ color: 'var(--green-brand)' }}>يلبي متطلبات الممولين</span>
              </h2>
              <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--gray-mid)' }}>
                نساعدك على بناء نموذج مالي مبني على جهد مشترك جاهز لعرضه على الممولين، يشمل الإيرادات والنفقات والتدفقات النقدية ونقطة التعادل والربحية خلال ١٢ شهراً.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  'نسألك عن سعر المنتج وعدد الوحدات المتوقعة',
                  'نقترح نفقات ثابتة وتشغيلية حسب نوع مشروعك',
                  'نراجع الأرقام ونضيف النواقص',
                  'نولّد جدول تدفقات نقدية جاهز للمستثمر',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 flex-row-reverse text-right">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--green-brand)' }} />
                    <span className="text-sm" style={{ color: 'var(--gray-mid)' }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ background: 'var(--green-brand)', color: 'var(--white)' }}
              >
                ابدأ التحليل المالي
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
            {/* Visual table */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--gray-light)', boxShadow: '0 4px 24px rgba(15,61,36,0.08)' }}
            >
              <div
                className="px-5 py-4 flex items-center gap-2 flex-row-reverse"
                style={{ background: 'var(--green-brand)' }}
              >
                <LineChart className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">نموذج التدفقات النقدية — ١٢ شهراً</span>
              </div>
              <div style={{ background: 'var(--white)' }}>
                {[
                  { label: 'الإيرادات المتوقعة', value: '$120,000', tag: 'سنوياً',  color: 'var(--green-brand)' },
                  { label: 'النفقات الثابتة',    value: '$24,000',  tag: 'سنوياً',  color: 'var(--text-dark)' },
                  { label: 'النفقات التشغيلية',  value: '$18,000',  tag: 'سنوياً',  color: 'var(--text-dark)' },
                  { label: 'نقطة التعادل',       value: 'الشهر ٤', tag: 'تقريباً', color: 'var(--gold)' },
                  { label: 'صافي الربح (س١)',   value: '$78,000',  tag: 'تقديري',  color: 'var(--green-brand)' },
                ].map(({ label, value, tag, color }, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-5 py-3.5 border-b text-sm flex-row-reverse"
                    style={{ borderColor: 'var(--gray-light)' }}
                  >
                    <span style={{ color: 'var(--gray-mid)' }}>{label}</span>
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <span className="font-bold" style={{ color }}>{value}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--off-white)', color: 'var(--gray-mid)' }}>
                        {tag}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="px-5 py-3.5 text-xs text-right" style={{ color: 'var(--gray-mid)', background: 'var(--off-white)' }}>
                  ⚠️ مثال توضيحي فقط — الأرقام الفعلية تختلف حسب طبيعة مشروعك.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          5. مثال حقيقي — DEMO
      ══════════════════════════════════════ */}
      <section id="demo" className="py-24 max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(212,166,83,0.1)', color: 'var(--gold)' }}
          >
            مثال حقيقي
          </span>
          <h2 className="font-extrabold mb-3" style={{ color: 'var(--text-dark)', fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}>
            هكذا ستبدو بذرتك جاهزةً للعرض
          </h2>
          <p className="text-sm" style={{ color: 'var(--gray-mid)' }}>فكرة متخيّلة — منصة توصيل قهوة مختصة للمكاتب</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl border text-right" style={{ background: 'var(--white)', borderColor: 'var(--gray-light)', boxShadow: '0 2px 8px rgba(15,61,36,0.06)' }}>
            <div className="flex items-center gap-2 mb-4 flex-row-reverse">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,166,83,0.1)' }}>
                <Lightbulb className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--gold)' }}>الفكرة</span>
            </div>
            <h3 className="font-bold mb-2" style={{ color: 'var(--text-dark)' }}>توصيل قهوة مختصة للمكاتب</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--gray-mid)' }}>
              موظفو المكاتب لا يجدون قهوة جيدة دون مغادرة المبنى. نوصّل قهوة طازجة خلال ١٥ دقيقة.
            </p>
            <div className="flex flex-wrap gap-2 flex-row-reverse">
              {['خدمات', 'توصيل', 'B2B'].map(t => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(212,166,83,0.1)', color: 'var(--gold)' }}>{t}</span>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-2xl border text-right" style={{ background: 'rgba(27,107,62,0.03)', borderColor: 'rgba(27,107,62,0.15)', boxShadow: '0 2px 8px rgba(15,61,36,0.06)' }}>
            <div className="flex items-center gap-2 mb-4 flex-row-reverse">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(27,107,62,0.1)' }}>
                <LineChart className="w-4 h-4" style={{ color: 'var(--green-brand)' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--green-brand)' }}>التحليل المالي</span>
            </div>
            <div className="space-y-2">
              {[
                { k: 'سعر الوحدة',       v: '$25' },
                { k: 'وحدات/شهر (هدف)',  v: '١٢٠٠' },
                { k: 'الإيراد الشهري',   v: '$30,000' },
                { k: 'نقطة التعادل',     v: 'الشهر ٤' },
                { k: 'الربح بعد ١٢ شهر', v: '+$85,000' },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between text-sm border-b pb-1.5 flex-row-reverse" style={{ borderColor: 'rgba(27,107,62,0.1)' }}>
                  <span style={{ color: 'var(--gray-mid)' }}>{k}</span>
                  <span className="font-bold" style={{ color: 'var(--text-dark)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-2xl border text-right" style={{ background: 'rgba(212,166,83,0.05)', borderColor: 'rgba(212,166,83,0.25)', boxShadow: '0 2px 8px rgba(15,61,36,0.06)' }}>
            <div className="flex items-center gap-2 mb-4 flex-row-reverse">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,166,83,0.12)' }}>
                <Star className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--gold)' }}>تقويم الفكرة</span>
            </div>
            <div className="flex items-center justify-center my-4">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--gray-light)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--green-brand)" strokeWidth="10" strokeDasharray="251 314" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold" style={{ color: 'var(--green-brand)' }}>٨٠</span>
                  <span className="text-xs" style={{ color: 'var(--gray-mid)' }}>/ ١٠٠</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { k: 'القيمة المقدمة',  v: 17, max: 20 },
                { k: 'التحقق الميداني', v: 15, max: 20 },
                { k: 'قابلية التنفيذ',  v: 16, max: 20 },
              ].map(b => (
                <div key={b.k}>
                  <div className="flex justify-between text-xs mb-1 flex-row-reverse">
                    <span style={{ color: 'var(--gray-mid)' }}>{b.k}</span>
                    <span className="font-bold" style={{ color: 'var(--green-brand)' }}>{b.v}/{b.max}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--gray-light)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(b.v / b.max) * 100}%`, background: 'var(--green-brand)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          6. بذرتك ملكك — SECURITY
      ══════════════════════════════════════ */}
      <section className="py-24" style={{ background: 'var(--white)', borderTop: '1px solid var(--gray-light)', borderBottom: '1px solid var(--gray-light)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(27,107,62,0.07)' }}>
            <Shield className="w-7 h-7" style={{ color: 'var(--green-brand)' }} />
          </div>
          <h2 className="font-extrabold mb-3" style={{ color: 'var(--text-dark)', fontSize: 'clamp(1.5rem, 3.5vw, 2rem)' }}>
            بذرتك ملكك وحدك
          </h2>
          <p className="mb-10 text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>
            نبني بذرة على مبدأ واحد:{' '}
            <strong style={{ color: 'var(--text-dark)' }}>أنت وحدك تملك حقوق الملكية الفكرية لبذرتك.</strong>
          </p>
          <div className="grid md:grid-cols-3 gap-5 text-right">
            {[
              { icon: Lock,     title: 'تشفير كامل',     desc: 'كل الأفكار والبيانات مشفرة — حتى فريقنا لا يمكنه قراءتها.' },
              { icon: FileText, title: 'اتفاقية قانونية', desc: 'نوافق قانونياً على عدم استخدام أو نسخ أو مشاركة فكرتك.' },
              { icon: Trash2,   title: 'احذف في أي وقت', desc: 'يمكنك حذف فكرتك وبياناتك نهائياً بضغطة زر واحدة.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="p-5 rounded-xl border" style={{ background: 'var(--off-white)', borderColor: 'var(--gray-light)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(27,107,62,0.07)' }}>
                  <Icon className="w-4 h-4" style={{ color: 'var(--green-brand)' }} />
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-dark)' }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--gray-mid)' }}>{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/ip-policy" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: 'var(--green-brand)' }}>
              اقرأ سياسة حماية الملكية الفكرية الكاملة
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          7. التمويل — INVESTOR MATCHING
      ══════════════════════════════════════ */}
      <section id="investors" className="py-24" style={{ background: 'var(--green-deep)' }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
            style={{ background: 'rgba(212,166,83,0.12)', color: 'var(--gold)', border: '1px solid rgba(212,166,83,0.2)' }}
          >
            التمويل والمستثمرون
          </span>
          <h2 className="font-extrabold mb-5 text-white" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}>
            لا نترك فكرتك في ملف…
            <br />
            <span style={{ color: 'var(--gold)' }}>نربطك بالممولين المناسبين</span>
          </h2>
          <p className="text-base mb-14 max-w-xl mx-auto" style={{ color: 'rgba(247,243,236,0.65)' }}>
            بعد تجهيز فكرتك وتحليلها مالياً، نعرض مشروعك — بموافقتك — على شبكة من المستثمرين المهتمين.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileText,   label: 'ملف مشروع جاهز للعرض',  desc: 'وثيقة احترافية تلخّص فكرتك وأرقامك.' },
              { icon: BadgeCheck, label: 'تقييم جودة الفكرة',       desc: 'نقاط من ١٠٠ على ٦ معايير ريادية.' },
              { icon: Users,      label: 'لوحة للمستثمرين',         desc: 'إتاحة مشروعك لشبكة ممولين مختارين.' },
              { icon: Shield,     label: 'تواصل آمن بين الطرفين',   desc: 'بياناتك محمية وهويتك في يدك.' },
            ].map(({ icon: Icon, label, desc }, i) => (
              <div key={i} className="rounded-2xl p-6 text-right" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(212,166,83,0.12)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                </div>
                <p className="font-bold text-sm text-white mb-1">{label}</p>
                <p className="text-xs" style={{ color: 'rgba(247,243,236,0.5)' }}>{desc}</p>
              </div>
            ))}
          </div>
          <GreenhouseLink
            className="inline-flex items-center gap-2 mt-12 px-8 py-4 rounded-xl font-extrabold text-base transition-all hover:opacity-90 shadow-lg"
            style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
          >
            تصفح المشتل
            <ArrowLeft className="w-5 h-5" />
          </GreenhouseLink>
        </div>
      </section>

      {/* ══════════════════════════════════════
          8. TESTIMONIALS
      ══════════════════════════════════════ */}
      <div id="testimonials">
        <Testimonials />
      </div>

      {/* ══════════════════════════════════════
          9. PRICING TEASER
      ══════════════════════════════════════ */}
      <section id="pricing" className="py-24" style={{ background: 'var(--white)', borderTop: '1px solid var(--gray-light)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(27,107,62,0.07)', color: 'var(--green-brand)' }}
          >
            الأسعار
          </span>
          <h2 className="font-extrabold mb-3" style={{ color: 'var(--text-dark)', fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}>
            أسعار تناسب كل مرحلة
          </h2>
          <p className="text-sm mb-12" style={{ color: 'var(--gray-mid)' }}>
            ابدأ مجاناً واترقَّ عند الحاجة — بدون عقود أو التزامات.
          </p>
          <div className="grid sm:grid-cols-4 gap-4 mb-10">
            {[
              { icon: '🌱', name: 'مجاني',       price: '$0',      desc: 'للاستكشاف',      popular: false },
              { icon: '🌿', name: 'برو',          price: '$19/شهر', desc: 'AI + غير محدود', popular: true },
              { icon: '🚀', name: 'نمو',          price: '$49/شهر', desc: 'فريق + أولوية',  popular: false },
              { icon: '🏢', name: 'أكسيليريتور', price: 'مخصص',    desc: 'للشركات',         popular: false },
            ].map((p, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border relative"
                style={{
                  background: p.popular ? 'var(--off-white)' : 'var(--white)',
                  borderColor: p.popular ? 'var(--green-brand)' : 'var(--gray-light)',
                  boxShadow: p.popular ? '0 4px 16px rgba(27,107,62,0.1)' : undefined,
                }}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'var(--green-brand)', color: 'var(--white)' }}>
                    الأكثر شعبية
                  </div>
                )}
                <div className="text-2xl mb-2">{p.icon}</div>
                <div className="font-bold text-sm mb-0.5" style={{ color: 'var(--text-dark)' }}>{p.name}</div>
                <div className="font-extrabold text-base mb-1" style={{ color: p.popular ? 'var(--green-brand)' : 'var(--text-dark)' }}>{p.price}</div>
                <div className="text-xs" style={{ color: 'var(--gray-mid)' }}>{p.desc}</div>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90" style={{ background: 'var(--green-brand)', color: 'var(--white)' }}>
            شاهد جميع الباقات
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════
          10. بذور جاهزة — IDEAS LIBRARY
      ══════════════════════════════════════ */}
      <section className="py-24" style={{ background: 'var(--off-white)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
              style={{ background: 'rgba(27,107,62,0.07)', color: 'var(--green-brand)' }}
            >
              بذور جاهزة للزراعة
            </span>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--text-dark)', fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}>
              ما عندك فكرة؟ لا مشكلة
            </h2>
            <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--gray-mid)' }}>
              اختر من <strong style={{ color: 'var(--text-dark)' }}>40+ فكرة مشروع</strong> مدروسة وجاهزة للتنفيذ، خصّصها لسوقك، وابدأ رحلتك فوراً.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {[
              { icon: '🍎', label: 'الزراعة والغذاء' },
              { icon: '💻', label: 'برمجيات الأعمال' },
              { icon: '🛒', label: 'التجارة الإلكترونية' },
              { icon: '💰', label: 'التقنية المالية' },
              { icon: '📚', label: 'التعليم الإلكتروني' },
              { icon: '🏥', label: 'تقنية الصحة' },
              { icon: '🚚', label: 'اللوجستيات' },
              { icon: '🔧', label: 'الخدمات المهنية' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium" style={{ background: 'var(--white)', borderColor: 'var(--gray-light)', color: 'var(--text-dark)' }}>
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: '🍎', sector: 'الزراعة والغذاء',    title: 'توصيل خضار طازجة للمكاتب',              iro: '~350%', breakeven: '~8 أشهر' },
              { icon: '💻', sector: 'برمجيات الأعمال',    title: 'نظام إدارة مخزون للمطاعم',              iro: '~420%', breakeven: '~10 أشهر' },
              { icon: '📚', sector: 'التعليم الإلكتروني', title: 'تطبيق تحفيظ القرآن بالذكاء الاصطناعي', iro: '~500%', breakeven: '~10 أشهر' },
            ].map((card, i) => (
              <div key={i} className="p-5 rounded-2xl border text-right" style={{ background: 'var(--white)', borderColor: 'var(--gray-light)', boxShadow: '0 2px 8px rgba(15,61,36,0.06)' }}>
                <div className="flex items-center gap-2 flex-row-reverse mb-3">
                  <span className="text-lg">{card.icon}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(27,107,62,0.07)', color: 'var(--green-brand)' }}>
                    {card.sector}
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-dark)' }}>{card.title}</h3>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--gray-mid)' }}>
                  <span className="font-semibold" style={{ color: 'var(--green-brand)' }}>IRO: {card.iro}</span>
                  <span>التعادل: {card.breakeven}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:opacity-90 shadow-md" style={{ background: 'var(--green-brand)', color: 'var(--white)' }}>
              استكشف 40+ فكرة جاهزة — مجاناً
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          11. FINAL CTA
      ══════════════════════════════════════ */}
      <section className="py-28" style={{ background: 'var(--green-deep)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mx-auto mb-8" style={{ background: 'rgba(212,166,83,0.12)' }}>
            <Sprout className="w-8 h-8" style={{ color: 'var(--gold)' }} />
          </div>
          <h2 className="font-extrabold mb-5 text-white leading-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}>
            فكرتك تستحق أن تُبنى…
            <br />
            <span style={{ color: 'var(--gold)' }}>لا تبقَ في رأسك</span>
          </h2>
          <p className="text-base mb-10" style={{ color: 'rgba(247,243,236,0.6)' }}>
            ابدأ رحلتك الآن واحصل على تحليل كامل + تصميم + خطة مالية + ملف جاهز للمستثمر.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2.5 px-10 py-5 rounded-xl text-lg font-extrabold transition-all hover:opacity-90 shadow-xl"
            style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
          >
            ابدأ الآن — مجاناً
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <p className="mt-5 text-xs" style={{ color: 'rgba(247,243,236,0.35)' }}>
            بدون بطاقة ائتمان · إلغاء في أي وقت
          </p>
        </div>
      </section>

    </div>
  )
}
