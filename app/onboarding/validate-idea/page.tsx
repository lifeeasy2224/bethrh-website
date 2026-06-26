'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, ArrowRight, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Loader as Loader2, Lightbulb, Users, ChartBar as BarChart2 } from 'lucide-react';

const QUESTIONS = [
  {
    key: 'q1_problem' as const,
    icon: Lightbulb,
    color: 'var(--gold)',
    bg: 'hsl(43,85%,94%)',
    label: 'ما المشكلة التي تحلها بالتحديد؟',
    hint: 'صِف المشكلة بدقة — من يعاني منها؟ متى تحدث؟ ما تأثيرها؟',
    placeholder: 'مثال: أصحاب المطاعم الصغيرة في دمشق لا يجدون موردين موثوقين للخضار الطازجة. يضطرون للذهاب للسوق يومياً بأنفسهم مما يستهلك ٣ ساعات من وقتهم ويرفع التكاليف...',
    minLength: 60,
  },
  {
    key: 'q2_audience' as const,
    icon: Users,
    color: 'hsl(200,72%,36%)',
    bg: 'hsl(200,72%,94%)',
    label: 'من هو جمهورك المستهدف بدقة؟',
    hint: 'حدّد العمر، الموقع، المهنة، الدخل — كلما كان أكثر تحديداً كان أفضل.',
    placeholder: 'مثال: أصحاب المطاعم الصغيرة (١-٥ موظفين) في أحياء المزة والجسر الأبيض بدمشق، الذين دخلهم الشهري بين ٥٠٠-٢٠٠٠ دولار ويعانون من شُح الوقت...',
    minLength: 50,
  },
  {
    key: 'q3_evidence' as const,
    icon: BarChart2,
    color: 'var(--green-brand)',
    bg: 'hsl(144,58%,94%)',
    label: 'ما دليلك الملموس على وجود الطلب؟',
    hint: 'هل تحدثت مع أشخاص؟ كم؟ هل دفع أحد مقدماً؟ هل يوجد منافسون ناجحون؟',
    placeholder: 'مثال: تحدثت مع ٨ أصحاب مطاعم، ٦ منهم أبدوا اهتماماً قوياً. اثنان عرضا دفع اشتراك شهري مسبقاً. المنافس الأقرب (شركة X) حصل على ٢٠٠ عميل في سنته الأولى...',
    minLength: 50,
  },
];

type Answers = {
  q1_problem: string;
  q2_audience: string;
  q3_evidence: string;
};

type ValidationResult = {
  result: 'passed' | 'failed';
  score: number;
  ai_feedback: string;
};

function ValidateIdeaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('ideaId');
  const { supaUser } = useAuth();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ q1_problem: '', q2_audience: '', q3_evidence: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [existing, setExisting] = useState<ValidationResult | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const loadExisting = useCallback(async () => {
    if (!supaUser || !ideaId) { setLoadingExisting(false); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoadingExisting(false); return; }
    const res = await fetch(`/api/validate-idea?ideaId=${ideaId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.result) setExisting(data);
    }
    setLoadingExisting(false);
  }, [supaUser, ideaId]);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  // Redirect if not logged in
  useEffect(() => {
    if (!supaUser && !loadingExisting) router.replace('/signup');
  }, [supaUser, loadingExisting, router]);

  async function handleSubmit() {
    if (!ideaId || !supaUser) return;
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/signup'); return; }

    const res = await fetch('/api/validate-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ideaId, ...answers }),
    });

    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setResult(data);
    }
  }

  const currentQ = QUESTIONS[step];
  const currentAnswer = answers[currentQ?.key ?? 'q1_problem'];
  const canProceed = currentAnswer.trim().length >= (currentQ?.minLength ?? 50);

  if (loadingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(42,25%,97%)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--green-brand)' }} />
      </div>
    );
  }

  // Show existing result with option to redo
  if (existing && !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'hsl(42,25%,97%)' }} dir="rtl">
        <div className="max-w-lg w-full">
          <ResultCard
            result={existing}
            ideaId={ideaId ?? ''}
            onRedo={() => setExisting(null)}
          />
        </div>
      </div>
    );
  }

  // Show new result
  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'hsl(42,25%,97%)' }} dir="rtl">
        <div className="max-w-lg w-full">
          <ResultCard
            result={result}
            ideaId={ideaId ?? ''}
            onRedo={() => { setResult(null); setStep(0); setAnswers({ q1_problem: '', q2_audience: '', q3_evidence: '' }); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(42,25%,97%)' }} dir="rtl">
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ background: 'var(--white)', borderColor: 'var(--gray-light)' }}>
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
          className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--gray-mid)' }}
        >
          <ArrowRight className="w-4 h-4" />
          {step > 0 ? 'السؤال السابق' : 'رجوع'}
        </button>
        <span className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>اختبار البذرة</span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'hsl(144,58%,92%)', color: 'var(--green-brand)' }}>
          {step + 1} / {QUESTIONS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: 'var(--gray-light)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%`, background: 'var(--green-brand)' }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          {/* Question card */}
          <div className="rounded-2xl border p-7 mb-5" style={{ background: 'var(--white)', borderColor: 'var(--gray-light)' }}>
            {/* Icon + label */}
            <div className="flex items-center gap-3 mb-5 flex-row-reverse">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: currentQ.bg }}>
                <currentQ.icon className="w-5 h-5" style={{ color: currentQ.color }} />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: currentQ.color }}>
                  السؤال {step + 1}
                </p>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-dark)' }}>{currentQ.label}</h2>
              </div>
            </div>

            {/* Hint */}
            <p className="text-sm mb-4 text-right" style={{ color: 'var(--gray-mid)' }}>{currentQ.hint}</p>

            {/* Textarea */}
            <textarea
              value={currentAnswer}
              onChange={e => setAnswers(a => ({ ...a, [currentQ.key]: e.target.value }))}
              rows={6}
              placeholder={currentQ.placeholder}
              className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 text-right leading-relaxed"
              style={{
                borderColor: 'var(--gray-light)',
                background: 'var(--off-white)',
                color: 'var(--text-dark)',
              }}
              dir="rtl"
            />

            {/* Character count */}
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs font-medium ${canProceed ? 'text-green-600' : ''}`} style={canProceed ? {} : { color: 'var(--gray-mid)' }}>
                {currentAnswer.trim().length} / {currentQ.minLength} حرف كحد أدنى
                {canProceed && ' ✓'}
              </span>
              {!canProceed && currentAnswer.trim().length > 0 && (
                <span className="text-xs" style={{ color: 'var(--gold)' }}>
                  أضِف {currentQ.minLength - currentAnswer.trim().length} حرفاً إضافياً
                </span>
              )}
            </div>
          </div>

          {/* Nav buttons */}
          <div className="flex gap-3">
            {step < QUESTIONS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: canProceed ? 'var(--green-deep)' : 'var(--gray-light)',
                  color: canProceed ? 'var(--white)' : 'var(--gray-mid)',
                }}
              >
                السؤال التالي
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed || submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: canProceed && !submitting ? 'var(--green-deep)' : 'var(--gray-light)',
                  color: canProceed && !submitting ? 'var(--white)' : 'var(--gray-mid)',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    يحلل الذكاء الاصطناعي...
                  </>
                ) : (
                  <>
                    إرسال للتقييم
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-5">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? '20px' : '8px',
                  height: '8px',
                  background: i < step ? 'var(--green-brand)' : i === step ? 'var(--green-deep)' : 'var(--gray-light)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result, ideaId, onRedo }: { result: ValidationResult; ideaId: string; onRedo: () => void }) {
  const router = useRouter();
  const passed = result.result === 'passed';

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: passed ? 'hsl(144,40%,78%)' : 'hsl(0,70%,78%)' }}>
      {/* Header */}
      <div
        className="px-7 py-6 text-center"
        style={{ background: passed ? 'var(--green-deep)' : 'hsl(0,60%,36%)' }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(0,0%,100%,0.15)' }}>
          {passed
            ? <CheckCircle2 className="w-9 h-9 text-white" />
            : <AlertCircle className="w-9 h-9 text-white" />
          }
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-1">
          {passed ? 'بذرتك اجتازت الاختبار!' : 'فكرتك تحتاج تقوية'}
        </h2>
        <p className="text-sm font-bold" style={{ color: 'hsl(0,0%,100%,0.75)' }}>
          {result.score}/100 نقطة
        </p>
      </div>

      {/* Score bar */}
      <div className="px-7 py-4" style={{ background: 'var(--white)' }}>
        <div className="flex justify-between text-xs mb-1.5 flex-row-reverse" style={{ color: 'var(--gray-mid)' }}>
          <span>الحد الأدنى للنجاح: ٦٠</span>
          <span className="font-bold" style={{ color: passed ? 'var(--green-brand)' : 'hsl(0,60%,36%)' }}>{result.score}/100</span>
        </div>
        <div className="h-3 rounded-full" style={{ background: 'var(--gray-light)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${result.score}%`, background: passed ? 'var(--green-brand)' : 'hsl(0,60%,50%)' }}
          />
        </div>
      </div>

      {/* Feedback */}
      <div className="px-7 pb-6" style={{ background: 'var(--white)' }}>
        <div
          className="rounded-xl p-4 mb-5 text-sm leading-relaxed text-right"
          style={{
            background: passed ? 'hsl(144,58%,96%)' : 'hsl(0,70%,97%)',
            color: passed ? 'var(--green-deep)' : 'hsl(0,60%,30%)',
            border: `1px solid ${passed ? 'hsl(144,40%,82%)' : 'hsl(0,60%,82%)'}`,
          }}
        >
          {result.ai_feedback}
        </div>

        {passed ? (
          <button
            onClick={() => router.push(`/ideas/${ideaId}/canvas`)}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: 'var(--green-deep)', color: 'var(--white)' }}
          >
            ابدأ بناء النموذج الكامل
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onRedo}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: 'var(--text-dark)', color: 'var(--white)' }}
            >
              راجع إجاباتك وأعِد المحاولة
            </button>
            <button
              onClick={() => router.back()}
              className="w-full py-2.5 rounded-xl text-sm font-medium border transition-all"
              style={{ borderColor: 'var(--gray-light)', color: 'var(--gray-mid)' }}
            >
              عُد لصفحة الفكرة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ValidateIdeaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(42,25%,97%)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--green-brand)' }} />
      </div>
    }>
      <ValidateIdeaContent />
    </Suspense>
  );
}
