/*
  # Readiness Score v2 (مؤشر الجاهزية) + server-side marketplace gate

  Ported from IdeaIQ's Readiness Score v2 (part A). Until now Bethra's score
  (user_ideas.iq_score, 0-100) was computed in the browser and written by the idea's
  owner, so it could be set to anything; the marketplace gate trusted that value and
  the founder could set it in one UPDATE and list in the next. It also gave 15 points
  to an AI-Coach opinion and counted journey sub-tasks ticked with no written finding.
  This moves the score into the database and changes the formula.

  Formula (parts sum to 100; coach weight is 0):
    Customer evidence  50  validation_entries excluding type 'stress_test', in two
                           halves so talking alone cannot max it out:
                             what people said   (cap 25): interview 3, observation 2,
                                                          other 1
                             what people did    (cap 25): preorder 10, signup 6
                           any other type 0; each entry times sentiment positive 1 /
                           neutral 0.7 / negative 0.4 (NULL sentiment = neutral); each
                           half is summed, rounded, then capped at 25.
    Business model     20  canvas blocks with >= 20 characters, out of 9.
    Financials         15  5 each for monthly revenue, monthly costs, break-even month
                           greater than 0.
    90-Day Journey     15  1.25 per week (1-12) whose MAIN task is completed AND has
                           >= 30 characters of notes. Sub-tasks score nothing. Stored as
                           a decimal; only the total is rounded.
    AI Coach            0  coach_assessment / _note stay as an AI opinion comment.

  Evidence minimum (provisional rule): >= 5 customer evidence entries AND >= 1 sign-up
  or pre-order. Entries of an unrecognised type count toward the 5 but score 0.

  The take-off moment (takeoff_ready_at) and a marketplace listing both need
  score >= 80 AND the evidence minimum.

  NOT in this file (phase 2): the "named source" rule (Who of 3+ characters), which
  needs the who / proof_url / next_step columns and UI first.

  What this file does
    1. Adds per-part columns to user_ideas.
    2. compute_idea_score(idea): pure read, returns the parts.
    3. recompute_idea_score(idea): stores them (also iq_breakdown, see below) and
       stamps takeoff_ready_at once.
    4. AFTER triggers on validation_entries, canvas_data, journey_tasks recompute.
    5. Guard trigger on user_ideas: for anon/authenticated, server-owned columns keep
       their server values whatever the client sends. Silent on purpose, so browser
       tabs still running the old bundle keep working. A later migration can replace
       this with column privileges.
    6. enforce_marketplace_gate() computes the score itself instead of trusting
       NEW.iq_score, and requires canvas >= 7 of 9, the evidence minimum, financials
       and a score >= 80.
    7. refresh_idea_score(idea): owner-only RPC for the frontend.
    8. validation_entries.sentiment loses its 'positive' default (NULL scores as
       neutral). Existing rows are unchanged.
    9. Backfills every idea.

  iq_breakdown (jsonb) is kept for the investor idea page, which still reads it. It is
  now written by the server as
    { evidence, model, financials, journey, total, evidenceMinMet,
      validation: <same as evidence>, coach: 0 }
  The two legacy keys keep the old page from breaking until the frontend moves to the
  new keys; its bars will be on the wrong scale until then (evidence is out of 50).

  Rollback
    DROP TRIGGER IF EXISTS trg_score_validation_entries ON public.validation_entries;
    DROP TRIGGER IF EXISTS trg_score_canvas_data ON public.canvas_data;
    DROP TRIGGER IF EXISTS trg_score_journey_tasks ON public.journey_tasks;
    DROP TRIGGER IF EXISTS a_user_ideas_protect_server_columns ON public.user_ideas;
    DROP FUNCTION IF EXISTS public.refresh_idea_score(uuid);
    DROP FUNCTION IF EXISTS public.trg_recompute_idea_score();
    DROP FUNCTION IF EXISTS public.user_ideas_protect_server_columns();
    -- restore enforce_marketplace_gate() to the old body (iq_score >= 80 and not raised
    -- in the same UPDATE): see 20261115210000 header comment / git history of this file.
    DROP FUNCTION IF EXISTS public.recompute_idea_score(uuid);
    DROP FUNCTION IF EXISTS public.compute_idea_score(uuid);
    ALTER TABLE public.validation_entries ALTER COLUMN sentiment SET DEFAULT 'positive';
    -- the score_* columns can stay; the old frontend ignores them.
*/

