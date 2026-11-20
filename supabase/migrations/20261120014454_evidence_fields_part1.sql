/*
  # Evidence fields, part 1: who / proof_url / next_step on validation_entries
  # + a CHECK on validation_entries.type

  Three nullable columns so a founder can say WHO a piece of customer evidence came
  from, link to proof, and note the follow-up. Part 2 (a later migration, after the
  UI is live) will make compute_idea_score count only entries that have a `who`.
  This file does NOT touch compute_idea_score or any score formula.

    who        text, up to 120 characters
    proof_url  text, up to 500 characters, must start with http:// or https://
    next_step  text, up to 200 characters

  All nullable, so existing rows and older clients (which send none of these) keep
  working unchanged. The existing RLS already lets an owner INSERT / UPDATE / DELETE
  entries on their own ideas ("Users can update own validation entries"), so no policy
  change is needed.

  Type clean-up. The tracker no longer offers "Other", and the table had no CHECK on
  `type`. The one live row with type 'other' is not customer evidence: its notes are an
  AI first read ("اختبار الفكرة — درجة الذكاء الاصطناعي: 6/10 …") that was logged before
  the 'stress_test' type existed. It is filed as 'stress_test', which the score ignores,
  not as 'observation', which would count it as evidence. Any other 'other' row (none
  today) becomes 'observation'. Then the CHECK allows only the five real types.

  Rollback:
    ALTER TABLE public.validation_entries
      DROP CONSTRAINT IF EXISTS validation_entries_type_check,
      DROP COLUMN IF EXISTS who,
      DROP COLUMN IF EXISTS proof_url,
      DROP COLUMN IF EXISTS next_step;
    (The type change of the one row is not reversed.)
*/

-- 1. Data: retire the 'other' type.
UPDATE public.validation_entries
   SET type = 'stress_test'
 WHERE type = 'other' AND notes LIKE 'اختبار الفكرة%';

UPDATE public.validation_entries
   SET type = 'observation'
 WHERE type = 'other';

ALTER TABLE public.validation_entries
  ADD COLUMN IF NOT EXISTS who       text,
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS next_step text;

ALTER TABLE public.validation_entries
  ADD CONSTRAINT validation_entries_who_len
    CHECK (who IS NULL OR char_length(who) <= 120),
  ADD CONSTRAINT validation_entries_proof_url_fmt
    CHECK (proof_url IS NULL OR (char_length(proof_url) <= 500 AND proof_url ~ '^https?://')),
  ADD CONSTRAINT validation_entries_next_step_len
    CHECK (next_step IS NULL OR char_length(next_step) <= 200);

ALTER TABLE public.validation_entries
  ADD CONSTRAINT validation_entries_type_check
    CHECK (type IN ('interview', 'observation', 'signup', 'preorder', 'stress_test'));
