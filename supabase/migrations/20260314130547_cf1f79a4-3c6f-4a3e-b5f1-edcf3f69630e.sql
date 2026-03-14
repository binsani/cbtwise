
-- Remove duplicate questions, keeping the oldest one per (subject_id, text)
DELETE FROM public.questions
WHERE id NOT IN (
  SELECT DISTINCT ON (subject_id, md5(text)) id
  FROM public.questions
  ORDER BY subject_id, md5(text), created_at ASC
);

-- Now create the unique index
CREATE UNIQUE INDEX idx_questions_text_subject_dedup ON public.questions (subject_id, md5(text));
