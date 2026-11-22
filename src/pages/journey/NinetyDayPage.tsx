import { Fragment, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIdea } from '../../contexts/IdeaContext';
import { useReview } from '../../contexts/ReviewContext';
import { recomputeIqScore, JOURNEY_NOTES_MIN_CHARS } from '../../lib/iqScore';

interface Week {
  num: number;
  phase: number;
  title: string;
  main: string;
  subs: string[];
  coachTip: string;
}

const WEEKS: Week[] = [
  { num: 1, phase: 1, title: 'حدد عميلك', main: 'اكتب بدقة من هو عميلك (العمر، الوظيفة, الموقع، المشكلة)', subs: ['اذكر ٣ أماكن يتواجد فيها عملاؤك', 'اكتب ٥ أسئلة للمقابلات', 'حدد ١٠ عملاء محتملين للتحدث معهم'], coachTip: 'ساعدني أكتب أسئلة مقابلات العملاء لفكرتي' },
  { num: 2, phase: 1, title: 'تحدث مع ٥ عملاء', main: 'أجرِ ٥ مقابلات مع عملاء (حضورياً أو عبر الفيديو)', subs: ['سجّل كل مقابلة في متتبّع التحقق', 'حدد أهم ٣ مشكلات ذُكرت', 'اكتب ملخصاً من فقرة واحدة لما تعلمته'], coachTip: 'ما الأنماط التي أبحث عنها في مقابلات العملاء؟' },
  { num: 3, phase: 1, title: 'ابنِ منتجك الأولي (MVP)', main: 'أنشئ منتجاً أولياً أو صفحة هبوط', subs: ['حدد الميزة الجوهرية الواحدة', 'ابنِها (أو أنشئ صفحة هبوط تصفها)', 'شاركها مع ٣ عملاء محتملين لأخذ الملاحظات'], coachTip: 'ما أبسط MVP يمكنني بناؤه لفكرتي؟' },
  { num: 4, phase: 1, title: 'احصل على أول إشارة', main: 'احصل على تسجيل اهتمام أو طلب مسبق أو دفعة واحدة على الأقل', subs: ['جهّز طريقة لجمع التسجيلات أو المدفوعات', 'تواصل مع من قابلتهم', 'سجّل النتائج في متتبّع التحقق'], coachTip: 'كيف أحصل على أول عميل يدفع؟' },
  { num: 5, phase: 2, title: 'حسّن بناءً على الملاحظات', main: 'طوّر منتجك/خدمتك بناءً على ملاحظات العملاء', subs: ['اذكر أهم ٣ تحسينات', 'نفّذ التغيير الأكثر طلباً', 'خذ ملاحظات ٣ عملاء على النسخة المحسّنة'], coachTip: 'كيف أرتب أولويات الملاحظات التي أتصرف بناءً عليها؟' },
  { num: 6, phase: 2, title: 'بِع لثلاثة عملاء جدد', main: 'اكسب ٣ عملاء جدد يدفعون أو يلتزمون بالتسجيل', subs: ['صُغ عرض بيعك (جملة واحدة)', 'تواصل مع ١٠ عملاء محتملين', 'تابع مع كل من أبدى اهتماماً'], coachTip: 'اكتب لي عرض بيع قصيراً لفكرتي' },
  { num: 7, phase: 2, title: 'جهّز العمليات', main: 'أنشئ إجراءات أساسية للتسليم والدعم والفوترة', subs: ['وثّق إجراء التسليم لديك', 'جهّز قناة دعم بسيطة للعملاء', 'أنشئ أول فاتورة أو نظام دفع'], coachTip: 'ما الإجراءات الأساسية التي أجهّزها أولاً؟' },
  { num: 8, phase: 2, title: 'ابدأ التسويق', main: 'أطلق قناة تسويق واحدة (سوشال، محتوى، إعلانات، أو توصيات)', subs: ['اختر قناتك التسويقية الأساسية', 'أنشئ ٥ قطع محتوى', 'قِس نتائجك بعد أسبوع'], coachTip: 'أي قناة تسويق تناسب نوع مشروعي؟' },
  { num: 9, phase: 3, title: 'أتمت عملية واحدة', main: 'أخرج نفسك من مهمة متكررة واحدة', subs: ['حدد أكثر مهامك المتكررة استهلاكاً للوقت', 'ابحث عن أداة أو نظام لأتمتتها', 'اختبر الأتمتة مع سيناريو عميل حقيقي'], coachTip: 'ما الذي أؤتمته أولاً في مشروعي؟' },
  { num: 10, phase: 3, title: 'ضاعف قاعدة عملائك', main: 'انتقل من عددك الحالي من العملاء إلى الضعف', subs: ['أطلق برنامج توصيات', 'أنشئ دراسة حالة من أفضل عملائك', 'اعقد شراكة مع نشاط مكمّل واحد'], coachTip: 'ما أسرع طريقة لمضاعفة عملائي؟' },
  { num: 11, phase: 3, title: 'حسّن اقتصاديات الوحدة', main: 'قلّل التكاليف أو زد الإيراد لكل عميل', subs: ['احسب تكلفة اكتساب العميل (CAC)', 'حدد شريحة عملائك الأكثر ربحية', 'اختبر رفع سعر أو عرض بيع إضافي واحد'], coachTip: 'كيف أحسّن هوامشي دون رفع الأسعار كثيراً؟' },
  { num: 12, phase: 3, title: 'خطط للربع القادم', main: 'راجع تقدمك، وضع أهداف الربع الثاني، وادرس خيارات التمويل', subs: ['اكتب مراجعة عمل من صفحة واحدة', 'ضع ٣ أهداف قابلة للقياس للربع القادم', 'قرر: تمويل ذاتي، أم جولة استثمار، أم البقاء خفيفاً'], coachTip: 'ساعدني أفكر: هل أحتاج جولة تمويل؟' },
];

