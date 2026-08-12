// Real-data model for the founder journey overview (Bethra-branded journey map).
// Ported from IdeaIQ's founder/overview/journeyModel.ts. buildJourney() takes the
// data the dashboard already fetches from Supabase (validation_entries,
// journey_tasks, canvas_data, swot_analyses, pitch_data, the Bethra score, the
// founder's ideas) and returns the Journey shape JourneyOverview consumes.
// No mock content: every field below is derived from real rows, and each stop
// routes to its real /journey/* page.
//
// Difference from IdeaIQ: no isPro stop-locking. Bethra's real per-page plan
// gating is granular and inconsistent (ValidationPage gates editing only,
// PitchPage gates by a specific plan whitelist that excludes 'pro', Canvas/SWOT
// are ungated) — a dashboard-level "all core stops locked" display would
// misrepresent what actually happens when a founder clicks through. Each real
// /journey/* page enforces its own restriction; this map never fakes one.

import { SCORE_CAPS, type ScoreBreakdown } from '../../../lib/iqScore';

// ── Bethra brand tokens (green/gold) — same keys as the IdeaIQ source so every
// C.* reference in JourneyOverview.tsx ports unchanged; only the values swap. ──
export const C = {
  navy900: '#0F3D24', // page background — Bethra green deep
  navy800: '#123F27', // row hover
  navy700: '#1B6B3E', // raised panel — Bethra green mid
  navy600: '#2C5940', // hairlines / empty track
  navy500: '#3D7A54', // secondary bar fill
  gold: '#D4A653',
  goldLight: '#E8C07A',
  ink100: '#FFFFFF',
  ink200: '#E4EDE7',
  ink300: '#C3D6C9',
  ink400: '#A8C2AF',
  ink500: '#8DA697',
  ink600: '#5E7A68',
} as const;

export type StopState = 'done' | 'current' | 'ahead';

export interface Stop {
  id: string;
  name: string;
  route: string; // real /journey/* destination
  state: StopState;
  status: string; // short badge
  detail: string;
  result: string; // shown on collapsed done rows
  metric: string;
  pct: number; // 0–100
}

export interface ScorePart {
  label: string;
  value: number; // 0–100
  strong: boolean;
}

export interface NextAction {
  title: string;
  why: string;
  cta: string;
  route: string;
  gain: string;
}

export interface Journey {
  hasIdea: boolean;
  ideaName: string;
  founderInitials: string;
  currentDay: number;
  totalDays: number;
  stageBlurb: string;
  nextStopLabel: string;
  stops: Stop[];
  nextAction: NextAction | null;
  score: { value: number; stageLabel: string; parts: ScorePart[] };
  coach: { line: string; task: string };
}

export interface JourneyInputs {
  hasIdea: boolean;
  ideaName: string;
  founderName: string | null;
  stageLabel: string;
  ideaCreatedAt: string | null;
  ideasCount: number;
  iqScore: number;
  scoreBreakdown: ScoreBreakdown; // the 5 real score components (drives the score bars)
  validationCount: number;
  canvasBlocksFilled: number;
  journeyTasksDone: number;
  swotExists: boolean;
  pitchExists: boolean;
}

const TOTAL_JOURNEY_TASKS = 48; // 12 weeks × (1 main + 3 subs)
const VALIDATION_TARGET = 20; // "clear this stop at 20 signals"
const CANVAS_BLOCKS = 9;

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function initials(name: string | null): string {
  if (!name) return 'أنا';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || 'أنا';
}

// Day of the 90-day journey, from the idea's age. Clamped to 1–90 so it always
// reads as a real position on the strip even for brand-new or long-running ideas.
// No separate start-date field needed — user_ideas.created_at is sufficient.
function currentDayFrom(createdAt: string | null): number {
  if (!createdAt) return 1;
  const start = new Date(createdAt).getTime();
  if (Number.isNaN(start)) return 1;
  const days = Math.floor((Date.now() - start) / 86_400_000) + 1;
  return Math.max(1, Math.min(90, days));
}

