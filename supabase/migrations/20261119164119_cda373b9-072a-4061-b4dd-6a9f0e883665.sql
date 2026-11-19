CREATE OR REPLACE FUNCTION public.on_order_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE ref text; share numeric; amt text; is_trial boolean;
BEGIN
  IF NEW.status <> 'paid' OR (TG_OP = 'UPDATE' AND OLD.status = 'paid') THEN RETURN NEW; END IF;
  is_trial := coalesce(NEW.method, '') = 'trial_card' OR coalesce(NEW.usd_amount, 0) <= 0;
  amt := coalesce(NEW.amount::text, '?') || ' ' || coalesce(NEW.currency, '') || coalesce(' (~$' || round(NEW.usd_amount, 2)::text || ')', '');
  SELECT referred_by INTO ref FROM public.profiles WHERE id = NEW.user_id;
  IF is_trial THEN
    PERFORM public.tg_notify_role('admin', NULL, '🧪 <b>بدء تجربة مجانية</b>' || chr(10) || coalesce(NEW.tier, '') || coalesce(chr(10) || 'عن طريق: ' || ref, ''));
    RETURN NEW;
  END IF;
  PERFORM public.tg_notify_role('admin', NULL, '💰 <b>دفع جديد</b>' || chr(10) || coalesce(NEW.tier, '') || ' / ' || coalesce(NEW.interval, '') || chr(10) || amt || coalesce(chr(10) || 'عن طريق: ' || ref, ''));
  IF ref IS NOT NULL THEN
    SELECT share_percent INTO share FROM public.referral_marketers WHERE code = ref;
    INSERT INTO public.referral_events(code, event, user_id, order_id, amount, currency, usd_amount)
      VALUES (ref, 'payment', NEW.user_id, NEW.id, NEW.amount, NEW.currency, NEW.usd_amount) ON CONFLICT DO NOTHING;
    PERFORM public.tg_notify_role('marketer', ref, '💸 <b>New paid subscription from your page</b>' || chr(10) || coalesce(NEW.tier, '') || chr(10) || amt || chr(10) || 'Your share ' || coalesce(share, 50)::text || '%: ' || round(coalesce(NEW.amount, 0) * coalesce(share, 50) / 100, 2)::text || ' ' || coalesce(NEW.currency, ''));
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.on_order_paid() FROM PUBLIC, anon, authenticated;
DELETE FROM public.referral_events e USING public.payment_orders o WHERE e.order_id = o.id AND e.event = 'payment' AND (o.method = 'trial_card' OR coalesce(o.usd_amount,0) <= 0);