const PHASE_LABELS = ['التحقق', 'البناء', 'النمو'];
const PHASE_COLORS = ['#1B6B3E', '#1B6B3E', '#D08A28'];

type TaskMap = Record<string, Record<string, boolean>>;

// ── بوابات القرار ─────────────────────────────────────────────────────────────
// بعد الأسبوع ٤ والأسبوع ٨ يتخذ المؤسس قراراً مكتوباً: استمرار أو تغيير اتجاه أو إيقاف.
// لا يُفتح أي أسبوع بعد البوابة حتى يوجد قرار لها (الخادم يفرض قواعد التسجيل في
// record_journey_decision، وهذه الصفحة تفرض الفتح).
// الأسابيع التي بدأ المؤسس العمل فيها أو أنجزها تبقى متاحة دائماً، حتى قبل اتخاذ القرار.
type GateNum = 4 | 8;
type GateChoice = 'continue' | 'pivot' | 'stop';

interface GateSnapshot {
  interviews: number;
  observations: number;
  signups: number;
  preorders: number;
  preorder_amount: number;
  score: number;
  evidence_min_met: boolean;
}

interface GateDecisionRow {
  id: string;
  user_idea_id: string;
  gate: GateNum;
  decision: GateChoice;
  reason: string;
  snapshot: GateSnapshot;
  created_at: string;
}

const GATES: Record<GateNum, { title: string; hint: string }> = {
  4: { title: 'قرار الأسبوع ٤', hint: '٥ محادثات فأكثر وتسجيل اهتمام أو طلب مسبق واحد على الأقل مؤشر جيد للاستمرار.' },
  8: { title: 'قرار الأسبوع ٨', hint: '٣ عملاء فأكثر يدفعون أو يلتزمون مؤشر جيد للاستمرار.' },
};
const GATE_CHOICES: Array<{ value: GateChoice; label: string }> = [
  { value: 'continue', label: 'استمرار' },
  { value: 'pivot', label: 'تغيير الاتجاه' },
  { value: 'stop', label: 'إيقاف' },
];
const CHOICE_LABEL: Record<GateChoice, string> = { continue: 'استمرار', pivot: 'تغيير الاتجاه', stop: 'إيقاف' };
const CHOICE_COLOR: Record<GateChoice, { bg: string; color: string }> = {
  continue: { bg: '#DEEBE2', color: '#1B6B3E' },
  pivot: { bg: '#F5EAD3', color: '#A07830' },
  stop: { bg: '#E8E4DC', color: '#554E41' },
};
const REASON_MIN = 20;
const REASON_MAX = 500;
const WHO_MIN = 3;

