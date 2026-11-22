/*
  # Decision gates (week 4 and week 8)

  After week 4 and week 8 of the 90-day journey the founder makes an explicit call:
  continue, pivot or stop, with a written reason. This stores those calls.

  public.journey_decisions
    - Many rows per idea and gate are allowed; the LATEST row per (idea, gate) is the
      current decision. "Decide again" simply inserts another row.
    - snapshot: the evidence and score as they stood when the founder decided, built
      server-side so it cannot be edited or faked by the client.
    - RLS: the owner can SELECT. Clients have no INSERT / UPDATE / DELETE / TRUNCATE
      (revoked below); rows are only created through the RPC.

  public.record_journey_decision(p_idea, p_gate, p_decision, p_reason)
    - SECURITY DEFINER, search_path = '', EXECUTE for authenticated only.
    - The caller must own the idea.
    - p_gate must be 4 or 8, and that week's main task must be completed.
    - p_decision in (continue, pivot, stop); the reason, trimmed, is 20 to 500 characters.
    - The snapshot holds interviews, observations, signups, preorders, preorder_amount
      (counted with the Who rule: not stress_test, Who of at least 3 characters) plus
      score and evidence_min_met from compute_idea_score. Returns the new row.
    - created_at uses clock_timestamp() so two decisions made in quick succession still
      order correctly.
    - Error messages are in Arabic (they are shown to the founder as they are).

  Nothing else changes: no existing table, policy or score formula is touched. Founders
  who have already finished week 4 or week 8 keep their completed work; the page
  (not this migration) decides what stays open.

  Rollback:
    DROP FUNCTION IF EXISTS public.record_journey_decision(uuid, integer, text, text);
    DROP TABLE IF EXISTS public.journey_decisions;
*/

CREATE TABLE IF NOT EXISTS public.journey_decisions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_idea_id uuid        NOT NULL REFERENCES public.user_ideas(id) ON DELETE CASCADE,
  gate         smallint    NOT NULL CHECK (gate IN (4, 8)),
  decision     text        NOT NULL CHECK (decision IN ('continue', 'pivot', 'stop')),
  reason       text        NOT NULL CHECK (char_length(reason) BETWEEN 20 AND 500),
  snapshot     jsonb       NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journey_decisions_idea_gate_idx
  ON public.journey_decisions (user_idea_id, gate, created_at DESC);

ALTER TABLE public.journey_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can read own journey decisions" ON public.journey_decisions;
CREATE POLICY "Owner can read own journey decisions"
  ON public.journey_decisions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_ideas i
     WHERE i.id = journey_decisions.user_idea_id
       AND i.user_id = auth.uid()
  ));

-- Rows are written only by record_journey_decision.
REVOKE ALL ON TABLE public.journey_decisions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.journey_decisions FROM authenticated;
GRANT SELECT ON TABLE public.journey_decisions TO authenticated;

CREATE OR REPLACE FUNCTION public.record_journey_decision(
  p_idea     uuid,
  p_gate     integer,
  p_decision text,
  p_reason   text
)
 RETURNS public.journey_decisions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid    uuid := auth.uid();
  v_reason text := btrim(coalesce(p_reason, ''));
  v_score  record;
  v_snap   jsonb;
  v_row    public.journey_decisions;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'سجّل الدخول لتسجيل قرار' USING ERRCODE = '42501';
  END IF;

  IF p_idea IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_ideas i WHERE i.id = p_idea AND i.user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'يمكنك تسجيل القرارات على أفكارك أنت فقط' USING ERRCODE = '42501';
  END IF;

  IF p_gate IS NULL OR p_gate NOT IN (4, 8) THEN
    RAISE EXCEPTION 'البوابة يجب أن تكون ٤ أو ٨' USING ERRCODE = '22023';
  END IF;

  IF p_decision IS NULL OR p_decision NOT IN ('continue', 'pivot', 'stop') THEN
    RAISE EXCEPTION 'القرار يجب أن يكون استمراراً أو تغييراً للاتجاه أو إيقافاً' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_reason) < 20 OR char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'اكتب سبباً من ٢٠ إلى ٥٠٠ حرف' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.journey_tasks t
     WHERE t.user_idea_id = p_idea
       AND t.week_number = p_gate
       AND t.task_key = 'main'
       AND t.is_completed
  ) THEN
    RAISE EXCEPTION 'أنجز المهمة الرئيسية للأسبوع % قبل اتخاذ القرار', p_gate
      USING ERRCODE = '55000';
  END IF;

  SELECT * INTO v_score FROM public.compute_idea_score(p_idea);

  SELECT jsonb_build_object(
           'interviews',       count(*) FILTER (WHERE lower(e.type) = 'interview'),
           'observations',     count(*) FILTER (WHERE lower(e.type) = 'observation'),
           'signups',          count(*) FILTER (WHERE lower(e.type) = 'signup'),
           'preorders',        count(*) FILTER (WHERE lower(e.type) = 'preorder'),
           'preorder_amount',  coalesce(sum(e.amount) FILTER (WHERE lower(e.type) = 'preorder'), 0),
           'score',            v_score.total,
           'evidence_min_met', v_score.evidence_min
         )
    INTO v_snap
    FROM public.validation_entries e
   WHERE e.user_idea_id = p_idea
     AND lower(coalesce(e.type, '')) <> 'stress_test'
     AND char_length(btrim(coalesce(e.who, ''))) >= 3;

  INSERT INTO public.journey_decisions (user_idea_id, gate, decision, reason, snapshot, created_at)
  VALUES (p_idea, p_gate::smallint, p_decision, v_reason, v_snap, clock_timestamp())
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_journey_decision(uuid, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_journey_decision(uuid, integer, text, text) TO authenticated;
