
-- ==============================================
-- CBTWise Full Database Schema
-- ==============================================

-- 1. Role enum and user_roles table (per security guidelines)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  target_exam TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exams are publicly readable"
  ON public.exams FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage exams"
  ON public.exams FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  topic_count INTEGER DEFAULT 0,
  question_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_id, slug)
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects are publicly readable"
  ON public.subjects FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage subjects"
  ON public.subjects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Questions table (for locally stored questions)
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  topic TEXT,
  year INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  source TEXT DEFAULT 'manual',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are readable by authenticated users"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage questions"
  ON public.questions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_questions_subject ON public.questions(subject_id);
CREATE INDEX idx_questions_exam ON public.questions(exam_id);
CREATE INDEX idx_questions_topic ON public.questions(topic);

-- 6. User attempts table
CREATE TABLE public.user_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_slug TEXT NOT NULL,
  subject TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('practice', 'mock')),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_questions > 0 THEN (correct_answers::NUMERIC / total_questions * 100) ELSE 0 END
  ) STORED,
  time_spent_seconds INTEGER,
  answers JSONB,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts"
  ON public.user_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts"
  ON public.user_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts"
  ON public.user_attempts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_attempts_user ON public.user_attempts(user_id);
CREATE INDEX idx_attempts_exam ON public.user_attempts(exam_slug);

-- 7. Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'monthly', 'quarterly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);

-- 8. Updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Seed exam data
INSERT INTO public.exams (slug, name, description, color) VALUES
  ('utme', 'UTME (JAMB)', 'Unified Tertiary Matriculation Examination', 'exam-utme'),
  ('waec', 'WAEC', 'West African Senior School Certificate Examination', 'exam-waec'),
  ('neco', 'NECO', 'National Examinations Council', 'exam-neco');

-- 10. Seed subjects for each exam
INSERT INTO public.subjects (exam_id, name, slug, topic_count, question_count)
SELECT e.id, s.name, s.slug, s.topics, s.questions
FROM public.exams e
CROSS JOIN (VALUES
  ('English Language', 'english', 12, 600),
  ('Mathematics', 'mathematics', 15, 800),
  ('Biology', 'biology', 18, 700),
  ('Chemistry', 'chemistry', 14, 650),
  ('Physics', 'physics', 16, 700),
  ('Economics', 'economics', 10, 500),
  ('Government', 'government', 12, 450),
  ('Literature in English', 'literature', 8, 350),
  ('Commerce', 'commerce', 9, 300),
  ('CRS', 'crk', 10, 350),
  ('Accounting', 'accounting', 8, 300),
  ('Geography', 'geography', 10, 400),
  ('Civic Education', 'civic_education', 8, 350)
) AS s(name, slug, topics, questions)
WHERE e.slug = 'utme';

INSERT INTO public.subjects (exam_id, name, slug, topic_count, question_count)
SELECT e.id, s.name, s.slug, s.topics, s.questions
FROM public.exams e
CROSS JOIN (VALUES
  ('English Language', 'english', 10, 500),
  ('Mathematics', 'mathematics', 14, 700),
  ('Biology', 'biology', 16, 600),
  ('Chemistry', 'chemistry', 12, 550),
  ('Physics', 'physics', 14, 600),
  ('Economics', 'economics', 9, 400),
  ('Civic Education', 'civic_education', 8, 350),
  ('Commerce', 'commerce', 7, 300)
) AS s(name, slug, topics, questions)
WHERE e.slug = 'waec';

INSERT INTO public.subjects (exam_id, name, slug, topic_count, question_count)
SELECT e.id, s.name, s.slug, s.topics, s.questions
FROM public.exams e
CROSS JOIN (VALUES
  ('English Language', 'english', 10, 400),
  ('Mathematics', 'mathematics', 13, 600),
  ('Biology', 'biology', 15, 500),
  ('Chemistry', 'chemistry', 11, 450),
  ('Physics', 'physics', 13, 500),
  ('Economics', 'economics', 8, 350),
  ('Civic Education', 'civic_education', 7, 300)
) AS s(name, slug, topics, questions)
WHERE e.slug = 'neco';