// القاعدة نفسها المستخدمة في مؤشر الجاهزية: ليس قراءة أولى بالذكاء الاصطناعي، وله «مع مَن».
function countEvidence(rows: Array<{ type: string; amount: number | null; who: string | null }>) {
  const counted = rows.filter(r => String(r.type ?? '').toLowerCase() !== 'stress_test' && (r.who ?? '').trim().length >= WHO_MIN);
  const n = (t: string) => counted.filter(r => String(r.type).toLowerCase() === t).length;
  return {
    interviews: n('interview'),
    observations: n('observation'),
    signups: n('signup'),
    preorders: n('preorder'),
    preorder_amount: counted.filter(r => String(r.type).toLowerCase() === 'preorder').reduce((sum, r) => sum + Number(r.amount ?? 0), 0),
  };
}

type LiveEvidence = ReturnType<typeof countEvidence> & { score: number; evidence_min_met: boolean };

export default function NinetyDayPage() {
  // مفتاح الفكرة يعيد ضبط حالة البوابات عند تبديل الفكرة.
  const { selectedIdeaId } = useIdea();
  return <NinetyDayJourney key={selectedIdeaId ?? 'none'} />;
}

function NinetyDayJourney() {
  const { user, profile } = useAuth();
  const { selectedIdea, selectedIdeaId } = useIdea();
  const { triggerReview } = useReview();
  const [tasks, setTasks] = useState<TaskMap>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [recommendedWeeks, setRecommendedWeeks] = useState<number[]>([]);
  const [rationale, setRationale] = useState<string>('');
  // بوابات القرار. حتى تُحمَّل القرارات تبقى الأسابيع المحجوبة بالبوابات مقفلة.
  const [decisions, setDecisions] = useState<GateDecisionRow[]>([]);
  const [decisionsLoaded, setDecisionsLoaded] = useState(false);
  const [liveEvidence, setLiveEvidence] = useState<LiveEvidence | null>(null);
  const [formOpen, setFormOpen] = useState<Record<number, boolean>>({});
  const [formChoice, setFormChoice] = useState<Record<number, GateChoice | null>>({});
  const [formReason, setFormReason] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState<Record<number, string | null>>({});
  const [gateSaving, setGateSaving] = useState<number | null>(null);

  const plan = profile?.plan ?? 'free';
  const canAccess = plan !== 'free';

  async function loadTasks() {
    if (!selectedIdeaId) return;
    const { data } = await supabase.from('journey_tasks').select('*').eq('user_idea_id', selectedIdeaId);
    const map: TaskMap = {};
    const notesMap: Record<number, string> = {};
    (data ?? []).forEach((t: any) => {
      if (!map[t.week_number]) map[t.week_number] = {};
      map[t.week_number][t.task_key] = !!t.is_completed || !!t.completed_at;
      if (t.task_key === 'main' && t.notes) notesMap[t.week_number] = t.notes;
    });
    setTasks(map);
    setNotes(notesMap);

    // Adaptive unlock layer — non-destructive, only ever adds early unlocks on
    // top of the fixed sequential backbone above. Best-effort: a failure here
    // just means no early unlocks this load, never a broken page.
    try {
      const { data: plan, error } = await supabase.functions.invoke('journey-plan', {
        body: { idea_id: selectedIdeaId },
      });
      if (error) throw error;
      setRecommendedWeeks(Array.isArray(plan?.recommended_weeks) ? plan.recommended_weeks : []);
      setRationale(typeof plan?.rationale === 'string' ? plan.rationale : '');
    } catch {
      setRecommendedWeeks([]);
      setRationale('');
    }
  }

  async function loadGateData() {
    if (!selectedIdeaId) return;
    const [decRes, entRes, ideaRes] = await Promise.all([
      supabase.from('journey_decisions').select('*').eq('user_idea_id', selectedIdeaId).order('created_at', { ascending: false }),
      supabase.from('validation_entries').select('type, amount, who').eq('user_idea_id', selectedIdeaId),
      supabase.from('user_ideas').select('iq_score, evidence_min_met').eq('id', selectedIdeaId).maybeSingle(),
    ]);
    setDecisions((decRes.data ?? []) as GateDecisionRow[]);
    // فشل القراءة يُبقي البوابات مقفلة بدل التخمين.
    setDecisionsLoaded(!decRes.error);
    setLiveEvidence({
      ...countEvidence((entRes.data ?? []) as Array<{ type: string; amount: number | null; who: string | null }>),
      score: Number(ideaRes.data?.iq_score ?? 0),
      evidence_min_met: !!ideaRes.data?.evidence_min_met,
    });
  }

  useEffect(() => { if (user && selectedIdeaId) { loadTasks(); void loadGateData(); } }, [selectedIdeaId, user]);

  // آخر قرار لكل بوابة هو المعتمد (القرارات تصل الأحدث أولاً).
  function latestDecision(gate: GateNum): GateDecisionRow | null {
    return decisions.find(d => Number(d.gate) === gate) ?? null;
  }

  async function recordDecision(gate: GateNum) {
    if (!selectedIdeaId) return;
    const choice = formChoice[gate];
    const reason = (formReason[gate] ?? '').trim();
    if (!choice) { setFormError(p => ({ ...p, [gate]: 'اختر: استمرار أو تغيير الاتجاه أو إيقاف.' })); return; }
    if (reason.length < REASON_MIN) { setFormError(p => ({ ...p, [gate]: `اكتب ${REASON_MIN} حرفاً على الأقل عن السبب.` })); return; }
    if (reason.length > REASON_MAX) { setFormError(p => ({ ...p, [gate]: `اجعلها أقل من ${REASON_MAX} حرفاً.` })); return; }
    setGateSaving(gate);
    setFormError(p => ({ ...p, [gate]: null }));
    const { error } = await supabase.rpc('record_journey_decision', {
      p_idea: selectedIdeaId, p_gate: gate, p_decision: choice, p_reason: reason,
    });
    setGateSaving(null);
    if (error) { setFormError(p => ({ ...p, [gate]: error.message })); return; }
    setFormOpen(p => ({ ...p, [gate]: false }));
    setFormReason(p => ({ ...p, [gate]: '' }));
    setFormChoice(p => ({ ...p, [gate]: null }));
    setToast('تم حفظ القرار.');
    await loadGateData();
  }

  async function toggleTask(weekNum: number, taskKey: string, current: boolean) {
    if (!user || !selectedIdeaId) return;
    const newVal = !current;
    setTasks(prev => ({ ...prev, [weekNum]: { ...(prev[weekNum] ?? {}), [taskKey]: newVal } }));

    const existing = await supabase.from('journey_tasks').select('id').eq('user_idea_id', selectedIdeaId).eq('week_number', weekNum).eq('task_key', taskKey).maybeSingle();

    const now = new Date().toISOString();
    if (existing.data?.id) {
      await supabase.from('journey_tasks').update({ is_completed: newVal, completed_at: now }).eq('id', existing.data.id);
    } else {
      await supabase.from('journey_tasks').insert({ user_idea_id: selectedIdeaId, week_number: weekNum, task_key: taskKey, is_completed: newVal, completed_at: now });
    }
    // completing a task moves the score now; refresh the gate card's numbers after it
    void recomputeIqScore(selectedIdeaId).then(() => loadGateData());
  }

  async function saveNotes(weekNum: number, text: string) {
    if (!user || !selectedIdeaId) return;
    const existing = await supabase.from('journey_tasks').select('id').eq('user_idea_id', selectedIdeaId).eq('week_number', weekNum).eq('task_key', 'main').maybeSingle();

    if (existing.data?.id) {
      await supabase.from('journey_tasks').update({ notes: text || null }).eq('id', existing.data.id);
    } else {
      await supabase.from('journey_tasks').insert({ user_idea_id: selectedIdeaId, week_number: weekNum, task_key: 'main', notes: text || null, is_completed: false });
    }
    void recomputeIqScore(selectedIdeaId); // written findings count toward مؤشر الجاهزية
  }

  const totalTasks = WEEKS.reduce((sum, w) => sum + 1 + w.subs.length, 0);
  const doneTasks = WEEKS.reduce((sum, w) => {
    const wt = tasks[w.num] ?? {};
    return sum + (wt['main'] ? 1 : 0) + w.subs.filter((_, i) => wt[`sub_${i}`]).length;
  }, 0);
  const overallPct = Math.round(doneTasks / totalTasks * 100);

  // The 90-Day Journey is the final stage. Ask for a review only once the whole
  // journey is complete (all tasks done). ReviewContext dedupes via localStorage,
  // so this fires at most once per user + idea.
  useEffect(() => {
    if (totalTasks > 0 && overallPct === 100 && selectedIdeaId) {
      triggerReview('stage_complete', '90-Day Journey', selectedIdeaId);
    }
  }, [overallPct, totalTasks, selectedIdeaId]);

  // The fixed sequential backbone — unchanged from before the adaptive layer.
  function isSequentiallyUnlocked(w: Week): boolean {
    if (w.num === 1) return true;
    const prev = tasks[w.num - 1] ?? {};
    return !!prev['main'];
  }

  // journey-plan only ADDS early unlocks on top of the sequential backbone —
  // it never locks a week that the sequential rule would have opened.
  function isAdaptivelyUnlocked(w: Week): boolean {
    return recommendedWeeks.includes(w.num);
  }

  // أسبوع بدأ المؤسس العمل فيه (مهمة منجزة أو ملاحظات مكتوبة): يبقى متاحاً دائماً،
  // فالبوابات لا تحجب عملاً سابقاً. هذا ما يحفظ عمل من أنهى الأسبوع ٤ أو ٨ قبل إضافتها.
  function weekHasProgress(w: Week): boolean {
    const wt = tasks[w.num] ?? {};
    return Object.values(wt).some(Boolean) || !!(notes[w.num] ?? '').trim();
  }

  // سبب قفل الأسبوع بسبب بوابة (null إن لم تمنعه بوابة). البوابات صارمة: لا يُفتح شيء
  // بعد الأسبوع ٤ قبل قرار البوابة ٤، ولا بعد الأسبوع ٨ قبل قرار البوابة ٨. تُفحص قبل
  // الفتح التكيّفي.
  function gateBlocking(w: Week): GateNum | null {
    if (weekHasProgress(w)) return null;
    if (w.num > 4 && (!decisionsLoaded || !latestDecision(4))) return 4;
    if (w.num > 8 && (!decisionsLoaded || !latestDecision(8))) return 8;
    return null;
  }

  function isWeekUnlocked(w: Week): boolean {
    if (w.num === 1) return true;
    if (weekHasProgress(w)) return true;
    if (gateBlocking(w)) return false;
    return isSequentiallyUnlocked(w) || isAdaptivelyUnlocked(w);
  }

  // Weeks the adaptive layer actually changed — i.e. recommended by journey-plan
  // but not already open via the sequential rule. Empty means it changed nothing.
  const adaptiveExtraWeeks = WEEKS.filter(w => isAdaptivelyUnlocked(w) && !isSequentiallyUnlocked(w) && !gateBlocking(w)).map(w => w.num);

  function getWeekStatus(w: Week): 'complete' | 'in_progress' | 'locked' | 'upcoming' {
    if (!isWeekUnlocked(w)) return 'locked';
    const wt = tasks[w.num] ?? {};
    const main = !!wt['main'];
    const anySub = w.subs.some((_, i) => wt[`sub_${i}`]);
    if (main) return 'complete';
    if (anySub) return 'in_progress';
    return 'upcoming';
  }

  const phaseProgress = [1, 2, 3].map(phase => {
    const phaseWeeks = WEEKS.filter(w => w.phase === phase);
    const phaseDone = phaseWeeks.reduce((sum, w) => sum + (getWeekStatus(w) === 'complete' ? 1 : 0), 0);
    return Math.round(phaseDone / phaseWeeks.length * 100);
  });

  function renderGate(gate: GateNum) {
    const weekDone = !!(tasks[gate] ?? {})['main'];
    if (!weekDone) return null;
    const meta = GATES[gate];
    const latest = latestDecision(gate);
    const showForm = !latest || !!formOpen[gate];
    const choice = formChoice[gate] ?? null;
    const reasonText = formReason[gate] ?? '';
    const reasonLen = reasonText.trim().length;
    const err = formError[gate] ?? null;
    // إرشاد تغيير الاتجاه / الإيقاف يتبع القرار المسجّل (أو الاختيار الجاري).
    const guidance: GateChoice | null = showForm ? choice : (latest?.decision ?? null);
    const ev = liveEvidence;
    // مؤسسون أنهوا أسابيع بعد هذه البوابة قبل إضافتها: عملهم متاح، وقرارهم يفتح ما بعده.
    const alreadyPast = !latest && WEEKS.some(w => w.num > gate && weekHasProgress(w));
    const evidenceRow = (e: { interviews: number; observations: number; signups: number; preorders: number; preorder_amount: number; score: number; evidence_min_met: boolean }) => (
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        <Chip size="small" label={`${e.interviews} مقابلات`} />
        <Chip size="small" label={`${e.observations} ملاحظات`} />
        <Chip size="small" label={`${e.signups} تسجيلات اهتمام`} />
        <Chip size="small" label={`${e.preorders} طلبات مسبقة ($${e.preorder_amount})`} />
        <Chip size="small" color="primary" variant="outlined" label={`مؤشر الجاهزية ${e.score}`} />
        <Chip size="small" variant="outlined" label={e.evidence_min_met ? 'الحد الأدنى للأدلة متحقق' : 'الحد الأدنى للأدلة غير متحقق بعد'} />
      </Stack>
    );

    return (
      <Card sx={{ border: '2px solid', borderColor: '#D4A65388', bgcolor: '#FAF5E9', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={800} color="secondary.main">بوابة القرار</Typography>
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>{meta.title}: نستمر أم نغيّر الاتجاه أم نتوقف؟</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            تُفتح الأسابيع من {gate + 1} فصاعداً بعد أن تتخذ قرارك. {meta.hint}
          </Typography>
          {alreadyPast && (
            <Alert severity="info" sx={{ mb: 1.5 }}>
              أنجزتَ أسابيع بعد هذه البوابة قبل إضافتها، وتبقى متاحة لك كما هي. قرارك هنا يفتح الأسابيع الجديدة.
            </Alert>
          )}

          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            ما يُحتسب الآن (الأنشطة التي بلا «مع مَن» لا تُحتسب)
          </Typography>
          {ev ? evidenceRow(ev) : <Typography variant="caption" color="text.secondary">جارٍ تحميل أدلتك…</Typography>}

          {latest && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fff', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}>
                <Chip size="small" label={CHOICE_LABEL[latest.decision]} sx={{ fontWeight: 800, bgcolor: CHOICE_COLOR[latest.decision].bg, color: CHOICE_COLOR[latest.decision].color }} />
                <Typography variant="caption" color="text.secondary">
                  اتُّخذ القرار {new Date(latest.created_at).toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' })}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {!showForm && (
                  <Button size="small" onClick={() => { setFormOpen(p => ({ ...p, [gate]: true })); setFormChoice(p => ({ ...p, [gate]: null })); setFormError(p => ({ ...p, [gate]: null })); }}>
                    قرّر من جديد
                  </Button>
                )}
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{latest.reason}</Typography>
              {latest.snapshot && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  وقتها: {latest.snapshot.interviews} مقابلات، {latest.snapshot.observations} ملاحظات، {latest.snapshot.signups} تسجيلات اهتمام، {latest.snapshot.preorders} طلبات مسبقة (${latest.snapshot.preorder_amount})، ومؤشر الجاهزية {latest.snapshot.score}.
                </Typography>
              )}
            </Box>
          )}

          {showForm && (
            <Box sx={{ mt: 2 }}>
              <ToggleButtonGroup
                exclusive size="small" color="primary" value={choice}
                onChange={(_, v: GateChoice | null) => setFormChoice(p => ({ ...p, [gate]: v }))}
                aria-label={meta.title}
              >
                {GATE_CHOICES.map(c => <ToggleButton key={c.value} value={c.value} sx={{ px: 2.5, fontWeight: 700 }}>{c.label}</ToggleButton>)}
              </ToggleButtonGroup>
              <TextField
                fullWidth multiline minRows={2} size="small" sx={{ mt: 1.5, bgcolor: '#fff' }}
                label={`لماذا؟ (${REASON_MIN} حرفاً على الأقل)`}
                value={reasonText}
                onChange={e => setFormReason(p => ({ ...p, [gate]: e.target.value }))}
                inputProps={{ maxLength: REASON_MAX, autoComplete: 'off' }}
                helperText={`${reasonLen}/${REASON_MAX}${reasonLen < REASON_MIN ? ` · بقي ${REASON_MIN - reasonLen}` : ''}`}
              />
              {err && <Alert severity="error" sx={{ mt: 1.5 }}>{err}</Alert>}
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Button variant="contained" disabled={gateSaving === gate} onClick={() => void recordDecision(gate)}>
                  {gateSaving === gate ? 'جارٍ الحفظ…' : latest ? 'احفظ قراراً جديداً' : 'احفظ القرار'}
                </Button>
                {latest && <Button color="inherit" onClick={() => setFormOpen(p => ({ ...p, [gate]: false }))}>إلغاء</Button>}
              </Stack>
            </Box>
          )}

          {guidance === 'pivot' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              تغيير الاتجاه خطوة ذكية وليس فشلاً. أعد تشكيل الفكرة حول ما قاله لك العملاء فعلاً.{' '}
              <Link to="/journey">عدّل فكرتك</Link>. ويمكنك اتخاذ قرار جديد هنا لاحقاً.
            </Alert>
          )}
          {guidance === 'stop' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              معرفة متى تتوقف مهارة حقيقية، وقد عرفتها بتكلفة قليلة. ما تعلّمته ينتقل إلى فكرتك التالية.{' '}
              <Link to="/journey?new=true">أضف فكرة جديدة</Link>.
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!selectedIdea) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">اختر فكرة لعرض رحلة الـ ٩٠ يوماً.</Alert>
      </Container>
    );
  }

  if (!canAccess) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ textAlign: 'center', p: 6, border: '2px dashed', borderColor: 'divider', boxShadow: 'none' }}>
          <LockOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>رحلة الـ ٩٠ يوماً تتطلب خطة برو</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>خطتك التنفيذية أسبوعاً بأسبوع من أول مقابلة حتى أول دولار.</Typography>
          <Button variant="contained" component={Link} to="/pricing">رقِّ إلى برو — $9/شهر</Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>رحلة الـ ٩٠ يوماً</Typography>
          <Typography variant="body2" color="text.secondary">خطة تنفيذ أسبوعاً بأسبوع — من أول مقابلة حتى أول دولار.</Typography>
        </Box>
        <Box sx={{ mt: { xs: 1, sm: 0 }, textAlign: { sm: 'right' } }}>
          <Typography variant="h6" fontWeight={800} color="primary.main">اكتمل ٪{overallPct}</Typography>
          <Box sx={{ width: 180, mt: 0.5 }}>
            <LinearProgress variant="determinate" value={overallPct} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #1B6B3E, #D08A28)' } }} />
          </Box>
        </Box>
      </Stack>

      {/* Phase overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            {[1, 2, 3].map((phase, i) => (
              <Box key={phase} sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: PHASE_COLORS[i] }}>المرحلة {phase}: {PHASE_LABELS[i]}</Typography>
                  <Typography variant="caption" fontWeight={700}>{phaseProgress[i]}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={phaseProgress[i]} sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.100', '& .MuiLinearProgress-bar': { bgcolor: PHASE_COLORS[i] } }} />
                <Typography variant="caption" color="text.secondary">الأسابيع {(i * 4) + 1}–{(i * 4) + 4}</Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {adaptiveExtraWeeks.length > 0 && rationale && (
        <Alert severity="info" sx={{ mb: 2 }}>{rationale}</Alert>
      )}

      {/* Weeks */}
      <Stack spacing={2}>
        {WEEKS.map(week => {
          const status = getWeekStatus(week);
          const wt = tasks[week.num] ?? {};
          const isLocked = status === 'locked';
          const isAdaptive = adaptiveExtraWeeks.includes(week.num);
          const borderColor = isAdaptive && status === 'upcoming'
            ? '#D4A653'
            : { complete: '#2A8A52', in_progress: '#1B6B3E', locked: '#E8E4DC', upcoming: '#E8E4DC' }[status];
          const badge = { complete: '✅ مكتمل', in_progress: '🔄 قيد التنفيذ', locked: '🔒 مقفل', upcoming: '⬜ قادم' }[status];
          const blockedBy = gateBlocking(week);

          return (
            <Fragment key={week.num}>
            <Card sx={{ borderLeft: `4px solid ${borderColor}`, opacity: isLocked ? 0.6 : 1 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={`الأسبوع ${week.num}`} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: `${PHASE_COLORS[week.phase - 1]}18`, color: PHASE_COLORS[week.phase - 1], fontWeight: 700 }} />
                      <Chip label={badge} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                      {isAdaptive && (
                        <Chip label="فُتح مبكراً" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#D4A65322', color: '#8A6D2F', fontWeight: 700 }} />
                      )}
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.75 }}>{week.title}</Typography>
                    {blockedBy && (
                      <Typography variant="caption" color="text.secondary">
                        {decisionsLoaded ? `اتخذ قرار الأسبوع ${blockedBy} لتفتح هذا الأسبوع.` : 'نتحقق من قراراتك…'}
                      </Typography>
                    )}
                  </Box>
                </Stack>

                {/* Main task */}
                <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mb: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Checkbox size="small" checked={!!wt['main']} onChange={() => !isLocked && toggleTask(week.num, 'main', !!wt['main'])} disabled={isLocked} sx={{ mt: -0.5, p: 0.5 }} />
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>المهمة الرئيسية</Typography>
                    <Typography variant="body2" sx={{ textDecoration: wt['main'] ? 'line-through' : 'none', color: wt['main'] ? 'text.disabled' : 'text.primary' }}>
                      {week.main}
                    </Typography>
                  </Box>
                </Stack>

                {/* Sub-tasks */}
                <Stack spacing={0.75} sx={{ pl: 1 }}>
                  {week.subs.map((sub, si) => (
                    <Stack key={si} direction="row" spacing={1} alignItems="flex-start">
                      <Checkbox size="small" checked={!!wt[`sub_${si}`]} onChange={() => !isLocked && toggleTask(week.num, `sub_${si}`, !!wt[`sub_${si}`])} disabled={isLocked} sx={{ mt: -0.5, p: 0.5 }} />
                      <Typography variant="body2" sx={{ pt: 0.25, textDecoration: wt[`sub_${si}`] ? 'line-through' : 'none', color: wt[`sub_${si}`] ? 'text.disabled' : 'text.primary' }}>
                        {sub}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                {/* Notes — a week counts toward مؤشر الجاهزية only once its main task is
                    ticked AND at least JOURNEY_NOTES_MIN_CHARS characters are written here. */}
                {(() => {
                  const noteLen = (notes[week.num] ?? '').trim().length;
                  const counts = !!wt['main'] && noteLen >= JOURNEY_NOTES_MIN_CHARS;
                  return (
                    <TextField
                      value={notes[week.num] ?? ''}
                      onChange={e => setNotes(prev => ({ ...prev, [week.num]: e.target.value }))}
                      onBlur={() => !isLocked && saveNotes(week.num, notes[week.num] ?? '')}
                      disabled={isLocked}
                      label="ماذا تعلّمت هذا الأسبوع؟"
                      placeholder="ملاحظاتك حول هذا الأسبوع…"
                      size="small"
                      fullWidth
                      multiline
                      minRows={2}
                      slotProps={{ inputLabel: { shrink: true } }}
                      helperText={counts
                        ? '✓ يُحتسب هذا الأسبوع في مؤشر الجاهزية.'
                        : `لكي يُحتسب هذا الأسبوع في مؤشر الجاهزية: أنجز المهمة الرئيسية واكتب ${JOURNEY_NOTES_MIN_CHARS} حرفاً على الأقل عمّا تعلّمته (${noteLen}/${JOURNEY_NOTES_MIN_CHARS}). لا تكتب بيانات الناس الشخصية.`}
                      FormHelperTextProps={{ sx: { color: counts ? 'success.main' : 'text.secondary' } }}
                      sx={{ mt: 1.5 }}
                    />
                  );
                })()}

                {/* Coach tip */}
                <Box sx={{ mt: 1.5, p: 1.25, bgcolor: '#F0F5F1', borderRadius: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SmartToyOutlinedIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                    <Typography variant="caption" color="secondary.main" fontWeight={600}>اسأل المدرّب الذكي:</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>"{week.coachTip}"</Typography>
                    <Button size="small" component={Link} to={`/ai-coach`} sx={{ fontSize: '0.7rem', py: 0.25, px: 1, minWidth: 0 }}>اسأل ←</Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
            {(week.num === 4 || week.num === 8) && renderGate(week.num as GateNum)}
            </Fragment>
          );
        })}
      </Stack>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Container>
  );
}
