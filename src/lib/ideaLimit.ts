// The database refuses an idea insert past the plan's limit (trigger
// trg_enforce_idea_limit) and says so in Arabic. This returns that message when the
// error is the limit, and null for any other error, so each page can show it as is.
export function ideaLimitMessage(error: unknown): string | null {
  const e = error as { hint?: string; message?: string } | null | undefined;
  if (e?.hint === 'idea_limit' && e.message) return e.message;
  return null;
}