// Per-stop copy for the current stop's "do this next" card and coach line.
const NEXT: Record<string, { title: string; cta: string; coach: string }> = {
  validation: { title: 'سجّل محادثتك القادمة مع عميل', cta: 'فتح متتبع التحقق', coach: 'أنت تجمع إشارات الطلب. سجّل بعض المقابلات، ثم اطلب مني قراءة الأنماط.' },
  canvas: { title: 'أكمل نموذج عملك (Canvas)', cta: 'فتح النموذج', coach: 'نموذجك يحوّل الفكرة إلى مشروع قابل للتنفيذ. اسألني إن علقت في أي قسم.' },
  swot: { title: 'اكتب تحليل SWOT الخاص بك', cta: 'فتح SWOT', coach: 'تحليل SWOT يوضّح أين تتفوق وأين أنت مكشوف. يمكنني اختبار تهديداتك.' },
  pitch: { title: 'جهّز عرضك التمويلي', cta: 'فتح العرض التمويلي', coach: 'حين تكون جاهزاً لجمع التمويل، يمكنني مساعدتك في صياغة العرض.' },
  '90-day': { title: 'واصل العمل على خطتك الأسبوعية', cta: 'فتح رحلة الـ٩٠ يوماً', coach: 'خطوات أسبوعية صغيرة تتراكم. أخبرني بما أنجزته وسأساعدك تختار التالي.' },
};

