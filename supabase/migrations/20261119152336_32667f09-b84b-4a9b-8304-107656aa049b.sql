REVOKE ALL ON FUNCTION public.on_order_paid() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_profile_referral() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_profile_referral()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.referred_by IS NOT NULL THEN NEW.referred_by := OLD.referred_by; END IF;
  IF NEW.referred_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.referral_marketers WHERE code = NEW.referred_by) THEN
    NEW.referred_by := CASE WHEN TG_OP = 'UPDATE' THEN OLD.referred_by ELSE NULL END;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_profile_referral() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER profiles_referral_guard BEFORE INSERT OR UPDATE OF referred_by ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_referral();