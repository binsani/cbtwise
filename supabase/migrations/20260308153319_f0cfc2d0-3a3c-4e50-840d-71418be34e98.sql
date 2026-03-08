
CREATE TABLE public.question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_text text NOT NULL,
  subject text NOT NULL,
  exam_slug text NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  admin_notes text
);

ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own reports"
  ON public.question_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
  ON public.question_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reports"
  ON public.question_reports FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
