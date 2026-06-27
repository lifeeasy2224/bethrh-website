// 📁 FILE: app/ideas-library/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Users, TrendingUp, Clock, DollarSign, Sprout,
  TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2,
  Zap, ChevronRight, Lock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Seed = {
  id: string; slug: string; name: string;
  sector_id: string; sector_emoji: string; sector_label: string;
  short_description: string | null; problem: string | null;
  solution: string | null; target_customer: string | null;
  revenue_model: string | null; financial_estimates: string | null;
  why_it_works: string | null; risks: string | null;
  best_markets: string | null; quick_start_steps: string | null;
  investment_min: number; investment_max: number;
  roi_estimate: number; break_even_months: number;
  max_spots: number; spots_taken: number;
};

type UserTier = 'free' | 'pro' | 'growth' | 'accelerator' | null;

function formatUSD(n: number) { return '$' + n.toLocaleString('en-US'); }

function BulletList({ text, locked }: { text: string; locked?: boolean }) {
  const items = text.split(' | ').map(s => s.trim()).filter(Boolean);
  if (locked) {
    return (
      <div className="space-y-2">
        {items.slice(0, 1).map((item, i) => (
          <p key={i} className="text-sm leading-relaxed text-right" style={{ color: 'hsl(158,20%,28%)' }}>{item}</p>
        ))}
        {items.length > 1 && (
          <div className="flex items-center gap-2 flex-row-reverse opacity-50 select-none">
            <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(144,58%,35%)' }} />
            <span className="text-sm text-right" style={{ color: 'hsl(158,20%,28%)' }}>
              +{items.length - 1} نقاط أخرى (متاحة للمشتركين)
            </span>
          </div>
        )}
      </div>
    );
  }
  if (items.length <= 1) return <p className="text-sm leading-relaxed text-right" style={{ color: 'hsl(158,20%,28%)' }}>{text}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed flex-row-reverse text-right" style={{ color: 'hsl(158,20%,28%)' }}>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'hsl(144,58%,35%)' }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({ emoji, title, content, accentBg, accentBorder, accentTitle, locked }: {
  emoji: string; title: string; content: string | null;
  accentBg: string; accentBorder: string; accentTitle: string; locked?: boolean;
}) {
  if (!content) return null;
  return (
    <div className="rounded-2xl border p-5 relative" style={{ background: locked ? 'hsl(0,0%,98%)' : accentBg, borderColor: locked ? 'hsl(0,0%,88%)' : accentBorder }}>
      <h2 className="font-bold text-sm mb-3 flex items-center gap-2 flex-row-reverse" style={{ color: locked ? 'hsl(0,0%,50%)' : accentTitle }}>
        <span className="text-base">{locked ? '🔒' : emoji}</span>
        {title}
        {locked && <span className="text-xs font-normal opacity-60">(للمشتركين فقط)</span>}
      </h2>
      {locked ? (
        <div className="blur-sm select-none pointer-events-none">
          <BulletList text={content} />
        </div>
      ) : (
        <BulletList text={content} />
      )}
    </div>
  );
}

