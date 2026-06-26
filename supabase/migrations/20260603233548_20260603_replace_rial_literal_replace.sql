/*
  # Replace ريال with $ in all seed and idea_library content (literal replace)

  Uses PostgreSQL's built-in replace() function for a direct string
  substitution of the Arabic word "ريال" with "$" across all free-text
  content columns. Also handles "ريالاً" (tanwin form) separately.
*/

UPDATE seeds SET
  short_description   = replace(replace(short_description,   'ريالاً', '$'), 'ريال', '$'),
  problem             = replace(replace(problem,             'ريالاً', '$'), 'ريال', '$'),
  solution            = replace(replace(solution,            'ريالاً', '$'), 'ريال', '$'),
  target_customer     = replace(replace(target_customer,     'ريالاً', '$'), 'ريال', '$'),
  revenue_model       = replace(replace(revenue_model,       'ريالاً', '$'), 'ريال', '$'),
  financial_estimates = replace(replace(financial_estimates, 'ريالاً', '$'), 'ريال', '$'),
  why_it_works        = replace(replace(why_it_works,        'ريالاً', '$'), 'ريال', '$'),
  risks               = replace(replace(risks,               'ريالاً', '$'), 'ريال', '$'),
  best_markets        = replace(replace(best_markets,        'ريالاً', '$'), 'ريال', '$'),
  quick_start_steps   = replace(replace(quick_start_steps,   'ريالاً', '$'), 'ريال', '$'),
  updated_at          = now();

UPDATE idea_library SET
  problem_ar       = replace(replace(problem_ar,       'ريالاً', '$'), 'ريال', '$'),
  solution_ar      = replace(replace(solution_ar,      'ريالاً', '$'), 'ريال', '$'),
  target_market_ar = replace(replace(target_market_ar, 'ريالاً', '$'), 'ريال', '$'),
  revenue_model_ar = replace(replace(revenue_model_ar, 'ريالاً', '$'), 'ريال', '$'),
  why_now_ar       = replace(replace(why_now_ar,       'ريالاً', '$'), 'ريال', '$'),
  challenge_ar     = replace(replace(challenge_ar,     'ريالاً', '$'), 'ريال', '$'),
  updated_at       = now();
