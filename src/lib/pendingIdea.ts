// §4 Validate→Save→Journey bridge.
//
// The validate quiz has one free-text field (Q1 = the idea) and four choice
// fields (Q2 audience, Q3 channel, Q4 payment-likelihood, Q5 obstacle). Only
// Q1 and Q2 map to real user_ideas columns; Q3–Q5 are diagnostic and have no
// column, so they are NOT persisted onto the idea record.
//
// iq_score is intentionally NOT set from the validate score: the validate tool
// scores 1–10 while user_ideas.iq_score is the 0–100 journey score (computed by
// the canvas/journey). Setting it here would corrupt that metric — it's left at
// its default (0) and the journey computes the real score later.
import { supabase } from '../supabase';

export const PENDING_IDEA_KEY = 'bethra_pending_idea';
export const SELECTED_IDEA_KEY = 'bethra_selected_idea_id';

export interface ValidationResults {
  score: number;
  verdict: string;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
}

// Only the fields that map to real user_ideas columns.
export interface IdeaPayload {
  title: string;
  solution: string;
  target_customer: string;
}

export interface PendingIdea {
  payload: IdeaPayload;
  answers: Record<number, string>;
  results: ValidationResults | null;
  stashedAt: string;
}

export function buildIdeaPayload(answers: Record<number, string>): IdeaPayload {
  const idea = (answers[1] ?? '').trim();
  return {
    title: (idea || 'فكرتي').slice(0, 200),
    solution: idea,
    target_customer: (answers[2] ?? '').trim(),
  };
}

// Creates a user_ideas row (letting NOT-NULL text columns default to '') and,
// best-effort, records the AI validation score as a validation_entries note.
// Returns the new idea id. Also stores it as the selected idea so the journey
// opens on it.
export async function createUserIdea(
  userId: string,
  payload: IdeaPayload,
  results?: ValidationResults | null,
): Promise<string> {
  const { data, error } = await supabase
    .from('user_ideas')
    .insert({ ...payload, user_id: userId })
    .select('id')
    .single();
  if (error || !data) throw error ?? new Error('Failed to create idea');

  const ideaId = data.id as string;

  if (results) {
    // Non-fatal: preserve the validation score/verdict against the new idea.
    void supabase.from('validation_entries').insert({
      user_idea_id: ideaId,
      type: 'other',
      notes: `اختبار الفكرة — درجة الذكاء الاصطناعي: ${results.score}/10. ${results.verdict}`,
      amount: 0,
      sentiment: results.score >= 7 ? 'positive' : results.score >= 5 ? 'neutral' : 'negative',
    });
  }

  try { localStorage.setItem(SELECTED_IDEA_KEY, ideaId); } catch { /* ignore */ }
  return ideaId;
}

export function stashPendingIdea(p: PendingIdea): void {
  try { localStorage.setItem(PENDING_IDEA_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

export function readPendingIdea(): PendingIdea | null {
  try {
    const raw = localStorage.getItem(PENDING_IDEA_KEY);
    return raw ? (JSON.parse(raw) as PendingIdea) : null;
  } catch { return null; }
}

export function clearPendingIdea(): void {
  try { localStorage.removeItem(PENDING_IDEA_KEY); } catch { /* ignore */ }
}
