GRANT SELECT ON public.trial_token_usage TO authenticated;
CREATE POLICY "Owners read own trial token use" ON public.trial_token_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

GRANT SELECT (user_id, tier, "interval", status, next_charge_at, card_masked) ON public.card_billing TO authenticated;
GRANT UPDATE (status) ON public.card_billing TO authenticated;
CREATE POLICY "Owners read own card billing" ON public.card_billing FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners cancel own automatic charge" ON public.card_billing FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('active','pending_card'))
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

CREATE OR REPLACE FUNCTION public.my_trial_tokens_today()
 RETURNS bigint LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public'
AS $function$ SELECT coalesce((SELECT tokens FROM public.trial_token_usage WHERE user_id=auth.uid() AND usage_day=(now() AT TIME ZONE 'utc')::date),0) $function$;

CREATE OR REPLACE FUNCTION public.my_card_billing()
 RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public'
AS $function$ SELECT (SELECT jsonb_build_object('tier',tier,'interval',"interval",'status',status,'nextChargeAt',next_charge_at,'cardLast4',card_masked)
  FROM public.card_billing WHERE user_id=auth.uid()) $function$;

CREATE OR REPLACE FUNCTION public.cancel_my_card_billing()
 RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public'
AS $function$ BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  UPDATE public.card_billing SET status='cancelled' WHERE user_id=auth.uid() AND status IN ('active','pending_card');
  RETURN FOUND;
END $function$;