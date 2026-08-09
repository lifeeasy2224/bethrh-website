// Single source of truth for the Bethra Score (0–100).
//
// iq_score is a *cache* on user_ideas. recomputeIqScore() refreshes and persists
// it at every moment that changes an input — validation add/delete/edit,
// journey-task toggle, canvas save, re-validate, opening the pitch page, and
// dashboard load — so the cache can't go stale where it matters.
//
// Five components, caps sum to 100 (ported from IdeaIQ's Phase 2 Option A):
//   Customer validation   35   weighted by evidence STRENGTH × sentiment (not raw count)
//   Business model         20   canvas blocks filled
//   Financial projections  15   revenue + costs + break-even entered
//   90-Day Journey         15   tasks completed / 48
//   AI-Coach assessment    15   cached, set by the assess-idea edge function (Phase 2);
//                               0 until an idea's first assessment — same as an
//                               unassessed idea in IdeaIQ itself, not a degraded state
// The AI stress-test result from /validate is a distinct quality signal and is
// NEVER mixed into iq_score (that collision previously made the number jump on
// validation, then drop) — Bethra doesn't even persist it onto user_ideas today,
// so there is nothing to accidentally conflate.
import { supabase } from '../supabase';

// The 9 Business Model Canvas blocks that count toward the score.
export const CANVAS_BLOCK_KEYS = [
  'key_partners', 'key_activities', 'value_proposition', 'customer_relationships',
  'customer_segments', 'key_resources', 'channels', 'cost_structure', 'revenue_streams',
] as const;

export const TOTAL_JOURNEY_TASKS = 48; // 12 weeks × (1 main + 3 subs) — matches NinetyDayPage's WEEKS

// Component caps (sum = 100).
export const SCORE_CAPS = { validation: 35, model: 20, financials: 15, journey: 15, coach: 15 } as const;

// Customer-validation weighting: real evidence strength, not a raw count.
// A paid pre-order is worth far more than "a friend said it sounds cool."
const VALIDATION_TYPE_PTS: Record<string, number> = {
  preorder: 10, signup: 6, interview: 3, observation: 2, other: 1,
};
const SENTIMENT_MULT: Record<string, number> = { positive: 1, neutral: 0.7, negative: 0.4 };

export interface ScoreBreakdown {
  validation: number; model: number; financials: number; journey: number; coach: number; total: number;
}

export interface IqScoreInputs {
  // Real customer-contact signals ONLY — the caller must exclude stress_test rows.
  validationEntries: Array<{ type: string | null; sentiment: string | null }>;
  canvasBlocksFilled: number;                                    // 0–9
  financials: { revenue: number; costs: number; breakEvenMonth: number };
  journeyTasksDone: number;
  coachAssessment: number;                                       // 0–15 (Phase 1: always 0)
}

export function computeIqBreakdown(p: IqScoreInputs): ScoreBreakdown {
  const rawValidation = p.validationEntries.reduce((sum, e) => {
    const typePts = VALIDATION_TYPE_PTS[(e.type ?? '').toLowerCase()] ?? 0;
    const mult = SENTIMENT_MULT[(e.sentiment ?? 'positive').toLowerCase()] ?? 1;
    return sum + typePts * mult;
  }, 0);
  const validation = Math.min(Math.round(rawValidation), SCORE_CAPS.validation);
  const model = Math.min(Math.round((p.canvasBlocksFilled / CANVAS_BLOCK_KEYS.length) * SCORE_CAPS.model), SCORE_CAPS.model);
  const financials = Math.min(
    (p.financials.revenue > 0 ? 5 : 0) + (p.financials.costs > 0 ? 5 : 0) + (p.financials.breakEvenMonth > 0 ? 5 : 0),
    SCORE_CAPS.financials,
  );
  const journey = Math.min(Math.round((p.journeyTasksDone / TOTAL_JOURNEY_TASKS) * SCORE_CAPS.journey), SCORE_CAPS.journey);
  const coach = Math.max(0, Math.min(Math.round(p.coachAssessment), SCORE_CAPS.coach));
  const total = Math.min(validation + model + financials + journey + coach, 100);
  return { validation, model, financials, journey, coach, total };
}

// Backwards-compatible: callers that only want the number.
export function computeIqScore(p: IqScoreInputs): number {
  return computeIqBreakdown(p).total;
}

// Fetch the live inputs for an idea, recompute the score, and persist it to
// user_ideas.iq_score (only writing when it changed). Returns the fresh score +
// breakdown, or null if it couldn't be computed. Best-effort: callers may ignore
// failures — a stale cache is no worse than before.
// TAKEOFF_THRESHOLD: the score at which an idea is "ready to take off" (matches
// the marketplace-publish threshold used elsewhere in the app).
export const TAKEOFF_THRESHOLD = 80;

export async function recomputeIqScore(ideaId: string): Promise<{ score: number; breakdown: ScoreBreakdown } | null> {
  if (!ideaId) return null;

  const [valRes, canvasRes, tasksRes, ideaRes] = await Promise.all([
    supabase.from('validation_entries').select('type, sentiment').eq('user_idea_id', ideaId),
    supabase.from('canvas_data').select('*').eq('user_idea_id', ideaId).maybeSingle(),
    supabase.from('journey_tasks').select('id', { count: 'exact', head: true }).eq('user_idea_id', ideaId).eq('is_completed', true),
    supabase.from('user_ideas').select('iq_score, iq_breakdown, coach_assessment').eq('id', ideaId).maybeSingle(),
  ]);

  const canvas = canvasRes.data as Record<string, unknown> | null;
  const canvasBlocksFilled = canvas
    ? CANVAS_BLOCK_KEYS.filter(k => String(canvas[k] ?? '').length >= 20).length
    : 0;

  const entries = (valRes.data as Array<{ type: string | null; sentiment: string | null }> | null) ?? [];
  const validationEntries = entries.filter(e => (e.type ?? '').toLowerCase() !== 'stress_test');

  const breakdown = computeIqBreakdown({
    validationEntries,
    canvasBlocksFilled,
    financials: {
      revenue: Number((canvas?.monthly_revenue as number | null) ?? 0),
      costs: Number((canvas?.monthly_costs as number | null) ?? 0),
      breakEvenMonth: Number((canvas?.break_even_month as number | null) ?? 0),
    },
    journeyTasksDone: tasksRes.count ?? 0,
    // Read-only cache: this function never computes the AI-Coach component
    // itself — assessIdea() (Phase 2) sets it server-side; 0 if never assessed.
    coachAssessment: Number(ideaRes.data?.coach_assessment ?? 0),
  });

  const oldScore = ideaRes.data?.iq_score ?? null;
  const oldBreakdown = JSON.stringify(ideaRes.data?.iq_breakdown ?? null);
  const newBreakdown = JSON.stringify(breakdown);
  if (oldScore !== breakdown.total || oldBreakdown !== newBreakdown) {
    // Persist the breakdown alongside the total. Investors can't read a founder's
    // raw canvas_data (RLS is owner-only, no marketplace exception), so this
    // cached breakdown — written under the founder's own full-access session —
    // is how IdeaDetailPage shows real components without fabricating them.
    await supabase.from('user_ideas').update({ iq_score: breakdown.total, iq_breakdown: breakdown }).eq('id', ideaId);
  }

  return { score: breakdown.total, breakdown };
}
