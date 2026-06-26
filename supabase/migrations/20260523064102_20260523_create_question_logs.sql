/*
  # Create question_logs table

  1. New Tables
    - `question_logs`
      - `id` (uuid, primary key)
      - `question` (text, the question asked)
      - `user_id` (uuid, nullable foreign key to auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Authenticated users can insert their own questions
    - Admins can read all questions (via is_admin() helper)

  3. Notes
    - user_id is nullable to support anonymous future use
    - No sensitive data stored — only the question text
*/

CREATE TABLE IF NOT EXISTS question_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question   text NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE question_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can log their own questions"
  ON question_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all question logs"
  ON question_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE INDEX IF NOT EXISTS question_logs_created_at_idx ON question_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS question_logs_question_idx ON question_logs (question);
