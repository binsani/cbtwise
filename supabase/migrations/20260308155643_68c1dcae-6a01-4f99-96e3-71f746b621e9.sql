
-- Trigger for new user signups (fires when a profile is created)
CREATE OR REPLACE FUNCTION public.notify_admin_on_signup()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_notifications (title, message, type, reference_id)
  VALUES (
    'New User Signup',
    'A new user has registered: ' || COALESCE(NEW.full_name, 'Unknown'),
    'signup',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_signup();

-- Trigger for new contact messages
CREATE OR REPLACE FUNCTION public.notify_admin_on_contact()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_notifications (title, message, type, reference_id)
  VALUES (
    'New Contact Message',
    'Message from ' || NEW.name || ': ' || LEFT(NEW.message, 100),
    'contact',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_contact_message_created
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_contact();