-- ── 1. per-part columns ──────────────────────────────────────────────────────
ALTER TABLE public.user_ideas
  ADD COLUMN IF NOT EXISTS score_evidence    smallint     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_model       smallint     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_financials  smallint     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_journey     numeric(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS evidence_min_met  boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS score_computed_at timestamptz;

-- ── 8. sentiment: no default; NULL is scored as neutral ──────────────────────
ALTER TABLE public.validation_entries ALTER COLUMN sentiment DROP DEFAULT;

-- ── 2. pure computation (reads only) ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_idea_score(p_idea uuid)
RETURNS TABLE (
  evidence       smallint,
  model          smallint,
  financials     smallint,
  journey        numeric,
  total          integer,
  evidence_min   boolean,
  real_entries   integer,
  strong_entries integer,
  canvas_blocks  integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH ev AS (
    SELECT count(*)::int AS real_n,
           count(*) FILTER (WHERE lower(type) IN ('signup', 'preorder'))::int AS strong_n,
           -- what people said: interviews, observations, other notes
           coalesce(sum(
             CASE lower(type)
               WHEN 'interview'   THEN 3
               WHEN 'observation' THEN 2
               WHEN 'other'       THEN 1
               ELSE 0
             END * m.mult
           ), 0) AS raw_said,
           -- what people did: sign-ups and pre-orders
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
$$;
REVOKE ALL ON FUNCTION public.compute_idea_score(uuid) FROM PUBLIC, anon, authenticated;

-- ── 3. compute + store, and stamp the one-time take-off ──────────────────────
CREATE OR REPLACE FUNCTION public.recompute_idea_score(p_idea uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r record;
BEGIN
  IF p_idea IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO r FROM public.compute_idea_score(p_idea);

  UPDATE public.user_ideas i
     SET iq_score          = r.total,
         score_evidence    = r.evidence,
         score_model       = r.model,
         score_financials  = r.financials,
         score_journey     = r.journey,
         evidence_min_met  = r.evidence_min,
         score_computed_at = now(),
         iq_breakdown      = jsonb_build_object(
                               'evidence',       r.evidence,
                               'model',          r.model,
                               'financials',     r.financials,
                               'journey',        r.journey,
                               'total',          r.total,
                               'evidenceMinMet', r.evidence_min,
                               'validation',     r.evidence,
                               'coach',          0
                             ),
         -- Stamped once, the first time the idea qualifies; never cleared here.
         takeoff_ready_at  = CASE
           WHEN i.takeoff_ready_at IS NULL
                AND i.takeoff_celebrated_at IS NULL
                AND r.total >= 80
                AND r.evidence_min
           THEN now()
           ELSE i.takeoff_ready_at
         END
   WHERE i.id = p_idea;
END;
$$;
REVOKE ALL ON FUNCTION public.recompute_idea_score(uuid) FROM PUBLIC, anon, authenticated;

-- ── 4. keep the score fresh ──────────────────────────────────────────────────
-- SECURITY DEFINER so the founder's write to an evidence / canvas / journey row can
-- update the score columns they are not allowed to write themselves.
CREATE OR REPLACE FUNCTION public.trg_recompute_idea_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recompute_idea_score(NEW.user_idea_id);
  ELSIF TG_OP = 'DELETE' THEN
    -- When the idea itself is being deleted (cascade) this updates no rows.
    PERFORM public.recompute_idea_score(OLD.user_idea_id);
  ELSE
    PERFORM public.recompute_idea_score(NEW.user_idea_id);
    IF NEW.user_idea_id IS DISTINCT FROM OLD.user_idea_id THEN
      PERFORM public.recompute_idea_score(OLD.user_idea_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.trg_recompute_idea_score() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_score_validation_entries
  AFTER INSERT OR UPDATE OR DELETE ON public.validation_entries
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_idea_score();

CREATE OR REPLACE TRIGGER trg_score_canvas_data
  AFTER INSERT OR UPDATE OR DELETE ON public.canvas_data
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_idea_score();

CREATE OR REPLACE TRIGGER trg_score_journey_tasks
  AFTER INSERT OR UPDATE OR DELETE ON public.journey_tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_idea_score();

-- ── 5. clients cannot set server-owned columns ───────────────────────────────
-- Applies only to anon / authenticated. service_role, postgres and the SECURITY
-- DEFINER functions above run as other roles and pass straight through.
-- The trigger name sorts before trg_enforce_marketplace_gate, so it fires first.
CREATE OR REPLACE FUNCTION public.user_ideas_protect_server_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.iq_score              := 0;
    NEW.iq_breakdown          := NULL;
    NEW.score_evidence        := 0;
    NEW.score_model           := 0;
    NEW.score_financials      := 0;
    NEW.score_journey         := 0;
    NEW.evidence_min_met      := false;
    NEW.score_computed_at     := NULL;
    NEW.coach_assessment      := NULL;
    NEW.coach_assessment_note := NULL;
    NEW.coach_assessment_at   := NULL;
    NEW.takeoff_ready_at      := NULL;
    NEW.takeoff_celebrated_at := NULL;
  ELSE
    NEW.iq_score              := OLD.iq_score;
    NEW.iq_breakdown          := OLD.iq_breakdown;
    NEW.score_evidence        := OLD.score_evidence;
    NEW.score_model           := OLD.score_model;
    NEW.score_financials      := OLD.score_financials;
    NEW.score_journey         := OLD.score_journey;
    NEW.evidence_min_met      := OLD.evidence_min_met;
    NEW.score_computed_at     := OLD.score_computed_at;
    NEW.coach_assessment      := OLD.coach_assessment;
    NEW.coach_assessment_note := OLD.coach_assessment_note;
    NEW.coach_assessment_at   := OLD.coach_assessment_at;
    NEW.takeoff_ready_at      := OLD.takeoff_ready_at;
    NEW.user_id               := OLD.user_id;
    NEW.created_at            := OLD.created_at;
    -- takeoff_celebrated_at stays founder-writable (the dashboard marks it shown).
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.user_ideas_protect_server_columns() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER a_user_ideas_protect_server_columns
  BEFORE INSERT OR UPDATE ON public.user_ideas
  FOR EACH ROW EXECUTE FUNCTION public.user_ideas_protect_server_columns();

-- ── 6. marketplace gate ──────────────────────────────────────────────────────
-- Replaces the old gate, which read NEW.iq_score (a client-writable column) and only
-- blocked changing it in the same UPDATE that flips in_marketplace. The existing
-- trigger trg_enforce_marketplace_gate keeps pointing at this function name.
CREATE OR REPLACE FUNCTION public.enforce_marketplace_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r         record;
  v_has_fin boolean := false;
BEGIN
  IF NEW.in_marketplace = true
     AND (TG_OP = 'INSERT' OR OLD.in_marketplace IS DISTINCT FROM true) THEN

    SELECT * INTO r FROM public.compute_idea_score(NEW.id);

    SELECT coalesce(c.monthly_revenue, 0) <> 0 AND coalesce(c.monthly_costs, 0) <> 0
      INTO v_has_fin
      FROM public.canvas_data c
     WHERE c.user_idea_id = NEW.id;

    IF r.canvas_blocks < 7 THEN
      RAISE EXCEPTION 'لا يمكن النشر في سوق المستثمرين: يجب أن يكتمل مخطط نموذج العمل بنسبة 70%% على الأقل (المكتمل حالياً % من 9 خانات).', r.canvas_blocks
        USING ERRCODE = 'check_violation', HINT = 'IDEA_NOT_READY_FOR_MARKETPLACE';
    END IF;
    IF NOT r.evidence_min THEN
      RAISE EXCEPTION 'لا يمكن النشر في سوق المستثمرين: سجّل 5 أدلة عملاء على الأقل بينها تسجيل اهتمام أو طلب مسبق واحد على الأقل (لديك حالياً % دليلاً و% تسجيل/طلب مسبق).', r.real_entries, r.strong_entries
        USING ERRCODE = 'check_violation', HINT = 'IDEA_NOT_READY_FOR_MARKETPLACE';
    END IF;
    IF NOT coalesce(v_has_fin, false) THEN
      RAISE EXCEPTION 'لا يمكن النشر في سوق المستثمرين: أكمل التوقعات المالية (الإيراد الشهري والتكاليف الشهرية) أولاً.'
        USING ERRCODE = 'check_violation', HINT = 'IDEA_NOT_READY_FOR_MARKETPLACE';
    END IF;
    IF r.total < 80 THEN
      RAISE EXCEPTION 'لا يمكن النشر في سوق المستثمرين: يجب أن يبلغ مؤشر الجاهزية 80 أو أكثر (مؤشرك الحالي %).', r.total
        USING ERRCODE = 'check_violation', HINT = 'IDEA_NOT_READY_FOR_MARKETPLACE';
    END IF;

    -- The row is listed with the score that was just checked.
    NEW.iq_score          := r.total;
    NEW.score_evidence    := r.evidence;
    NEW.score_model       := r.model;
    NEW.score_financials  := r.financials;
    NEW.score_journey     := r.journey;
    NEW.evidence_min_met  := r.evidence_min;
    NEW.score_computed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- ── 7. frontend entry point ──────────────────────────────────────────────────
-- Owner only (auth.uid()). Returns NULL for anyone else, including callers with no
-- user (anon, service role): they have no reason to call it.
CREATE OR REPLACE FUNCTION public.refresh_idea_score(p_idea uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_ideas WHERE id = p_idea AND user_id = auth.uid()
  ) THEN
    RETURN NULL;
  END IF;

  PERFORM public.recompute_idea_score(p_idea);

  SELECT jsonb_build_object(
           'score',            i.iq_score,
           'evidence',         i.score_evidence,
           'model',            i.score_model,
           'financials',       i.score_financials,
           'journey',          i.score_journey,
           'evidence_min_met', i.evidence_min_met,
           'takeoff_ready',    i.takeoff_ready_at IS NOT NULL AND i.takeoff_celebrated_at IS NULL
         )
    INTO v
    FROM public.user_ideas i
   WHERE i.id = p_idea;

  RETURN v;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_idea_score(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_idea_score(uuid) TO authenticated, service_role;

-- ── 9. backfill ──────────────────────────────────────────────────────────────
SELECT public.recompute_idea_score(id) FROM public.user_ideas;
