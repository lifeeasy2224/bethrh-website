/*
  # Replace ريال (SAR) with $ in all seed and idea_library content

  ## Summary
  Replaces every occurrence of the Arabic "ريال" currency label with the
  "$" symbol in all free-text content columns across the `seeds` and
  `idea_library` tables, so the site consistently shows only $ for amounts.

  ## Strategy
  Two-pass regex per column:
  1. First pass — `NUMBER ريال(اً?)` → `$NUMBER`
     Converts patterns like "٤٩ ريال/شهر" → "$٤٩/شهر"
  2. Second pass — any remaining standalone `ريال(اً?)` → `$`
     Catches edge cases not preceded by a captured number.

  ## Tables / Columns Updated
  - seeds: short_description, problem, solution, target_customer,
    revenue_model, financial_estimates, why_it_works, risks,
    best_markets, quick_start_steps
  - idea_library: problem_ar, solution_ar, target_market_ar,
    revenue_model_ar, why_now_ar, challenge_ar

  ## Notes
  - Arabic-Indic digits (٠-٩) and ASCII digits (0-9) are both covered.
  - "ريالاً" (with tanwin fathah) is also handled via `ريالاً?` pattern.
  - No data is deleted; this is a pure text transformation.
*/

CREATE OR REPLACE FUNCTION pg_temp.replace_rial(t text)
RETURNS text
LANGUAGE plpgsql AS $$
BEGIN
  IF t IS NULL THEN RETURN NULL; END IF;
  -- Pass 1: NUMBER ريال(اً?) → $NUMBER
  t := regexp_replace(t, '([٠-٩0-9][٠-٩0-9,\.]*)\s*ريالاً?', '$\1', 'g');
  -- Pass 2: any remaining ريال(اً?) → $
  t := regexp_replace(t, 'ريالاً?', '$', 'g');
  RETURN t;
END;
$$;

-- ─── seeds table ─────────────────────────────────────────────────────────────
UPDATE seeds SET
  short_description   = pg_temp.replace_rial(short_description),
  problem             = pg_temp.replace_rial(problem),
  solution            = pg_temp.replace_rial(solution),
  target_customer     = pg_temp.replace_rial(target_customer),
  revenue_model       = pg_temp.replace_rial(revenue_model),
  financial_estimates = pg_temp.replace_rial(financial_estimates),
  why_it_works        = pg_temp.replace_rial(why_it_works),
  risks               = pg_temp.replace_rial(risks),
  best_markets        = pg_temp.replace_rial(best_markets),
  quick_start_steps   = pg_temp.replace_rial(quick_start_steps),
  updated_at          = now();

-- ─── idea_library table ──────────────────────────────────────────────────────
UPDATE idea_library SET
  problem_ar        = pg_temp.replace_rial(problem_ar),
  solution_ar       = pg_temp.replace_rial(solution_ar),
  target_market_ar  = pg_temp.replace_rial(target_market_ar),
  revenue_model_ar  = pg_temp.replace_rial(revenue_model_ar),
  why_now_ar        = pg_temp.replace_rial(why_now_ar),
  challenge_ar      = pg_temp.replace_rial(challenge_ar),
  updated_at        = now();
