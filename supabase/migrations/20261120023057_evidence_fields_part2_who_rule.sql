/*
  # Evidence fields, part 2: only entries with a Who count toward the score

  Part 1 (20261120014454) added who / proof_url / next_step to validation_entries.
  This changes compute_idea_score so that a validation entry counts only if it is
  not a 'stress_test' AND has a Who of at least 3 characters:

      char_length(btrim(coalesce(who, ''))) >= 3

  That one filter drives the "said" points, the "did" points, real_entries,
  strong_entries and the evidence minimum (5 counted entries, at least 1 of them a
  sign-up or pre-order). Nothing else changes: signature, SECURITY DEFINER,
  search_path, grants, the model / financials / journey maths and the caps are as
  before. The dead 'other' weight is dropped (the type no longer exists: part 1
  added validation_entries_type_check).

  Entries logged before the Who field existed have no Who, so they stop counting until
  the founder adds one (the tracker shows a chip for that).

  Every idea is recomputed at the end. takeoff_ready_at is never cleared by a
  recompute, and the marketplace gate only runs when in_marketplace turns on, so an
  already-listed idea stays listed.

  Rollback: re-run the body from 20261116011724_readiness_score_v2_and_marketplace_gate.sql
  (with the 'other' weight) and recompute every idea.
*/

CREATE OR REPLACE FUNCTION public.compute_idea_score(p_idea uuid)
 RETURNS TABLE(evidence smallint, model smallint, financials smallint, journey numeric, total integer, evidence_min boolean, real_entries integer, strong_entries integer, canvas_blocks integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH ev AS (
    SELECT count(*)::int AS real_n,
           count(*) FILTER (WHERE lower(type) IN ('signup', 'preorder'))::int AS strong_n,
           coalesce(sum(
             CASE lower(type)
               WHEN 'interview'   THEN 3
               WHEN 'observation' THEN 2
               ELSE 0
             END * m.mult
           ), 0) AS raw_said,
           coalesce(sum(
             CASE lower(type)
               WHEN 'preorder' THEN 10
               WHEN 'signup'   THEN 6
               ELSE 0
             END * m.mult
           ), 0) AS raw_did
      FROM public.validation_entries e
     CROSS JOIN LATERAL (
       SELECT CASE lower(coalesce(e.sentiment, 'neutral'))
                WHEN 'positive' THEN 1.0
                WHEN 'negative' THEN 0.4
                ELSE 0.7
              END AS mult
     ) m
     WHERE e.user_idea_id = p_idea
       AND lower(coalesce(e.type, '')) <> 'stress_test'
       AND char_length(btrim(coalesce(e.who, ''))) >= 3
  ),
  cv AS (
    SELECT (char_length(coalesce(key_partners, ''))           >= 20)::int
         + (char_length(coalesce(key_activities, ''))         >= 20)::int
         + (char_length(coalesce(value_proposition, ''))      >= 20)::int
         + (char_length(coalesce(customer_relationships, '')) >= 20)::int
         + (char_length(coalesce(customer_segments, ''))      >= 20)::int
         + (char_length(coalesce(key_resources, ''))          >= 20)::int
         + (char_length(coalesce(channels, ''))               >= 20)::int
         + (char_length(coalesce(cost_structure, ''))         >= 20)::int
         + (char_length(coalesce(revenue_streams, ''))        >= 20)::int AS blocks,
           (coalesce(monthly_revenue, 0)  > 0)::int * 5
         + (coalesce(monthly_costs, 0)    > 0)::int * 5
         + (coalesce(break_even_month, 0) > 0)::int * 5 AS fin
      FROM public.canvas_data
     WHERE user_idea_id = p_idea
  ),
  jt AS (
    SELECT count(DISTINCT week_number)::int AS weeks
      FROM public.journey_tasks
     WHERE user_idea_id = p_idea
       AND task_key = 'main'
       AND is_completed
       AND week_number BETWEEN 1 AND 12
       AND char_length(btrim(coalesce(notes, ''))) >= 30
  ),
  p AS (
    SELECT (least(25, round(ev.raw_said)) + least(25, round(ev.raw_did)))::smallint AS evidence,
           round(coalesce((SELECT blocks FROM cv), 0) / 9.0 * 20)::smallint  AS model,
           coalesce((SELECT fin FROM cv), 0)::smallint                       AS financials,
           least(15, jt.weeks * 1.25)::numeric                               AS journey,
           ev.real_n,
           ev.strong_n,
           coalesce((SELECT blocks FROM cv), 0)::int                         AS blocks
      FROM ev, jt
  )
  SELECT p.evidence,
         p.model,
         p.financials,
         p.journey,
         least(100, round(p.evidence + p.model + p.financials + p.journey))::int,
         (p.real_n >= 5 AND p.strong_n >= 1),
         p.real_n,
         p.strong_n,
         p.blocks
    FROM p;
$function$;

-- Recompute every idea with the new rule.
SELECT public.recompute_idea_score(id) FROM public.user_ideas;
