'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Users, TrendingUp, Clock, DollarSign, Sprout, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Zap, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

type Seed = {
  id: string;
  slug: string;
  name: string;
  sector_id: string;
  sector_emoji: string;
  sector_label: string;
  short_description: string | null;
  problem: string | null;
  solution: string | null;
  target_customer: string | null;
  revenue_model: string | null;
  financial_estimates: string | null;
  why_it_works: string | null;
  risks: string | null;
  best_markets: string | null;
  quick_start_steps: string | null;
  investment_min: number;
  investment_max: number;
  roi_estimate: number;
  break_even_months: number;
  max_spots: number;
  spots_taken: number;
};

function formatUSD(n: number) {
  return '$' + n.toLocaleString('en-US');
}

function BulletList({ text }: { text: string }) {
  const items = text.split(' | ').map(s => s.trim()).filter(Boolean);
  if (items.length <= 1) {
    return <p className="text-sm leading-relaxed text-right text-foreground/80">{text}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed flex-row-reverse text-right text-foreground/80">
          <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
          <span className="text-right">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({ emoji, title, content, className = '' }: {
  emoji: string; title: string; content: string | null; className?: string;
}) {
  if (!content) return null;
  return (
    <div className={`bg-card rounded-xl border border-border p-5 ${className}`}>
      <h2 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2 flex-row-reverse">
        <span className="text-base">{emoji}</span>
        {title}
      </h2>
      <BulletList text={content} />
    </div>
  );
}

export default function SeedDetailPage() {
  const { id: slug } = useParams<{ id: string }>();
  const router = useRouter();
  const { supaUser, profile, isInvestor } = useAuth();

  const [seed, setSeed] = useState<Seed | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [grabError, setGrabError] = useState('');

  useEffect(() => {
    fetch(`/api/seeds/${slug}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setSeed(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  async function handleGrab() {
    if (!supaUser) { router.push('/signup'); return; }
    if (isInvestor) { setGrabError('هذه الميزة للمؤسسين فقط'); return; }
    setGrabbing(true);
    setGrabError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/signup'); return; }

    const res = await fetch(`/api/seeds/${slug}/grab`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = await res.json();
    if (!res.ok) {
      setGrabError(result.error ?? 'حدث خطأ، حاول مجدداً');
      setGrabbing(false);
      return;
    }
    router.push(`/ideas/${result.idea_id}`);
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!seed) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center" dir="rtl">
        <p className="text-muted-foreground mb-4">لم يتم العثور على هذه البذرة</p>
        <Link href="/seeds" className="text-primary hover:underline text-sm">العودة للمكتبة</Link>
      </div>
    );
  }

  const spotsLeft = seed.max_spots - seed.spots_taken;
  const isFull = spotsLeft <= 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5" dir="rtl">

      {/* Back */}
      <Link href="/seeds"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-row-reverse">
        <ArrowRight className="w-4 h-4" />
        بذور جاهزة للزراعة
      </Link>

      {/* ── Hero ── */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between gap-4 flex-row-reverse mb-4">
          <div className="flex-1 text-right">
            <div className="flex items-center gap-2 flex-row-reverse mb-2">
              <span className="text-2xl">{seed.sector_emoji}</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                {seed.sector_label}
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{seed.name}</h1>
            {seed.short_description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{seed.short_description}</p>
            )}
          </div>
          <div
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border"
            style={isFull
              ? { background: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.3)', color: 'rgb(153, 27, 27)' }
              : { background: 'rgba(27, 107, 62, 0.1)', borderColor: 'rgba(27, 107, 62, 0.3)', color: 'rgb(20, 83, 45)' }
            }
          >
            <Users className="w-3.5 h-3.5" />
            {isFull ? 'مكتملة' : `${spotsLeft}/${seed.max_spots} متبقي`}
          </div>
        </div>

        {/* Financial strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border">
          {[
            { label: 'الاستثمار',    value: `${formatUSD(seed.investment_min)} — ${formatUSD(seed.investment_max)}`, icon: DollarSign, color: 'text-[var(--gold)]',  bg: 'bg-[rgba(212,166,83,0.1)]' },
            { label: 'العائد المتوقع', value: `${seed.roi_estimate}٪`,   icon: TrendingUp, color: 'text-[var(--green-brand)]', bg: 'bg-[rgba(27,107,62,0.1)]' },
            { label: 'نقطة التعادل',  value: `${seed.break_even_months} أشهر`, icon: Clock,       color: 'text-blue-600',   bg: 'bg-blue-50' },
            { label: 'المقاعد',       value: `${spotsLeft} من ${seed.max_spots} متبقية`, icon: Users, color: isFull ? 'text-red-600' : 'text-[var(--green-brand)]', bg: isFull ? 'bg-red-50' : 'bg-[rgba(27,107,62,0.1)]' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-3 text-right`}>
              <Icon className={`w-4 h-4 ${color} mb-1`} />
              <div className={`text-sm font-bold ${color} leading-tight`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 10 Sections ── */}
      <Section emoji="🔴" title="المشكلة" content={seed.problem} />
      <Section emoji="🟢" title="الحل" content={seed.solution} />
      <Section emoji="🎯" title="العميل المستهدف" content={seed.target_customer} />
      <Section emoji="💰" title="نموذج الإيرادات" content={seed.revenue_model} />
      <Section emoji="📊" title="التقديرات المالية" content={seed.financial_estimates} />
      <Section emoji="✅" title="لماذا تنجح" content={seed.why_it_works} />
      <Section emoji="⚠️" title="المخاطر والتحديات" content={seed.risks} />
      <Section emoji="🌍" title="أفضل الأسواق" content={seed.best_markets} />

      {/* Quick start — dark */}
      {seed.quick_start_steps && (
        <div className="rounded-xl border border-border p-5" style={{ background: 'rgb(7, 55, 39)' }}>
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2 flex-row-reverse" style={{ color: 'var(--gold)' }}>
            <Zap className="w-4 h-4" />
            خطوات البدء السريع
          </h2>
          <ul className="space-y-2">
            {seed.quick_start_steps.split(' | ').map(s => s.trim()).filter(Boolean).map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed flex-row-reverse" style={{ color: 'rgb(235, 225, 203)' }}>
                <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'var(--gold)', color: 'rgb(7, 55, 39)' }}>
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Capacity notice */}
      <div className="flex items-start gap-2.5 flex-row-reverse p-4 rounded-xl bg-secondary/50 border border-border">
        <Users className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>المقاعد: {seed.spots_taken}/{seed.max_spots} ممسوكة</strong> — الحد الأقصى {seed.max_spots} مؤسسين لكل فكرة للحفاظ على التنوع وتجنب التشبع في السوق.
        </p>
      </div>

      {/* CTA ── */}
      {isFull ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-red-700 font-medium text-sm mb-1">مكتملة — جميع المقاعد محجوزة</p>
          <p className="text-red-600 text-xs mb-3">جرّب فكرة أخرى في المكتبة</p>
          <Link href="/seeds"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition flex-row-reverse">
            <Sprout className="w-4 h-4" /> العودة للمكتبة
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {isInvestor && (
            <div className="flex items-center gap-2 flex-row-reverse px-4 py-3 rounded-xl border border-[rgba(212,166,83,0.3)] bg-[rgba(212,166,83,0.1)] text-sm text-[#8B6B47]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              هذه الميزة متاحة للمؤسسين فقط — حسابك مسجل كمستثمر
            </div>
          )}
          {grabError && (
            <div className="flex items-center gap-2 flex-row-reverse px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {grabError}
            </div>
          )}
          {!isInvestor && (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex-row-reverse"
            >
              <Sprout className="w-5 h-5" />
              التقط هذه البذرة 🌱
            </button>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 flex-row-reverse p-4 rounded-xl bg-[rgba(212,166,83,0.1)] border border-[rgba(212,166,83,0.3)]">
        <AlertTriangle className="w-4 h-4 text-[#8B6B47] shrink-0 mt-0.5" />
        <p className="text-xs text-[#8B6B47] leading-relaxed">
          هذه فكرة إرشادية عامة — النجاح يعتمد كلياً على تنفيذك وتخصيصك للفكرة في سوقك المحلي. الأرقام المالية تقديرية وليست ضماناً. بذرة لا تتحمل مسؤولية أي خسائر.
        </p>
      </div>

      {/* ── Confirm dialog ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-row-reverse">
              <h2 className="font-bold">التقط هذه البذرة؟</h2>
              <button onClick={() => { setShowConfirm(false); setGrabError(''); }}
                className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground text-right leading-relaxed">
                هل أنت متأكد؟ سيتم إضافة فكرة <strong className="text-foreground">{seed.name}</strong> إلى لوحة المؤسس الخاصة بك وتبدأ رحلتك الريادية.
              </p>
              {grabError && (
                <div className="flex items-center gap-2 flex-row-reverse text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{grabError}
                </div>
              )}
              <div className="flex gap-3 flex-row-reverse">
                <button
                  onClick={handleGrab}
                  disabled={grabbing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition disabled:opacity-60 flex-row-reverse"
                >
                  {grabbing
                    ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    : <><CheckCircle2 className="w-4 h-4" /> نعم، التقطها</>
                  }
                </button>
                <button
                  onClick={() => { setShowConfirm(false); setGrabError(''); }}
                  className="px-5 py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition"
                >
                  إلغاء
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                بالتأكيد، ستُضاف هذه الفكرة لرحلتي وتُحسب ضمن المقاعد المتاحة
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
