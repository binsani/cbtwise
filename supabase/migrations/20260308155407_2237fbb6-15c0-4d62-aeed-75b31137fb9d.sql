
-- Admin notifications table
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'report',
  reference_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Trigger function to create notification on new question report
CREATE OR REPLACE FUNCTION public.notify_admin_on_report()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_notifications (title, message, type, reference_id)
  VALUES (
    'New Question Report',
    'A student reported an issue: ' || LEFT(NEW.reason, 100),
    'report',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_question_report_inserted
  AFTER INSERT ON public.question_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_report();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
