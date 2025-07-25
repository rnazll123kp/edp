/*
  # Educational Notes Platform Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `access` (boolean, default false)
      - `is_admin` (boolean, default false)
      - `created_at` (timestamp)
    - `subjects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, optional)
      - `created_at` (timestamp)
    - `notes`
      - `id` (uuid, primary key)
      - `subject_id` (uuid, foreign key)
      - `title` (text)
      - `pdf_url` (text)
      - `created_at` (timestamp)
    - `videos`
      - `id` (uuid, primary key)
      - `subject_id` (uuid, foreign key)
      - `title` (text)
      - `youtube_url` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control
    - Create trigger for automatic user profile creation

  3. Sample Data
    - Add sample subjects, notes, and videos for testing
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  access boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  pdf_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  youtube_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Enable insert for service role" ON users;

DROP POLICY IF EXISTS "Authenticated users can read subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;

DROP POLICY IF EXISTS "Users with access can read notes" ON notes;
DROP POLICY IF EXISTS "Admins can manage notes" ON notes;

DROP POLICY IF EXISTS "Users with access can read videos" ON videos;
DROP POLICY IF EXISTS "Admins can manage videos" ON videos;

-- Users table policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Allow service role to insert users (for the trigger)
CREATE POLICY "Enable insert for service role"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Subjects table policies
CREATE POLICY "Authenticated users can read subjects"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage subjects"
  ON subjects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Notes table policies
CREATE POLICY "Users with access can read notes"
  ON notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.access = true
    )
  );

CREATE POLICY "Admins can manage notes"
  ON notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Videos table policies
CREATE POLICY "Users with access can read videos"
  ON videos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.access = true
    )
  );

CREATE POLICY "Admins can manage videos"
  ON videos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, access, is_admin)
  VALUES (NEW.id, NEW.email, false, false);
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Insert sample data
INSERT INTO subjects (name, description) VALUES
  ('Mathematics', 'Advanced mathematical concepts and problem solving'),
  ('Physics', 'Classical and modern physics principles'),
  ('Computer Science', 'Programming, algorithms, and software development'),
  ('Chemistry', 'Organic and inorganic chemistry fundamentals')
ON CONFLICT DO NOTHING;

-- Get subject IDs for sample data
DO $$
DECLARE
  math_id uuid;
  physics_id uuid;
  cs_id uuid;
  chem_id uuid;
BEGIN
  SELECT id INTO math_id FROM subjects WHERE name = 'Mathematics' LIMIT 1;
  SELECT id INTO physics_id FROM subjects WHERE name = 'Physics' LIMIT 1;
  SELECT id INTO cs_id FROM subjects WHERE name = 'Computer Science' LIMIT 1;
  SELECT id INTO chem_id FROM subjects WHERE name = 'Chemistry' LIMIT 1;

  -- Insert sample notes
  INSERT INTO notes (subject_id, title, pdf_url) VALUES
    (math_id, 'Calculus Fundamentals', 'https://example.com/calculus.pdf'),
    (math_id, 'Linear Algebra Basics', 'https://example.com/linear-algebra.pdf'),
    (physics_id, 'Quantum Mechanics Introduction', 'https://example.com/quantum.pdf'),
    (physics_id, 'Thermodynamics Principles', 'https://example.com/thermo.pdf'),
    (cs_id, 'Data Structures and Algorithms', 'https://example.com/dsa.pdf'),
    (cs_id, 'Object-Oriented Programming', 'https://example.com/oop.pdf'),
    (chem_id, 'Organic Chemistry Reactions', 'https://example.com/organic.pdf'),
    (chem_id, 'Chemical Bonding Theory', 'https://example.com/bonding.pdf')
  ON CONFLICT DO NOTHING;

  -- Insert sample videos
  INSERT INTO videos (subject_id, title, youtube_url) VALUES
    (math_id, 'Calculus Explained', 'https://www.youtube.com/watch?v=WUvTyaaNkzM'),
    (math_id, 'Linear Algebra Visualization', 'https://www.youtube.com/watch?v=fNk_zzaMoSs'),
    (physics_id, 'Quantum Physics Overview', 'https://www.youtube.com/watch?v=JhHMJCUmq28'),
    (physics_id, 'Thermodynamics Basics', 'https://www.youtube.com/watch?v=NyOYW07-L5g'),
    (cs_id, 'Algorithms Explained', 'https://www.youtube.com/watch?v=6hfOvs8pY1k'),
    (cs_id, 'Programming Fundamentals', 'https://www.youtube.com/watch?v=zOjov-2OZ0E'),
    (chem_id, 'Organic Chemistry Basics', 'https://www.youtube.com/watch?v=GOBhVLWdqDE'),
    (chem_id, 'Chemical Reactions', 'https://www.youtube.com/watch?v=8kK2zwjRV0M')
  ON CONFLICT DO NOTHING;
END $$;