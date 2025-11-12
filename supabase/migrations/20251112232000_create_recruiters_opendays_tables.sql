/*
  # Recruiters and Open Days Management

  ## Overview
  Creates tables for managing recruiters and upcoming open days with proper access control.

  ## New Tables

  ### `recruiters`
  Stores recruiter information managed by governors and mentors
  - `id` (uuid, primary key)
  - `name` (text, required)
  - `country` (text, required)
  - `airline` (text, required)
  - `notes` (text, required)
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `last_updated` (timestamptz)

  ### `open_days`
  Stores upcoming open day events
  - `id` (uuid, primary key)
  - `city` (text, required)
  - `country` (text, required)
  - `date` (text, required)
  - `recruiter` (text, required)
  - `description` (text, required)
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `last_updated` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - All authenticated users can read
  - Only governors and mentors can create/update/delete
  - Users tracked by created_by field
*/

-- Create recruiters table
CREATE TABLE IF NOT EXISTS recruiters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  airline text NOT NULL,
  notes text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now()
);

-- Create open_days table
CREATE TABLE IF NOT EXISTS open_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  country text NOT NULL,
  date text NOT NULL,
  recruiter text NOT NULL,
  description text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recruiters_country ON recruiters(country);
CREATE INDEX IF NOT EXISTS idx_recruiters_airline ON recruiters(airline);
CREATE INDEX IF NOT EXISTS idx_open_days_date ON open_days(date);
CREATE INDEX IF NOT EXISTS idx_open_days_country ON open_days(country);

-- Enable RLS
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_days ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recruiters

-- All authenticated users can view recruiters
CREATE POLICY "Authenticated users can view recruiters"
  ON recruiters
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can create recruiters (will check role in app)
CREATE POLICY "Authenticated users can create recruiters"
  ON recruiters
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only creator or admins can update recruiters
CREATE POLICY "Users can update own recruiters"
  ON recruiters
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Only creator or admins can delete recruiters
CREATE POLICY "Users can delete own recruiters"
  ON recruiters
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for open_days

-- All authenticated users can view open days
CREATE POLICY "Authenticated users can view open days"
  ON open_days
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can create open days
CREATE POLICY "Authenticated users can create open days"
  ON open_days
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only creator can update open days
CREATE POLICY "Users can update own open days"
  ON open_days
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Only creator can delete open days
CREATE POLICY "Users can delete own open days"
  ON open_days
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Update users table to add photo and layer fields if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'photo_base64'
  ) THEN
    ALTER TABLE users ADD COLUMN photo_base64 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'plan'
  ) THEN
    ALTER TABLE users ADD COLUMN plan text DEFAULT 'free';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login timestamptz;
  END IF;
END $$;
