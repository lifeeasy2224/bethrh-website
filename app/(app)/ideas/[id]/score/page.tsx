'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, IdeaScore, Idea } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, RefreshCw, TrendingUp, Target, CircleCheck as CheckCircle2, ChartBar as BarChart2, Mic, Map, Lightbulb, CircleAlert as AlertCircle, Star } from 'lucide-react';
import PublishToGreenhouse from '@/components/PublishToGreenhouse';
import ReviewModal, { wasReviewShown } from '@/components/ReviewModal';

type CriterionKey = 'value_score' | 'market_score' | 'validation_score' | 'feasibility_score' | 'pitch_score' | 'journey_score';

const CRITERIA: { key: CriterionKey; label: string; max: number; icon: React.ElementType; color: string; desc: string }[] = [
  { key: 'value_score',       label: 'القيمة المقدمة',     max: 20, icon: Lightbulb,    color: 'text-[var(--gold)]',  desc: 'مدى وضوح المشكلة والحل' },
  { key: 'market_score',      label: 'حجم السوق',          max: 20, icon: BarChart2,     color: 'text-[var(--green-brand)]',   desc: 'جاذبية وحجم السوق المستهدف' },
  { key: 'validation_score',  label: 'التحقق الميداني',    max: 20, icon: Target,        color: 'text-[var(--green-brand)]',  desc: 'مقابلات، تسجيلات، وطلبات مسبقة' },
  { key: 'feasibility_score', label: 'قابلية التنفيذ',    max: 20, icon: CheckCircle2,  color: 'text-[var(--green-brand)]',   desc: 'اكتمال مهام الـ ٩٠ يوم' },
  { key: 'pitch_score',       label: 'جودة العرض',         max: 10, icon: Mic,           color: 'text-rose-600',   desc: 'وضوح وإقناع العرض التقديمي' },
  { key: 'journey_score',     label: 'المشوار المكتمل',    max: 10, icon: Map,           color: 'text-[var(--green-brand)]',desc: 'نسبة إكمال خارطة الرحلة' },
];

function ScoreCircle({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;
  const color = score >= 80 ? 'var(--green-brand)' : score >= 60 ? 'var(--gold)' : score >= 40 ? 'var(--gold)' : '#dc2626';

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground">من ١٠٠</span>
      </div>
    </div>
  );
}

function ScoreLabel({ score }: { score: number }) {
  if (score >= 80) return <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ color: 'var(--green-brand)', background: 'rgba(27,107,62,0.08)' }}>ممتاز — جاهز للتمويل</span>;
  if (score >= 65) return <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ color: 'var(--green-brand)', background: 'rgba(27,107,62,0.08)' }}>جيد جداً — أكمل التحسينات</span>;
  if (score >= 50) return <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ color: 'var(--gold)', background: 'rgba(212,166,83,0.1)' }}>متوسط — يحتاج تطوير</span>;
  return <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">مبكر — واصل البناء</span>;
}

