CREATE OR REPLACE FUNCTION public.on_profile_referral()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE nm text := coalesce(NEW.display_name, NEW.username, 'مستخدم جديد');
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.tg_notify_role('admin', NULL, '👤 <b>تسجيل جديد</b>' || chr(10) || nm || coalesce(chr(10) || 'عن طريق: ' || NEW.referred_by, ''));
  END IF;
  IF NEW.referred_by IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.referred_by IS NULL) THEN
    INSERT INTO public.referral_events(code, event, user_id) VALUES (NEW.referred_by, 'signup', NEW.id);
    PERFORM public.tg_notify_role('marketer', NEW.referred_by, '🎉 <b>New signup from your page</b>' || chr(10) || coalesce(NEW.display_name, NEW.username, 'New user'));
    IF TG_OP = 'UPDATE' THEN
      PERFORM public.tg_notify_role('admin', NULL, '🔗 تسجيل عن طريق ' || NEW.referred_by || ': ' || nm);
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.on_order_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE ref text; share numeric; amt text;
BEGIN
  IF NEW.status <> 'paid' OR (TG_OP = 'UPDATE' AND OLD.status = 'paid') THEN RETURN NEW; END IF;
  amt := coalesce(NEW.amount::text, '?') || ' ' || coalesce(NEW.currency, '') || coalesce(' (~$' || round(NEW.usd_amount, 2)::text || ')', '');
  SELECT referred_by INTO ref FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.tg_notify_role('admin', NULL, '💰 <b>دفع جديد</b>' || chr(10) || coalesce(NEW.tier, '') || ' / ' || coalesce(NEW.interval, '') || chr(10) || amt || coalesce(chr(10) || 'عن طريق: ' || ref, ''));
  IF ref IS NOT NULL THEN
    SELECT share_percent INTO share FROM public.referral_marketers WHERE code = ref;
    INSERT INTO public.referral_events(code, event, user_id, order_id, amount, currency, usd_amount)
      VALUES (ref, 'payment', NEW.user_id, NEW.id, NEW.amount, NEW.currency, NEW.usd_amount) ON CONFLICT DO NOTHING;
    PERFORM public.tg_notify_role('marketer', ref, '💸 <b>New paid subscription from your page</b>' || chr(10) || coalesce(NEW.tier, '') || chr(10) || amt || chr(10) || 'Your share ' || coalesce(share, 50)::text || '%: ' || round(coalesce(NEW.amount, 0) * coalesce(share, 50) / 100, 2)::text || ' ' || coalesce(NEW.currency, ''));
  END IF;
  RETURN NEW;
END $$;