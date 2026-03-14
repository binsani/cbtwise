
CREATE OR REPLACE FUNCTION public.validate_subscription_plan()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan IS NULL OR TRIM(NEW.plan) = '' THEN
    RAISE EXCEPTION 'Subscription plan cannot be empty';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_subscription_plan
BEFORE INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.validate_subscription_plan();
