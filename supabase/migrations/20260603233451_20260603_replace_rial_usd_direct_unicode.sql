/*
  # Replace ريال with $ in seed content (direct inline regex)

  Same transformation as the previous migration but using inline
  regexp_replace calls directly in the UPDATE statements, avoiding
  the pg_temp function scope issue.

  Two-pass per column:
  1. NUMBER ريال(اً?) → $NUMBER
  2. Any remaining ريال(اً?) → $
*/

UPDATE seeds SET
  short_description = regexp_replace(
    regexp_replace(short_description, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  problem = regexp_replace(
    regexp_replace(problem, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  solution = regexp_replace(
    regexp_replace(solution, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  target_customer = regexp_replace(
    regexp_replace(target_customer, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  revenue_model = regexp_replace(
    regexp_replace(revenue_model, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  financial_estimates = regexp_replace(
    regexp_replace(financial_estimates, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  why_it_works = regexp_replace(
    regexp_replace(why_it_works, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  risks = regexp_replace(
    regexp_replace(risks, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  best_markets = regexp_replace(
    regexp_replace(best_markets, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  quick_start_steps = regexp_replace(
    regexp_replace(quick_start_steps, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  updated_at = now();

UPDATE idea_library SET
  problem_ar = regexp_replace(
    regexp_replace(problem_ar, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  solution_ar = regexp_replace(
    regexp_replace(solution_ar, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  target_market_ar = regexp_replace(
    regexp_replace(target_market_ar, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  revenue_model_ar = regexp_replace(
    regexp_replace(revenue_model_ar, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  why_now_ar = regexp_replace(
    regexp_replace(why_now_ar, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  challenge_ar = regexp_replace(
    regexp_replace(challenge_ar, E'([\\u0660-\\u0669\\u06F0-\\u06F90-9][\\u0660-\\u0669\\u06F0-\\u06F90-9,\\.]*)[[:space:]]*\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', E'$\\1', 'g'),
    E'\\u0631\\u064A\\u0627\\u0644\\u0627\\u064B?', '$', 'g'),
  updated_at = now();
