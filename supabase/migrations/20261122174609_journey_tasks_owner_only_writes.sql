/*
  # journey_tasks: only the owner can change their own tasks

  Before: a policy "Public can update journey tasks" (UPDATE, USING true) applied to the
  public role, and the anon role held INSERT / UPDATE / DELETE on the table. Anyone with
  the public anon key could tick, untick or overwrite the weekly tasks and notes of ANY
  founder. Those notes feed the Readiness Score (a week counts once its main task is done
  and 30+ characters are written) and the AI coach.

  After:
    - the "Public can update journey tasks" policy is dropped;
    - "Users can update own journey tasks": UPDATE for authenticated, USING and WITH CHECK
      both require that the task belongs to an idea the caller owns (same shape as the
      existing owner policies for SELECT / INSERT / DELETE on this table);
    - INSERT, UPDATE and DELETE are revoked from anon.

  The app only writes journey_tasks as a signed-in founder (tick a task, save notes), so
  nothing it does changes.

  Rollback:
    DROP POLICY IF EXISTS "Users can update own journey tasks" ON public.journey_tasks;
    CREATE POLICY "Public can update journey tasks" ON public.journey_tasks FOR UPDATE USING (true);
    GRANT INSERT, UPDATE, DELETE ON public.journey_tasks TO anon;
*/

DROP POLICY IF EXISTS "Public can update journey tasks" ON public.journey_tasks;

DROP POLICY IF EXISTS "Users can update own journey tasks" ON public.journey_tasks;
CREATE POLICY "Users can update own journey tasks"
  ON public.journey_tasks
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_ideas i
     WHERE i.id = journey_tasks.user_idea_id
       AND i.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_ideas i
     WHERE i.id = journey_tasks.user_idea_id
       AND i.user_id = auth.uid()
  ));

REVOKE INSERT, UPDATE, DELETE ON public.journey_tasks FROM anon;
