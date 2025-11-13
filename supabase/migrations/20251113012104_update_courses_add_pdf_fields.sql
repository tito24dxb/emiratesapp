/*
  # Update courses table for PDF support

  1. Changes
    - Add `pdf_url` (text) - Firebase Storage URL for the PDF file
    - Add `pdf_path` (text) - Firebase Storage path for the PDF file
    - Add `allow_download` (boolean) - Whether users can download the PDF
    - Add `content_type` (text) - Type of content (pdf, video, text)
    - Update `updated_at` trigger

  2. Notes
    - PDF files will be stored in Firebase Storage
    - Mentors/Governors control download permissions per course
    - Default content type is 'pdf'
*/

-- Add new columns to courses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE courses ADD COLUMN pdf_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'pdf_path'
  ) THEN
    ALTER TABLE courses ADD COLUMN pdf_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'allow_download'
  ) THEN
    ALTER TABLE courses ADD COLUMN allow_download boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE courses ADD COLUMN content_type text DEFAULT 'pdf' CHECK (content_type IN ('pdf', 'video', 'text'));
  END IF;
END $$;

-- Create index for pdf_path for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_pdf_path ON courses(pdf_path);
