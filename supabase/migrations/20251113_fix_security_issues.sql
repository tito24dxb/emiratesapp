-- Fix Security Issues: Indexes and RLS Performance

-- 1. Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender_id ON public.conversation_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2_id ON public.conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender_id ON public.group_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_open_days_created_by ON public.open_days(created_by);
CREATE INDEX IF NOT EXISTS idx_recruiters_created_by ON public.recruiters(created_by);
CREATE INDEX IF NOT EXISTS idx_system_control_updated_by ON public.system_control(updated_by);

-- 2. Fix RLS policies to use (select auth.uid()) for better performance

-- Users table policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Governors can read all users" ON public.users;

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Governors can read all users" ON public.users
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = (SELECT auth.uid())) = 'governor'
  );

-- Group messages policies
DROP POLICY IF EXISTS "Authenticated users can send group messages" ON public.group_messages;

CREATE POLICY "Authenticated users can send group messages" ON public.group_messages
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Conversations policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (
    (SELECT auth.uid()) = participant_1_id OR
    (SELECT auth.uid()) = participant_2_id
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = participant_1_id OR
    (SELECT auth.uid()) = participant_2_id
  );

CREATE POLICY "Users can update their conversations" ON public.conversations
  FOR UPDATE USING (
    (SELECT auth.uid()) = participant_1_id OR
    (SELECT auth.uid()) = participant_2_id
  );

-- Conversation messages policies
DROP POLICY IF EXISTS "Users can read messages in their conversations" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.conversation_messages;

CREATE POLICY "Users can read messages in their conversations" ON public.conversation_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_messages.conversation_id
      AND ((SELECT auth.uid()) = participant_1_id OR (SELECT auth.uid()) = participant_2_id)
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.conversation_messages
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_messages.conversation_id
      AND ((SELECT auth.uid()) = participant_1_id OR (SELECT auth.uid()) = participant_2_id)
    )
  );

-- Open day answers policies
DROP POLICY IF EXISTS "Users can update own answers" ON public.open_day_answers;
DROP POLICY IF EXISTS "Users can delete own answers" ON public.open_day_answers;

CREATE POLICY "Users can update own answers" ON public.open_day_answers
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own answers" ON public.open_day_answers
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Recruiters policies
DROP POLICY IF EXISTS "Authenticated users can create recruiters" ON public.recruiters;
DROP POLICY IF EXISTS "Users can update own recruiters" ON public.recruiters;
DROP POLICY IF EXISTS "Users can delete own recruiters" ON public.recruiters;

CREATE POLICY "Authenticated users can create recruiters" ON public.recruiters
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY "Users can update own recruiters" ON public.recruiters
  FOR UPDATE USING ((SELECT auth.uid()) = created_by);

CREATE POLICY "Users can delete own recruiters" ON public.recruiters
  FOR DELETE USING ((SELECT auth.uid()) = created_by);

-- Open days policies
DROP POLICY IF EXISTS "Authenticated users can create open days" ON public.open_days;
DROP POLICY IF EXISTS "Users can update own open days" ON public.open_days;
DROP POLICY IF EXISTS "Users can delete own open days" ON public.open_days;

CREATE POLICY "Authenticated users can create open days" ON public.open_days
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY "Users can update own open days" ON public.open_days
  FOR UPDATE USING ((SELECT auth.uid()) = created_by);

CREATE POLICY "Users can delete own open days" ON public.open_days
  FOR DELETE USING ((SELECT auth.uid()) = created_by);

-- Courses policies
DROP POLICY IF EXISTS "Coaches can create courses" ON public.courses;
DROP POLICY IF EXISTS "Coaches can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Coaches can delete own courses" ON public.courses;

CREATE POLICY "Coaches can create courses" ON public.courses
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = (SELECT auth.uid())) IN ('mentor', 'governor')
  );

CREATE POLICY "Coaches can update own courses" ON public.courses
  FOR UPDATE USING ((SELECT auth.uid()) = coach_id);

CREATE POLICY "Coaches can delete own courses" ON public.courses
  FOR DELETE USING ((SELECT auth.uid()) = coach_id);

-- System control policies
DROP POLICY IF EXISTS "Governors can update system control" ON public.system_control;
DROP POLICY IF EXISTS "Governors can insert system control" ON public.system_control;

CREATE POLICY "Governors can update system control" ON public.system_control
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = (SELECT auth.uid())) = 'governor'
  );

CREATE POLICY "Governors can insert system control" ON public.system_control
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = (SELECT auth.uid())) = 'governor'
  );

-- 3. Fix function search path
ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public;

-- 4. Remove unused indexes (they will be recreated if needed)
DROP INDEX IF EXISTS idx_system_control_updated_at;
DROP INDEX IF EXISTS idx_group_messages_created_at;
DROP INDEX IF EXISTS idx_conversations_participants;
DROP INDEX IF EXISTS idx_conversation_messages_conversation;
DROP INDEX IF EXISTS idx_simulations_user;
DROP INDEX IF EXISTS idx_simulations_completed;
DROP INDEX IF EXISTS idx_answers_simulation;
DROP INDEX IF EXISTS idx_answers_user;
DROP INDEX IF EXISTS idx_recruiters_country;
DROP INDEX IF EXISTS idx_recruiters_airline;
DROP INDEX IF EXISTS idx_open_days_date;
DROP INDEX IF EXISTS idx_open_days_country;
DROP INDEX IF EXISTS idx_courses_coach_id;
DROP INDEX IF EXISTS idx_courses_category;
DROP INDEX IF EXISTS idx_courses_plan;
DROP INDEX IF EXISTS idx_courses_pdf_path;