function CriterionBar({ criterion, score }: { criterion: typeof CRITERIA[0]; score: number }) {
  const pct = Math.round((score / criterion.max) * 100);
  const barColor = pct >= 75 ? 'bg-[var(--green-brand)]' : pct >= 50 ? 'bg-[var(--green-brand)]' : pct >= 25 ? 'bg-[var(--gold)]' : 'bg-red-400';
  const Icon = criterion.icon;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0 flex-row-reverse">
      <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${criterion.color}`} />
      </div>
      <div className="flex-1 text-right">
        <div className="flex items-center justify-between mb-1 flex-row-reverse">
          <span className="text-sm font-medium">{criterion.label}</span>
          <span className="text-xs font-bold tabular-nums">{score}<span className="text-muted-foreground font-normal">/{criterion.max}</span></span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{criterion.desc}</p>
      </div>
    </div>
  );
}

function BenchmarkBar({ score, benchmark }: { score: number; benchmark: number }) {
  const max = Math.max(score, benchmark, 100);
  return (
    <div className="space-y-3 text-right" dir="rtl">
      <div>
        <div className="flex justify-between text-xs mb-1 flex-row-reverse">
          <span className="font-semibold text-primary">فكرتك</span>
          <span className="font-bold text-primary">{score}</span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${(score / max) * 100}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1 flex-row-reverse">
          <span className="font-semibold text-muted-foreground">متوسط القطاع</span>
          <span className="font-bold text-muted-foreground">{benchmark}</span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-border rounded-full transition-all duration-700" style={{ width: `${(benchmark / max) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function IdeaScorePage() {
  const { id } = useParams<{ id: string }>();
  const { supaUser } = useAuth();
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [score, setScore] = useState<IdeaScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [canScore, setCanScore] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const reviewTriggeredRef = useRef(false);

  const checkEligibility = useCallback(async (userId: string, ideaId: string) => {
    const { data: tasks } = await supabase.from('tasks').select('status').eq('idea_id', ideaId);
    const totalTasks = tasks?.length ?? 0;
    const doneTasks = tasks?.filter(t => t.status === 'done').length ?? 0;
    const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const { data: progress } = await supabase
      .from('founder_progress').select('stage_1_done, stage_2_score, stage_3_tasks_done').eq('user_id', userId).maybeSingle();

    const stage1 = progress?.stage_1_done ?? false;
    const stage2 = (progress?.stage_2_score ?? 0) >= 75;
    const stage3 = pct >= 80;

    if (!stage1) { setBlockReason('أكمل مرحلة البذرة (أضف فكرتك الأولى)'); return false; }
    if (!stage2) { setBlockReason('أكمل مرحلة الإنبات (نقاط التحقق ٧٥+)'); return false; }
    if (!stage3) { setBlockReason(`أكمل مرحلة التجذر (٨٠٪ من المهام — أنت عند ${pct}٪)`); return false; }

    return true;
  }, []);

  const load = useCallback(async () => {
    if (!supaUser) return;
    const [{ data: ideaData }, { data: session }] = await Promise.all([
      supabase.from('ideas').select('*').eq('id', id).maybeSingle(),
      supabase.auth.getSession(),
    ]);
    setIdea(ideaData);

    const eligible = await checkEligibility(supaUser.id, id);
    setCanScore(eligible);

    if (eligible) {
      const res = await fetch(`/api/score?ideaId=${id}`, {
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data);
      }
    }
    setLoading(false);
  }, [supaUser, id, checkEligibility]);

  useEffect(() => { load(); }, [load]);

  // Trigger review when score >= 80 (once per idea)
  useEffect(() => {
    if (!score || reviewTriggeredRef.current) return;
    if (score.total_score >= 80 && !wasReviewShown('high_score', id)) {
      reviewTriggeredRef.current = true;
      const t = setTimeout(() => setReviewOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, [score, id]);

  async function handleScore() {
    if (!canScore || scoring) return;
    setScoring(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ ideaId: id }),
    });
    if (res.ok) {
      const data = await res.json();
      setScore(data);
    }
    setScoring(false);
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center" dir="rtl">
        <p className="text-muted-foreground">الفكرة غير موجودة.</p>
        <Link href="/ideas" className="text-primary hover:underline mt-4 block">العودة للأفكار</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-row-reverse">
        <Link href={`/ideas/${id}`} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="flex-1 text-right">
          <h1 className="text-xl font-bold truncate">{idea.title ?? 'فكرة بلا عنوان'}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">تقويم الفكرة</p>
        </div>
        {score && (
          <span className="text-xs text-muted-foreground shrink-0">إصدار {score.version}</span>
        )}
      </div>

      {/* Not eligible */}
      {!canScore && (
        <div className="bg-[rgba(212,166,83,0.08)] border border-[rgba(212,166,83,0.25)] rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[rgba(212,166,83,0.12)] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" style={{ color: 'var(--gold)' }} />
          </div>
          <h2 className="font-bold text-base">أكمل المراحل جميعاً أولاً</h2>
          <p className="text-sm" style={{ color: 'var(--gold)' }}>{blockReason}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition flex-row-reverse"
            style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
          >
            <TrendingUp className="w-4 h-4" />
            اذهب للوحة المؤسس
          </Link>
        </div>
      )}

      {/* Score display */}
      {canScore && (
        <>
          {/* Score card */}
          {score ? (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-6 text-center border-b border-border">
                <ScoreCircle score={score.total_score} />
                <div className="mt-4 flex justify-center">
                  <ScoreLabel score={score.total_score} />
                </div>
                {score.gpt_summary && (
                  <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">{score.gpt_summary}</p>
                )}
              </div>

              {/* Criteria breakdown */}
              <div className="p-5">
                <h3 className="font-semibold text-sm mb-3 text-right flex items-center gap-2 flex-row-reverse">
                  <Star className="w-4 h-4 text-amber-500" />
                  تفصيل المعايير
                </h3>
                {CRITERIA.map(c => (
                  <CriterionBar key={c.key} criterion={c} score={score[c.key]} />
                ))}
              </div>

              {/* Benchmark */}
              <div className="p-5 border-t border-border">
                <h3 className="font-semibold text-sm mb-4 text-right flex items-center gap-2 flex-row-reverse">
                  <BarChart2 className="w-4 h-4 text-blue-500" />
                  مقارنة بمعيار القطاع
                  {score.benchmark_sector && (
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-normal">{score.benchmark_sector}</span>
                  )}
                </h3>
                <BenchmarkBar score={score.total_score} benchmark={score.benchmark_avg} />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {score.total_score > score.benchmark_avg
                    ? `فكرتك تتفوق على متوسط القطاع بـ ${score.total_score - score.benchmark_avg} نقطة`
                    : `متوسط القطاع أعلى بـ ${score.benchmark_avg - score.total_score} نقطة — هناك فرصة للتحسين`}
                </p>
              </div>

              {/* Recommendations */}
              {score.recommendations?.length > 0 && (
                <div className="p-5 border-t border-border bg-secondary/20">
                  <h3 className="font-semibold text-sm mb-3 text-right flex items-center gap-2 flex-row-reverse">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    التوصيات
                  </h3>
                  <ul className="space-y-2">
                    {score.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm flex-row-reverse">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">{i + 1}</span>
                        <span className="text-right">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Greenhouse CTA — auto-popup when score >= 75 */}
              {score.total_score >= 75 && (
                <div className="p-5 border-t border-border" style={{ background: 'rgba(27,107,62,0.04)' }}>
                  <PublishToGreenhouse
                    ideaId={id}
                    ideaScore={score.total_score}
                    ideaTitle={idea.title}
                    manualTrigger
                  />
                  {/* Auto-popup on first qualifying score */}
                  <PublishToGreenhouse
                    ideaId={id}
                    ideaScore={score.total_score}
                    ideaTitle={idea.title}
                  />
                </div>
              )}

              {/* Re-evaluate button */}
              <div className="p-5 border-t border-border flex justify-end">
                <button
                  onClick={handleScore}
                  disabled={scoring}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60 flex-row-reverse"
                >
                  {scoring
                    ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    : <RefreshCw className="w-4 h-4" />}
                  إعادة التقييم
                </button>
              </div>
            </div>
          ) : (
            /* No score yet */
            <div className="bg-card rounded-2xl border border-border p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">لم يتم التقويم بعد</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                اضغط على الزر لتقييم فكرتك من ١٠٠ بناءً على ٦ معايير متخصصة.
              </p>
              <button
                onClick={handleScore}
                disabled={scoring}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition disabled:opacity-60 flex-row-reverse"
              >
                {scoring
                  ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  : <Star className="w-4 h-4" />}
                ابدأ التقويم
              </button>
            </div>
          )}
        </>
      )}

      <ReviewModal
        open={reviewOpen}
        trigger="high_score"
        triggerContext={idea?.title ?? ''}
        userRole="founder"
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
}
