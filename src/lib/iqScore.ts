// مؤشر الجاهزية (Readiness Score, 0–100) is computed and stored by the database
// (migration 20261115210000_readiness_score_v2_and_marketplace_gate.sql). The browser
// never writes it: this file only asks the server to refresh it and reads the result.
//
// Parts (caps sum to 100):
//   Customer evidence  50   founder-logged tracker entries, AI first reads excluded.
//                           Two halves of 25: what people said (interviews,
//                           observations, notes) and what people did (sign-ups,
//                           pre-orders), each weighted by sentiment (empty = neutral).
//   Business model     20   canvas blocks filled
//   Financials         15   revenue + costs + break-even entered
//   90-Day Journey     15   1.25 per week whose main task is done AND has written findings
// The AI Coach's assessment is an opinion shown next to the score. It is worth 0.
import { supabase } from '../supabase';

// The 9 Business Model Canvas blocks that count toward the score / publish gate.
export const CANVAS_BLOCK_KEYS = [
  'key_partners', 'key_activities', 'value_proposition', 'customer_relationships',
  'customer_segments', 'key_resources', 'channels', 'cost_structure', 'revenue_streams',
] as const;

// Part caps (sum = 100). Customer evidence comes first everywhere it is shown.
export const SCORE_CAPS = { evidence: 50, model: 20, financials: 15, journey: 15 } as const;

// Score needed (together with the evidence minimum) for the take-off moment and
// for a marketplace listing.
export const TAKEOFF_THRESHOLD = 80;

// A week's main task counts toward the score only with this much written down.
export const JOURNEY_NOTES_MIN_CHARS = 30;

// Shown wherever the evidence minimum appears. "مؤقتة" is part of the rule's name:
// the thresholds may change as we learn what real evidence looks like.
export const EVIDENCE_MIN_RULE =
  'الحد الأدنى للأدلة (قاعدة مؤقتة): 5 أدلة عملاء على الأقل، بينها تسجيل اهتمام أو طلب مسبق واحد على الأقل.';

export interface ScoreBreakdown {
  evidence: number;
  model: number;
  financials: number;
  journey: number; // decimal, e.g. 2.5
  total: number;
  evidenceMinMet: boolean;
}

export const ZERO_BREAKDOWN: ScoreBreakdown = {
  evidence: 0, model: 0, financials: 0, journey: 0, total: 0, evidenceMinMet: false,
};

export interface ScoreResult {
  score: number;
  breakdown: ScoreBreakdown;
  takeoffReady: boolean;
}

/** One decimal for the journey part, e.g. "2.5". */
export function formatJourneyPoints(n: number): string {
  return (Math.round(Number(n) * 10) / 10).toFixed(1);
}

interface RefreshRow {
  score?: number | string | null;
  evidence?: number | string | null;
  model?: number | string | null;
  financials?: number | string | null;
  journey?: number | string | null;
  evidence_min_met?: boolean | null;
  takeoff_ready?: boolean | null;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Ask the server to recompute this idea's score and return it with its parts.
 * Owner-only on the server. Returns null if the idea can't be read at all.
 *
 * The database also recomputes on every evidence / canvas / journey write, so this
 * is mostly a read; calling it after a save just guarantees the UI shows the
 * post-save value.
 *
 * If the RPC is not available (the frontend can be live before the migration is
 * applied), fall back to the stored total so the score still shows.
 */
export async function recomputeIqScore(ideaId: string): Promise<ScoreResult | null> {
  if (!ideaId) return null;

  const { data, error } = await supabase.rpc('refresh_idea_score', { p_idea: ideaId });
  const row = (data ?? null) as RefreshRow | null;

  if (!error && row) {
    const breakdown: ScoreBreakdown = {
      evidence: num(row.evidence),
      model: num(row.model),
      financials: num(row.financials),
      journey: num(row.journey),
      total: num(row.score),
      evidenceMinMet: !!row.evidence_min_met,
    };
    return { score: breakdown.total, breakdown, takeoffReady: !!row.takeoff_ready };
  }

  const { data: idea } = await supabase
    .from('user_ideas')
    .select('iq_score')
    .eq('id', ideaId)
    .maybeSingle();
  if (!idea) return null;
  const total = num(idea.iq_score);
  return { score: total, breakdown: { ...ZERO_BREAKDOWN, total }, takeoffReady: false };
}