// ── Upgrade CTA banner ────────────────────────────────────────────
function UpgradeBanner({ seedName }: { seedName: string }) {
  return (
    <div
      className="rounded-2xl border p-6 text-center space-y-4"
      style={{ background: 'var(--green-deep)', borderColor: 'rgba(212,166,83,0.3)' }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(212,166,83,0.15)' }}>
        <Lock className="w-6 h-6" style={{ color: 'var(--gold)' }} />
      </div>
      <div>
        <h3 className="font-extrabold text-lg text-white mb-1">اشترك للوصول الكامل</h3>
        <p className="text-sm" style={{ color: 'rgba(247,243,236,0.7)' }}>
          اشترك في خطة برو للاطلاع على كامل تفاصيل <strong className="text-white">{seedName}</strong> والتقاط البذرة لمشروعك
        </p>
      </div>

      {/* Pricing tiers */}
      <div className="grid grid-cols-2 gap-3 text-right">
        {[
          { name: '🌿 برو', price: '$9/شهر', features: ['أفكار غير محدودة', 'تفاصيل كاملة', 'مدرب AI', 'التحقق من الفكرة'], popular: true },
          { name: '🚀 نمو', price: '$19/شهر', features: ['كل ما في برو', 'فريق حتى 3 أعضاء', 'أولوية الدعم', 'تقارير متقدمة'], popular: false },
        ].map(tier => (
          <div
            key={tier.name}
            className="rounded-xl p-4 relative"
            style={{
              background: tier.popular ? 'rgba(212,166,83,0.15)' : 'rgba(255,255,255,0.05)',
              border: tier.popular ? '1px solid rgba(212,166,83,0.4)' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {tier.popular && (
              <div className="absolute -top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}>
                الأكثر شعبية
              </div>
            )}
            <div className="font-bold text-sm text-white mb-0.5">{tier.name}</div>
            <div className="font-extrabold mb-3" style={{ color: 'var(--gold)' }}>{tier.price}</div>
            <ul className="space-y-1">
              {tier.features.map(f => (
                <li key={f} className="flex items-center gap-1.5 flex-row-reverse text-xs" style={{ color: 'rgba(247,243,236,0.7)' }}>
                  <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: 'var(--gold)' }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Link
          href="/pricing"
          className="block w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
        >
          اشترك الآن — ابدأ من $9/شهر
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2 text-center text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(247,243,236,0.5)' }}>
            🏢 المسرعات: <Link href="/help" className="underline">تواصل معنا</Link>
          </div>
          <div className="rounded-lg p-2 text-center text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(247,243,236,0.5)' }}>
            ✅ إلغاء في أي وقت
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicSeedDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [seed, setSeed]             = useState<Seed | null>(null);
  const [loading, setLoading]       = useState(true);
  const [authUser, setAuthUser]     = useState<{ id: string; role?: string } | null>(null);
  const [userTier, setUserTier]     = useState<UserTier>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [grabbing, setGrabbing]     = useState(false);
  const [grabError, setGrabError]   = useState('');

  useEffect(() => {
    fetch(`/api/seeds/${slug}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setSeed(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data: profile } = await supabase
        .from('users')
        .select('role, subscription_tier')
        .eq('id', session.user.id)
        .maybeSingle();
      setAuthUser({ id: session.user.id, role: profile?.role });
      setUserTier(profile?.subscription_tier ?? 'free');
    });
  }, []);

  // Free users can see: hero card, problem preview, first bullet of solution
  // Paid users can see: everything
  const isPaid = userTier === 'pro' || userTier === 'growth' || userTier === 'accelerator';
  const isLoggedIn = !!authUser;

  async function handleGrab() {
    if (!authUser) { router.push('/signup'); return; }
    if (authUser.role === 'investor') { setGrabError('هذه الميزة للمؤسسين فقط'); return; }
    if (!isPaid) { router.push('/pricing'); return; }

    setGrabbing(true);
    setGrabError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/signup'); return; }

    const res = await fetch(`/api/seeds/${slug}/grab`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = await res.json();
    if (!res.ok) { setGrabError(result.error ?? 'حدث خطأ، حاول مجدداً'); setGrabbing(false); return; }
    router.push(`/ideas/${result.idea_id}`);
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen" style={{ background: 'hsl(42,25%,97%)' }}>
        <div className="max-w-3xl mx-auto px-6 pt-24 space-y-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!seed) {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'hsl(42,25%,97%)' }}>
        <p style={{ color: 'hsl(158,20%,30%)' }}>لم يتم العثور على هذه البذرة</p>
        <Link href="/ideas-library" className="text-sm font-medium underline" style={{ color: 'var(--green-brand)' }}>
          العودة للمكتبة
        </Link>
      </div>
    );
  }

  const spotsLeft = seed.max_spots - seed.spots_taken;
  const isFull    = spotsLeft <= 0;

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: 'hsl(42,25%,97%)' }}>

      <div className="max-w-3xl mx-auto px-5 py-10 space-y-5">

        {/* Back */}
        <Link href="/ideas-library"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors flex-row-reverse hover:opacity-80"
          style={{ color: 'var(--green-brand)' }}>
          <ArrowRight className="w-4 h-4" />
          مكتبة الأفكار
        </Link>

        {/* ── Hero card — always visible ── */}
        <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: 'hsl(42,25%,86%)' }}>
          <div className="flex items-start justify-between gap-3 flex-row-reverse mb-4">
            <div className="flex-1 text-right">
              <div className="flex items-center gap-2 flex-row-reverse mb-2">
                <span className="text-2xl">{seed.sector_emoji}</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'hsl(144,58%,93%)', color: 'var(--green-deep)' }}>
                  {seed.sector_label}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--text-dark)' }}>{seed.name}</h1>
              {seed.short_description && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>{seed.short_description}</p>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border"
              style={isFull
                ? { background: 'hsl(0,80%,97%)', borderColor: 'hsl(0,60%,80%)', color: 'hsl(0,60%,38%)' }
                : { background: 'hsl(144,58%,96%)', borderColor: 'var(--green-brand)', color: 'var(--green-brand)' }
              }>
              <Users className="w-3.5 h-3.5" />
              {isFull ? 'مكتملة' : `${spotsLeft}/${seed.max_spots} متبقي`}
            </div>
          </div>

          {/* Financial strip — always visible */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t" style={{ borderColor: 'hsl(42,25%,88%)' }}>
            {[
              { label: 'الاستثمار',    value: `${formatUSD(seed.investment_min)} — ${formatUSD(seed.investment_max)}`, icon: DollarSign, bg: 'hsl(42,60%,96%)',  color: 'hsl(42,55%,28%)' },
              { label: 'العائد المتوقع', value: `${seed.roi_estimate}٪`,                  icon: TrendingUp, bg: 'hsl(144,58%,96%)', color: 'var(--green-brand)' },
              { label: 'نقطة التعادل',  value: `${seed.break_even_months} أشهر`,          icon: Clock,      bg: 'hsl(210,50%,97%)', color: 'hsl(210,60%,32%)' },
              { label: 'المقاعد',      value: `${spotsLeft} متبقية من ${seed.max_spots}`,  icon: Users,      bg: isFull ? 'hsl(0,80%,98%)' : 'hsl(144,30%,96%)', color: isFull ? 'hsl(0,60%,40%)' : 'var(--green-deep)' },
            ].map(({ label, value, icon: Icon, bg, color }) => (
              <div key={label} className="rounded-xl p-3 text-right" style={{ background: bg }}>
                <Icon className="w-3.5 h-3.5 mb-1.5" style={{ color }} />
                <div className="text-sm font-bold leading-tight" style={{ color }}>{value}</div>
                <div className="text-[11px] mt-0.5 text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FREE: show problem + partial solution only ── */}
        <Section emoji="🔴" title="المشكلة"
          content={seed.problem}
          accentBg="hsl(0,80%,98%)" accentBorder="hsl(0,60%,88%)" accentTitle="hsl(0,60%,36%)"
          locked={false}
        />

        <Section emoji="🟢" title="الحل"
          content={seed.solution}
          accentBg="hsl(144,58%,97%)" accentBorder="hsl(144,58%,82%)" accentTitle="hsl(144,58%,24%)"
          locked={!isPaid}
        />

        {/* ── PAID ONLY sections ── */}
        {isPaid ? (
          <>
            <Section emoji="🎯" title="العميل المستهدف" content={seed.target_customer} accentBg="hsl(210,50%,98%)" accentBorder="hsl(210,50%,86%)" accentTitle="hsl(210,55%,32%)" />
            <Section emoji="💰" title="نموذج الإيرادات" content={seed.revenue_model} accentBg="hsl(144,40%,97%)" accentBorder="hsl(144,40%,82%)" accentTitle="hsl(144,48%,24%)" />
            <Section emoji="📊" title="التقديرات المالية" content={seed.financial_estimates} accentBg="hsl(42,30%,97%)" accentBorder="hsl(42,30%,84%)" accentTitle="hsl(42,50%,28%)" />
            <Section emoji="✅" title="لماذا تنجح" content={seed.why_it_works} accentBg="hsl(144,55%,97%)" accentBorder="hsl(144,55%,80%)" accentTitle="hsl(144,55%,24%)" />
            <Section emoji="⚠️" title="المخاطر والتحديات" content={seed.risks} accentBg="hsl(38,90%,97%)" accentBorder="hsl(38,80%,82%)" accentTitle="hsl(38,70%,30%)" />
            <Section emoji="🌍" title="أفضل الأسواق" content={seed.best_markets} accentBg="hsl(190,50%,97%)" accentBorder="hsl(190,50%,82%)" accentTitle="hsl(190,55%,28%)" />

            {/* Quick start steps */}
            {seed.quick_start_steps && (
              <div className="rounded-2xl border p-5" style={{ background: 'hsl(158,30%,10%)', borderColor: 'hsl(158,30%,16%)' }}>
                <h2 className="font-bold text-sm mb-3 flex items-center gap-2 flex-row-reverse" style={{ color: 'hsl(43,90%,70%)' }}>
                  <Zap className="w-4 h-4" />
                  خطوات البدء السريع
                </h2>
                <ul className="space-y-2">
                  {seed.quick_start_steps.split(' | ').map(s => s.trim()).filter(Boolean).map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed flex-row-reverse">
                      <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'hsl(43,90%,44%)', color: 'hsl(158,30%,10%)' }}>
                        {i + 1}
                      </span>
                      <span style={{ color: 'hsl(42,28%,80%)' }}>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          /* ── Upgrade banner for free/logged-out users ── */
          <UpgradeBanner seedName={seed.name} />
        )}

        {/* ── Capacity notice ── */}
        <div className="flex items-start gap-3 flex-row-reverse px-4 py-3 rounded-xl border"
          style={{ background: 'hsl(144,30%,97%)', borderColor: 'hsl(144,30%,84%)' }}>
          <Users className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'hsl(144,50%,30%)' }} />
          <p className="text-xs leading-relaxed" style={{ color: 'hsl(158,20%,30%)' }}>
            <strong>المقاعد: {seed.spots_taken}/{seed.max_spots} ممسوكة</strong> — الحد الأقصى {seed.max_spots} مؤسسين لكل فكرة للحفاظ على التنوع وتجنب التشبع في السوق.
          </p>
        </div>

        {/* ── CTA ── */}
        {isFull ? (
          <div className="rounded-2xl border p-6 text-center" style={{ background: 'hsl(0,80%,98%)', borderColor: 'hsl(0,60%,86%)' }}>
            <p className="font-bold mb-1" style={{ color: 'hsl(0,60%,38%)' }}>اكتملت المقاعد</p>
            <p className="text-sm mb-4" style={{ color: 'hsl(0,40%,50%)' }}>جميع المقاعد محجوزة — جرّب فكرة أخرى في المكتبة</p>
            <Link href="/ideas-library"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold flex-row-reverse"
              style={{ background: 'var(--green-deep)', color: 'var(--white)' }}>
              <Sprout className="w-4 h-4" /> تصفح أفكاراً أخرى
            </Link>
          </div>
        ) : isPaid ? (
          <div className="space-y-3">
            {grabError && (
              <div className="flex items-center gap-2 flex-row-reverse px-4 py-3 rounded-xl border text-sm"
                style={{ background: 'hsl(0,80%,98%)', borderColor: 'hsl(0,60%,86%)', color: 'hsl(0,60%,38%)' }}>
                <AlertTriangle className="w-4 h-4 shrink-0" />{grabError}
              </div>
            )}
            <button
              onClick={() => { if (!authUser) { router.push('/signup'); return; } setShowConfirm(true); }}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.99] flex-row-reverse shadow-md"
              style={{ background: 'var(--green-deep)', color: 'var(--white)' }}
            >
              <Sprout className="w-5 h-5" />
              التقط هذه البذرة
            </button>
          </div>
        ) : (
          <Link href="/pricing"
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 flex-row-reverse shadow-md"
            style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
          >
            <Lock className="w-5 h-5" />
            اشترك للالتقاط هذه البذرة
          </Link>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-3 flex-row-reverse px-4 py-3 rounded-xl border"
          style={{ background: 'hsl(38,90%,97%)', borderColor: 'hsl(38,80%,82%)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'hsl(38,80%,40%)' }} />
          <p className="text-xs leading-relaxed" style={{ color: 'hsl(38,60%,30%)' }}>
            هذه فكرة إرشادية عامة — النجاح يعتمد كلياً على تنفيذك وتخصيصك للفكرة في سوقك المحلي. الأرقام المالية تقديرية وليست ضماناً. بذرة لا تتحمل مسؤولية أي خسائر.
          </p>
        </div>

      </div>

      {/* ── Confirm grab dialog ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl border w-full max-w-sm shadow-2xl" style={{ background: 'white', borderColor: 'hsl(42,25%,86%)' }} dir="rtl">
            <div className="p-6 text-right">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(144,58%,93%)' }}>
                <Sprout className="w-6 h-6" style={{ color: 'hsl(144,58%,24%)' }} />
              </div>
              <h3 className="font-extrabold text-lg mb-2 text-center" style={{ color: 'hsl(158,30%,12%)' }}>التقط هذه البذرة؟</h3>
              <p className="text-sm leading-relaxed mb-1 text-center" style={{ color: 'hsl(158,20%,36%)' }}>
                سيتم إضافة فكرة <strong>{seed.name}</strong> إلى لوحة المؤسس الخاصة بك وتصبح جزءاً من رحلتك الريادية.
              </p>
              {grabError && (
                <div className="flex items-center gap-2 flex-row-reverse px-3 py-2 rounded-lg border text-xs mt-3"
                  style={{ background: 'hsl(0,80%,98%)', borderColor: 'hsl(0,60%,86%)', color: 'hsl(0,60%,38%)' }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{grabError}
                </div>
              )}
              <div className="flex gap-3 flex-row-reverse mt-5">
                <button
                  onClick={handleGrab} disabled={grabbing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 flex-row-reverse"
                  style={{ background: 'hsl(144,58%,22%)', color: 'white' }}
                >
                  {grabbing
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><CheckCircle2 className="w-4 h-4" /> نعم، التقطها</>
                  }
                </button>
                <button
                  onClick={() => { setShowConfirm(false); setGrabError(''); }}
                  className="px-5 py-3 rounded-xl border text-sm font-medium transition-colors hover:bg-secondary"
                  style={{ borderColor: 'hsl(42,25%,80%)' }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
