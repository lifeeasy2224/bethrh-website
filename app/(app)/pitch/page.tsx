'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase, Idea, ValidationLog } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CircleCheck as CheckCircle2, Circle, TrendingUp, Users, DollarSign, Globe, Share2, TriangleAlert as AlertTriangle, ChevronRight, Sprout } from 'lucide-react';
import IdeaDropdown, { usePersistedIdeaId } from '@/components/IdeaDropdown';
import ReviewModal, { wasReviewShown } from '@/components/ReviewModal';

type CanvasData = {
  value_proposition: string;
  customer_segments: string;
  channels: string;
  customer_relationships: string;
  revenue_streams: string;
  key_resources: string;
  key_activities: string;
  key_partners: string;
  cost_structure: string;
  financial_items?: { id: string; label: string; amount: number; type: 'cost' | 'revenue' }[];
};

type IdeaScore = {
  total_score: number;
  benchmark_sector: string;
  benchmark_country: string;
};

type Readiness = {
  scoreOk: boolean;
  canvasOk: boolean;
  validationOk: boolean;
  tasksOk: boolean;
  ready: boolean;
  score: number;
  canvasCount: number;
  totalInterviews: number;
  totalSignups: number;
  totalRevenue: number;
  tasksPct: number;
};

function computeIro(financial: CanvasData['financial_items']): number | null {
  if (!financial || financial.length === 0) return null;
  const totalCosts = financial.filter(f => f.type === 'cost').reduce((s, f) => s + f.amount, 0);
  const totalRevenue = financial.filter(f => f.type === 'revenue').reduce((s, f) => s + f.amount, 0);
  if (totalCosts === 0) return null;
  return Math.round(((totalRevenue - totalCosts) / totalCosts) * 100);
}

function computeBreakeven(financial: CanvasData['financial_items']): number | null {
  if (!financial || financial.length === 0) return null;
  const monthlyCost = financial.filter(f => f.type === 'cost').reduce((s, f) => s + f.amount, 0);
  const monthlyRevenue = financial.filter(f => f.type === 'revenue').reduce((s, f) => s + f.amount, 0);
  if (monthlyRevenue <= 0 || monthlyRevenue <= monthlyCost) return null;
  return Math.ceil(monthlyCost / (monthlyRevenue - monthlyCost));
}

const CANVAS_KEYS = [
  'value_proposition', 'customer_segments', 'channels', 'customer_relationships',
  'revenue_streams', 'key_resources', 'key_activities', 'key_partners', 'cost_structure',
];

