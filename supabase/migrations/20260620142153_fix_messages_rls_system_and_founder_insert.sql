-- Drop the overly-restrictive INSERT policy and replace it with one that:
-- 1. Allows connection participants to insert their own messages (sender_id = auth.uid())
-- 2. Allows either participant to insert system messages (is_system_message = true, sender_id IS NULL)
DROP POLICY IF EXISTS "Connection participants can insert messages" ON messages;

CREATE POLICY "Connection participants can insert messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM connections c
      WHERE c.id = messages.connection_id
        AND (c.investor_id = auth.uid() OR c.founder_id = auth.uid())
        AND c.status = 'active'
    )
    AND (
      -- Regular message: sender must be the authenticated user
      (is_system_message IS NOT TRUE AND auth.uid() = sender_id)
      OR
      -- System message: no sender_id required
      (is_system_message = TRUE AND sender_id IS NULL)
    )
  );