export function buildJourney(inp: JourneyInputs): Journey {
  const founderInitials = initials(inp.founderName);
  const currentDay = currentDayFrom(inp.ideaCreatedAt);

  // Real completion + progress per stop.
  const valDone = inp.validationCount >= VALIDATION_TARGET;
  const canvasDone = inp.canvasBlocksFilled >= CANVAS_BLOCKS;
  const swotDone = inp.swotExists;
  const pitchDone = inp.pitchExists;
  const journeyDone = inp.journeyTasksDone >= TOTAL_JOURNEY_TASKS;

  const valPct = clampPct((inp.validationCount / VALIDATION_TARGET) * 100);
  const canvasPct = clampPct((inp.canvasBlocksFilled / CANVAS_BLOCKS) * 100);
  const journeyPct = clampPct((inp.journeyTasksDone / TOTAL_JOURNEY_TASKS) * 100);

  // Base stop definitions (order = the founder's natural progression). No
  // isPro gate here — every founder sees the real stop, real progress, and
  // routes to the real page, which enforces its own actual restriction.
  type Base = Omit<Stop, 'state' | 'status'> & { done: boolean; core: boolean };
  const base: Base[] = [
    {
      id: 'my-ideas', name: 'أفكاري', route: '/journey', core: false, done: inp.ideasCount > 0,
      detail: 'كل فكرة سجّلتها، مع درجتها في بذرة.',
      result: `${inp.ideasCount} فكرة`,
      metric: `${inp.ideasCount} فكرة`, pct: inp.ideasCount > 0 ? 100 : 0,
    },
    {
      id: 'validation', name: 'متتبع التحقق', route: '/journey/validation', core: true, done: valDone,
      detail: 'سجّل مقابلات وتسجيلات وطلبات مسبقة لإثبات الطلب الحقيقي.',
      result: `${inp.validationCount} إشارة مسجّلة`,
      metric: `${inp.validationCount} من ${VALIDATION_TARGET} إشارة`, pct: valPct,
    },
    {
      id: '90-day', name: 'رحلة الـ٩٠ يوماً', route: '/journey/90-day', core: true, done: journeyDone,
      detail: 'خطة تنفيذك أسبوعاً بأسبوع، من أول مقابلة إلى أول دولار.',
      result: `${inp.journeyTasksDone} من ${TOTAL_JOURNEY_TASKS} مهمة`,
      metric: `اليوم ${currentDay} من ٩٠`, pct: journeyPct,
    },
    {
      id: 'swot', name: 'تحليل SWOT', route: '/journey/swot', core: true, done: swotDone,
      detail: 'نقاط القوة والضعف والفرص والتهديدات — أين تتفوق وأين أنت مكشوف.',
      result: swotDone ? 'مكتمل' : 'لم يبدأ',
      metric: swotDone ? 'مكتمل' : 'لم يبدأ', pct: swotDone ? 100 : 0,
    },
    {
      id: 'canvas', name: 'نموذج العمل (Canvas)', route: '/journey/canvas', core: true, done: canvasDone,
      detail: 'تسعة أقسام تحوّل فكرتك إلى نموذج عمل.',
      result: `${inp.canvasBlocksFilled} من ${CANVAS_BLOCKS} أقسام`,
      metric: `${inp.canvasBlocksFilled} من ${CANVAS_BLOCKS} أقسام`, pct: canvasPct,
    },
    {
      id: 'pitch', name: 'العرض التمويلي', route: '/journey/pitch', core: true, done: pitchDone,
      detail: 'عرضك الجاهز للمستثمرين، مبني من كل ما سبق.',
      result: pitchDone ? 'مكتمل' : 'لم يبدأ',
      metric: pitchDone ? 'مكتمل' : 'لم يبدأ', pct: pitchDone ? 100 : 0,
    },
  ];

  // The current stop is the first core stop that isn't done. Progression order
  // matches the visible sequence (90-Day third, SWOT before Canvas).
  const coreOrder = ['validation', '90-day', 'swot', 'canvas', 'pitch'];
  const currentId = coreOrder.find(id => !base.find(b => b.id === id)!.done) ?? null;
  const currentIndex = currentId ? base.findIndex(b => b.id === currentId) : -1;

  const stops: Stop[] = base.map((b) => {
    if (!b.core) return { ...b, state: 'done', status: 'مركز' };
    if (b.done) return { ...b, state: 'done', status: 'مكتمل' };
    if (b.id === currentId) return { ...b, state: 'current', status: 'أنت هنا' };
    return { ...b, state: 'ahead', status: b.pct > 0 ? 'قيد التقدم' : 'قادم' };
  });

  const current = currentId ? base.find(b => b.id === currentId)! : null;
  const nextStop = currentIndex >= 0 ? base.slice(currentIndex + 1).find(b => b.core) : undefined;

  const nextAction: NextAction | null = current
    ? {
        title: NEXT[current.id].title,
        why: `${current.metric} — ${current.detail}`,
        cta: NEXT[current.id].cta,
        route: current.route,
        gain: current.metric,
      }
    : {
        title: 'أكملت كل مراحل الرحلة',
        why: 'واصل تحديث تحققك وخطة الـ٩٠ يوماً، أو راجع أي محطة للتعمق أكثر.',
        cta: 'مراجعة رحلتك', route: '/journey', gain: 'كل المراحل مكتملة',
      };

  const coach = current
    ? { line: NEXT[current.id].coach, task: current.name }
    : { line: 'أنجزت الرحلة كاملة — اطلب مني مراجعة أي جزء قبل أن تتقدم أكثر.', task: 'أي شيء' };

  return {
    hasIdea: inp.hasIdea, ideaName: inp.ideaName, founderInitials, currentDay, totalDays: 90,
    stageBlurb: current
      ? current.detail
      : 'كل مرحلة مكتملة — هذا هو الوقت للحفاظ على الزخم.',
    nextStopLabel: current ? (nextStop ? `التالي · ${nextStop.name}` : 'المحطة الأخيرة') : 'الرحلة مكتملة',
    stops, nextAction,
    score: { value: inp.iqScore, stageLabel: inp.stageLabel, parts: scoreParts(inp) },
    coach,
  };
}

// The score bars — the five real Bethra Score components. Each bar is that
// component as a % of its cap; "strong" (gold) once it clears 60% of its cap.
function scoreParts(inp: JourneyInputs): ScorePart[] {
  const b = inp.scoreBreakdown;
  const bar = (value: number, cap: number, label: string): ScorePart =>
    ({ label, value: clampPct((value / cap) * 100), strong: value >= cap * 0.6 });
  return [
    bar(b.validation, SCORE_CAPS.validation, 'التحقق من العملاء'),
    bar(b.model, SCORE_CAPS.model, 'نموذج العمل'),
    bar(b.financials, SCORE_CAPS.financials, 'الماليات'),
    bar(b.journey, SCORE_CAPS.journey, 'رحلة الـ٩٠ يوماً'),
    bar(b.coach, SCORE_CAPS.coach, 'المدرّب الذكي'),
  ];
}
