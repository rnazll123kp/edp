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
    - Add policies for authenticated users and admins
    - Create trigger to automatically create user profiles

  3. Sample Data
    - Create sample subjects and content for testing
*/

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL,
  access boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  pdf_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  youtube_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for subjects table
CREATE POLICY "Authenticated users can read subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for notes table
CREATE POLICY "Users with access can read notes" ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND access = true
    )
  );

CREATE POLICY "Admins can manage notes" ON public.notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for videos table
CREATE POLICY "Users with access can read videos" ON public.videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND access = true
    )
  );

CREATE POLICY "Admins can manage videos" ON public.videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, access, is_admin)
  VALUES (new.id, new.email, false, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert sample data
INSERT INTO public.subjects (name, description) VALUES
  ('Mathematics', 'Advanced mathematical concepts and problem solving'),
  ('Physics', 'Fundamental principles of physics and their applications'),
  ('Computer Science', 'Programming, algorithms, and software development'),
  ('Chemistry', 'Chemical reactions, molecular structures, and laboratory techniques')
ON CONFLICT DO NOTHING;

-- Get subject IDs for sample data
DO $$
DECLARE
  math_id uuid;
  physics_id uuid;
  cs_id uuid;
  chem_id uuid;
BEGIN
  SELECT id INTO math_id FROM public.subjects WHERE name = 'Mathematics' LIMIT 1;
  SELECT id INTO physics_id FROM public.subjects WHERE name = 'Physics' LIMIT 1;
  SELECT id INTO cs_id FROM public.subjects WHERE name = 'Computer Science' LIMIT 1;
  SELECT id INTO chem_id FROM public.subjects WHERE name = 'Chemistry' LIMIT 1;

  -- Insert sample notes
  INSERT INTO public.notes (subject_id, title, pdf_url) VALUES
    (math_id, 'Calculus Fundamentals', 'https://example.com/calculus.pdf'),
    (math_id, 'Linear Algebra Basics', 'https://example.com/linear-algebra.pdf'),
    (physics_id, 'Quantum Mechanics Introduction', 'https://example.com/quantum.pdf'),
    (physics_id, 'Thermodynamics Principles', 'https://example.com/thermo.pdf'),
    (cs_id, 'Data Structures and Algorithms', 'https://example.com/dsa.pdf'),
    (cs_id, 'Object-Oriented Programming', 'https://example.com/oop.pdf'),
    (chem_id, 'Organic Chemistry Reactions', 'https://example.com/organic.pdf'),
    (chem_id, 'Analytical Chemistry Methods', 'https://example.com/analytical.pdf')
  ON CONFLICT DO NOTHING;

  -- Insert sample videos
  INSERT INTO public.videos (subject_id, title, youtube_url) VALUES
    (math_id, 'Calculus Explained', 'https://www.youtube.com/watch?v=WUvTyaaNkzM'),
    (math_id, 'Linear Algebra Visualization', 'https://www.youtube.com/watch?v=fNk_zzaMoSs'),
    (physics_id, 'Quantum Physics Overview', 'https://www.youtube.com/watch?v=JhHMJCUmq28'),
    (physics_id, 'Understanding Thermodynamics', 'https://www.youtube.com/watch?v=NyOYW07-L5g'),
    (cs_id, 'Algorithms and Data Structures', 'https://www.youtube.com/watch?v=8hly31xKli0'),
    (cs_id, 'Programming Fundamentals', 'https://www.youtube.com/watch?v=zOjov-2OZ0E'),
    (chem_id, 'Organic Chemistry Basics', 'https://www.youtube.com/watch?v=GOBhVLWdqDE'),
    (chem_id, 'Chemical Analysis Techniques', 'https://www.youtube.com/watch?v=IeaVgR3q18Q')
  ON CONFLICT DO NOTHING;
END $$;