/*
  # Create system control table

  1. New Tables
    - `system_control`
      - `id` (text, primary key) - Always 'status' for singleton pattern
      - `features` (jsonb) - Feature flags: chat, quiz, englishTest, profileEdit, openDayModule
      - `announcement` (jsonb) - Announcement object: active, message, type, timestamp
      - `updated_by` (uuid) - References users table (governor who made changes)
      - `updated_at` (timestamptz) - Last update timestamp
      - `created_at` (timestamptz) - Initial creation timestamp

  2. Security
    - Enable RLS on `system_control` table
    - All authenticated users can read
    - Only governors can write

  3. Initial Data
    - Insert default status with all features enabled
*/

CREATE TABLE IF NOT EXISTS system_control (
  id text PRIMARY KEY DEFAULT 'status',
  features jsonb NOT NULL DEFAULT '{
    "chat": true,
    "quiz": true,
    "englishTest": true,
    "profileEdit": true,
    "openDayModule": true
  }'::jsonb,
  announcement jsonb NOT NULL DEFAULT '{
    "active": false,
    "message": "",
    "type": "info",
    "timestamp": null
  }'::jsonb,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT system_control_id_check CHECK (id = 'status')
);

ALTER TABLE system_control ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read system control
CREATE POLICY "Anyone can read system control"
  ON system_control FOR SELECT
  TO authenticated
  USING (true);

-- Only governors can update system control
CREATE POLICY "Governors can update system control"
  ON system_control FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'governor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'governor'
    )
  );

-- Only governors can insert system control (for initial setup)
CREATE POLICY "Governors can insert system control"
  ON system_control FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'governor'
    )
  );

-- Insert initial system control record
INSERT INTO system_control (id, features, announcement)
VALUES (
  'status',
  '{
    "chat": true,
    "quiz": true,
    "englishTest": true,
    "profileEdit": true,
    "openDayModule": true
  }'::jsonb,
  '{
    "active": false,
    "message": "",
    "type": "info",
    "timestamp": null
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_system_control_updated_at ON system_control(updated_at);
