/*
  # Create tasks table for 90-day commitment plans

  ## New Tables
  - `tasks`
    - `id` (uuid, primary key, auto-generated)
    - `idea_id` (uuid, FK → ideas.id, cascade delete)
    - `user_id` (uuid, FK → auth.users.id)
    - `title` (text, task description)
    - `week` (integer, 1–12)
    - `status` (text, 'todo' | 'done', default 'todo')
    - `created_at` (timestamptz, default now())

  ## Security
  - RLS enabled; authenticated users can only access their own tasks.

  ## Notes
  - Tasks are created in bulk when a user commits to an idea.
  - Cascade delete ensures tasks are removed if the cloned idea is deleted.
*/

CREATE TABLE IF NOT EXISTS tasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id    uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  week       integer NOT NULL,
  status     text NOT NULL DEFAULT 'todo',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