export default function PitchPage() {
  const { supaUser, isInvestor, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlIdea = searchParams.get('idea');

  const [selectedId, persistIdeaId] = usePersistedIdeaId(urlIdea ?? '');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [canvas, setCanvas] = useState<CanvasData | null>(null);
  const [ideaScore, setIdeaScore] = useState<IdeaScore | null>(null);
  const [logs, setLogs] = useState<ValidationLog[]>([]);
  const [tasks, setTasks] = useState<{ status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const reviewCheckedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && isInvestor) router.replace('/investor-assistant');
  }, [authLoading, isInvestor, router]);

  // Sync URL param on mount
  useEffect(() => {
    if (urlIdea) persistIdeaId(urlIdea);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!supaUser) return;
    supabase
      .from('ideas')
      .select('*')
      .eq('user_id', supaUser.id)
      .neq('stage', 'committed')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setIdeas(data ?? []);
        setLoading(false);
      });
  }, [supaUser]);

  useEffect(() => {
    if (!selectedId || !supaUser) return;
    setDataLoading(true);
    Promise.all([
      supabase.from('canvases').select('*').eq('idea_id', selectedId).maybeSingle(),
      supabase.from('idea_scores').select('total_score, benchmark_sector, benchmark_country')
        .eq('idea_id', selectedId).eq('user_id', supaUser.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('validation_logs').select('*').eq('idea_id', selectedId),
      supabase.from('tasks').select('status').eq('idea_id', selectedId).eq('user_id', supaUser.id),
    ]).then(([{ data: c }, { data: s }, { data: l }, { data: t }]) => {
      setCanvas(c as CanvasData | null);
      setIdeaScore(s as IdeaScore | null);
      setLogs(l ?? []);
      setTasks(t ?? []);
      setDataLoading(false);
    });
  }, [selectedId, supaUser]);

  const selectedIdea = ideas.find(i => i.id === selectedId) ?? null;

  // Trigger founder review when their greenhouse listing has received contact requests
  useEffect(() => {
    if (!supaUser || reviewCheckedRef.current || wasReviewShown('greenhouse_contact_founder', supaUser.id)) return;
    reviewCheckedRef.current = true;
    supabase
      .from('greenhouse_listings')
      .select('id,brand_name,contact_requests')
      .eq('user_id', supaUser.id)
      .gt('contact_requests', 0)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTimeout(() => setReviewOpen(true), 1500);
        }
      });
  }, [supaUser]);

  function getReadiness(): Readiness {
    const score = ideaScore?.total_score ?? selectedIdea?.validation_score ?? 0;
    const scoreOk = score >= 60;
    const canvasCount = canvas ? CANVAS_KEYS.filter(k => (canvas as any)[k]?.trim()).length : 0;
    const canvasOk = canvasCount >= 9;
    const totalInterviews = logs.reduce((s, l) => s + l.interviews, 0);
    const totalSignups = logs.reduce((s, l) => s + l.signups, 0);
    const totalRevenue = logs.reduce((s, l) => s + l.preorders_usd, 0);
    const validationOk = totalInterviews >= 5 || totalSignups >= 1 || totalRevenue >= 1;
    const done = tasks.filter(t => t.status === 'done').length;
    const tasksPct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
    const tasksOk = tasksPct >= 80;
    return {
      scoreOk, canvasOk, validationOk, tasksOk,
      ready: scoreOk && canvasOk && validationOk,
      score, canvasCount, totalInterviews, totalSignups, totalRevenue, tasksPct,
    };
  }

  async function handlePublish() {
    if (!selectedIdea || !supaUser) return;
    setPublishing(true);
    const { error } = await supabase.functions.invoke('greenhouse-publish', {
      body: { idea_id: selectedId },
    }).catch(() => ({ error: true })) as any;
    if (!error) setPublished(true);
    setPublishing(false);
  }

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const r = getReadiness();
  const iro = canvas ? computeIro(canvas.financial_items) : null;
  const breakeven = canvas ? computeBreakeven(canvas.financial_items) : null;

  const requirements = [
    {
      done: r.scoreOk,
      label: 'اجتياز تقويم البذرة (نقاط ≥ ٦٠)',
      detail: `النقاط الحالية: ${r.score}/100`,
      href: selectedId ? `/ideas/${selectedId}/score` : '/ideas',
    },
    {
      done: r.canvasOk,
      label: 'إكمال نموذج العمل التجاري (٩/٩ مربعات)',
      detail: `مكتمل: ${r.canvasCount}/9`,
      href: selectedId ? `/ideas/${selectedId}/canvas` : '/ideas',
    },
    {
      done: r.validationOk,
      label: 'تحقق ميداني (٥+ مقابلات أو ١+ تسجيل أو طلب مسبق)',
      detail: `المقابلات: ${r.totalInterviews} | التسجيلات: ${r.totalSignups} | الإيرادات: $${r.totalRevenue}`,
      href: '/validation',
    },
    {
      done: r.tasksOk,
      label: 'إكمال ٨٠٪ من مهام مشوار الـ ٩٠ يوماً',
      detail: `التقدم الحالي: ${r.tasksPct}%`,
      href: '/journey',
    },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">عرض للتمويل</h1>
        <p className="text-muted-foreground text-sm mt-1">ملفك الاستثماري جاهز للعرض على الممولين</p>
      </div>

      {/* Shared idea dropdown */}
      <IdeaDropdown
        selectedId={selectedId}
        onSelect={persistIdeaId}
        label="الفكرة:"
      />

      {/* Disabled state */}
      {!selectedId && ideas.length > 0 && (
        <div className="bg-secondary/30 rounded-xl border border-dashed border-border p-10 text-center">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">اختر فكرة من القائمة أعلاه لعرض ملفك الاستثماري</p>
        </div>
      )}

      {selectedIdea && !dataLoading && (
        <>
          {/* Status banner */}
          <div className={`rounded-xl border p-4 flex items-center gap-3 flex-row-reverse ${
            r.ready
              ? 'bg-[rgba(27,107,62,0.06)] border-[rgba(27,107,62,0.2)]'
              : 'bg-[rgba(212,166,83,0.08)] border-[rgba(212,166,83,0.25)]'
          }`}>
            {r.ready
              ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--green-brand)' }} />
              : <Lock className="w-5 h-5 shrink-0" style={{ color: 'var(--gold)' }} />
            }
            <div className="flex-1 text-right">
              <p className={`font-semibold text-sm`} style={{ color: r.ready ? 'var(--green-deep)' : 'var(--gold)' }}>
                {r.ready ? 'ملفك جاهز للعرض على المستثمرين' : 'غير جاهز — أكمل المتطلبات أدناه'}
              </p>
              <p className={`text-xs mt-0.5`} style={{ color: r.ready ? 'var(--green-brand)' : 'var(--gold)' }}>
                {r.ready
                  ? 'يمكنك الآن تحميل الملف أو عرضه في معرض البذور'
                  : `${requirements.filter(req => req.done).length}/${requirements.length} متطلبات مكتملة`
                }
              </p>
            </div>
          </div>

          {/* Requirements checklist */}
          {!r.ready && (
            <div className="bg-card rounded-xl border border-border p-5 space-y-3">
              <h2 className="font-semibold text-sm text-right">المتطلبات</h2>
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-3 flex-row-reverse">
                  {req.done
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                  <div className="flex-1 text-right">
                    <p className={`text-sm ${req.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {req.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{req.detail}</p>
                  </div>
                  {!req.done && (
                    <Link href={req.href} className="text-xs text-primary hover:underline shrink-0 flex items-center gap-0.5">
                      اذهب
                      <ChevronRight className="w-3 h-3 -scale-x-100" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Executive Summary — shown always, blurred if not ready */}
          <div className={`relative bg-card rounded-xl border border-border overflow-hidden ${!r.ready ? 'opacity-60' : ''}`}>
            {!r.ready && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-3">
                <Lock className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">أكمل المتطلبات لعرض الملخص التنفيذي</p>
              </div>
            )}

            <div className="p-5 space-y-5">
              <h2 className="font-bold text-base text-right border-b border-border pb-3">الملخص التنفيذي</h2>

              {/* Idea summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-row-reverse">
                  <span className="text-xs font-medium text-muted-foreground">اسم المشروع</span>
                  <span className="text-sm font-semibold">{selectedIdea.title ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between flex-row-reverse">
                  <span className="text-xs font-medium text-muted-foreground">القطاع</span>
                  <span className="text-sm">{selectedIdea.sector ?? '—'}</span>
                </div>
                {canvas?.value_proposition && (
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground mb-1">القيمة المقترحة</p>
                    <p className="text-sm leading-relaxed">{canvas.value_proposition}</p>
                  </div>
                )}
                {canvas?.customer_segments && (
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground mb-1">شريحة العملاء</p>
                    <p className="text-sm leading-relaxed">{canvas.customer_segments}</p>
                  </div>
                )}
              </div>

              {/* Key numbers */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 text-right">الأرقام الرئيسية</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'تقويم البذرة', value: `${r.score}/100`, icon: TrendingUp, color: 'text-[var(--gold)]', bg: 'bg-[rgba(212,166,83,0.1)]' },
                    { label: 'العائد المتوقع (IRO)', value: iro !== null ? `${iro}%` : '—', icon: DollarSign, color: 'text-[var(--green-brand)]', bg: 'bg-[rgba(27,107,62,0.08)]' },
                    { label: 'نقطة التعادل', value: breakeven !== null ? `شهر ${breakeven}` : '—', icon: TrendingUp, color: 'text-[var(--green-brand)]', bg: 'bg-[rgba(27,107,62,0.08)]' },
                    { label: 'المقابلات', value: r.totalInterviews, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-secondary/40 rounded-lg p-3 text-center">
                      <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center mx-auto mb-1.5`}>
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                      </div>
                      <div className="text-base font-bold leading-none">{value}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation summary */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 text-right">التحقق الميداني</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'المقابلات', value: r.totalInterviews },
                    { label: 'التسجيلات', value: r.totalSignups },
                    { label: 'الطلبات المسبقة', value: `$${r.totalRevenue}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-secondary/40 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold">{value}</div>
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Investor notice */}
            <div className="bg-secondary/50 rounded-xl border border-border p-4 text-right">
              <div className="flex items-start gap-2 flex-row-reverse">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  عند الضغط على عرض في المشتل، ستظهر للمستثمرين المعلومات التالية فقط: اسم المشروع، القطاع، IRO، ونقطة التعادل. باقي التفاصيل تُكشف فقط بعد موافقتك على طلب التواصل.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Share link */}
              <button
                onClick={() => {
                  if (!selectedId) return;
                  navigator.clipboard?.writeText(`${window.location.origin}/ideas/${selectedId}`);
                  alert('تم نسخ الرابط');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition flex-row-reverse"
              >
                <Share2 className="w-4 h-4" />
                مشاركة رابط خاص
              </button>

              {/* Publish to greenhouse */}
              <button
                disabled={!r.ready || publishing || published}
                onClick={handlePublish}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition flex-row-reverse ${
                  r.ready && !published
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {publishing
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : published
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <Globe className="w-4 h-4" />
                }
                {published ? 'تم العرض في المشتل' : r.ready ? 'عرض في المشتل' : 'عرض في المشتل (يتطلب Score 80+)'}
              </button>
            </div>
          </div>
        </>
      )}

      {dataLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      <ReviewModal
        open={reviewOpen}
        trigger="greenhouse_contact_founder"
        triggerContext=""
        userRole="founder"
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
}
