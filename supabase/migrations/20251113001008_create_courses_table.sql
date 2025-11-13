/*
  # Create courses table

  1. New Tables
    - `courses`
      - `id` (uuid, primary key) - Unique course identifier
      - `title` (text) - Course title
      - `description` (text) - Course description
      - `instructor` (text) - Instructor name
      - `thumbnail` (text) - Course thumbnail URL
      - `duration` (text) - Course duration
      - `level` (text) - Course level (beginner/intermediate/advanced)
      - `plan` (text) - Required plan (free/pro/vip)
      - `category` (text) - Course category
      - `lessons` (integer) - Number of lessons
      - `coach_id` (uuid, foreign key) - References users table (coach who created the course)
      - `created_at` (timestamptz) - Course creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `courses` table
    - Add policy for authenticated users to read courses
    - Add policy for coaches to create/update/delete their own courses
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  instructor text NOT NULL,
  thumbnail text NOT NULL,
  duration text NOT NULL,
  level text NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  plan text NOT NULL CHECK (plan IN ('free', 'pro', 'vip')),
  category text NOT NULL CHECK (category IN ('grooming', 'service', 'safety', 'interview', 'language')),
  lessons integer NOT NULL DEFAULT 1,
  coach_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Coaches can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'mentor'
    )
  );

CREATE POLICY "Coaches can update own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own courses"
  ON courses FOR DELETE
  TO authenticated
  USING (coach_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_courses_coach_id ON courses(coach_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_plan ON courses(plan);
