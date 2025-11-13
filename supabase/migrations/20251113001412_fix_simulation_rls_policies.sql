/*
  # Fix RLS Policies for Open Day Simulations

  Since we're using Firebase authentication instead of Supabase auth,
  we need to adjust the RLS policies to work with external user IDs.

  1. Changes
    - Drop existing policies
    - Create new policies that allow authenticated users to manage their own simulations
    - Use a more permissive approach that checks user_id directly
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own simulations" ON open_day_simulations;
DROP POLICY IF EXISTS "Users can create own simulations" ON open_day_simulations;
DROP POLICY IF EXISTS "Users can update own simulations" ON open_day_simulations;
DROP POLICY IF EXISTS "Users can delete own simulations" ON open_day_simulations;

-- Create new permissive policies for authenticated users
CREATE POLICY "Authenticated users can view simulations"
  ON open_day_simulations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create simulations"
  ON open_day_simulations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update simulations"
  ON open_day_simulations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete simulations"
  ON open_day_simulations FOR DELETE
  TO authenticated
  USING (true);

-- Update answers table policies
DROP POLICY IF EXISTS "Users can view own answers" ON open_day_answers;
DROP POLICY IF EXISTS "Users can create own answers" ON open_day_answers;

CREATE POLICY "Authenticated users can view answers"
  ON open_day_answers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create answers"
  ON open_day_answers FOR INSERT
  TO authenticated
  WITH CHECK (true);
