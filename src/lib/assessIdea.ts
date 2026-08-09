import { supabase } from '../supabase';

// Refresh the AI-Coach readiness assessment (0–15) for an idea. The edge function
// computes it from the founder's real data and caches it on
// user_ideas.coach_assessment, which recomputeIqScore() then folds into the
// Bethra Score. Best-effort — callers can ignore failures (the cache just stays
// as it was). This is intentionally NOT called on every keystroke; only on
// meaningful events (creating an idea) and a bounded staleness refresh.
export async function assessIdea(ideaId: string): Promise<{ score: number; rationale: string } | null> {
  if (!ideaId) return null;
  try {
    const { data, error } = await supabase.functions.invoke('assess-idea', { body: { idea_id: ideaId } });
    if (error) return null;
    return data as { score: number; rationale: string };
  } catch {
    return null;
  }
}
