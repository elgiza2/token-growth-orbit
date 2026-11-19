-- Saved-card billing for the web trial (service-only table).
CREATE TABLE public.card_billing (
  user_id uuid PRIMARY KEY,
  tier text NOT NULL,
  "interval" text NOT NULL,
  status text NOT NULL DEFAULT 'pending_card',
  card_token text,
  card_agreement_id text,
  card_masked text,
  check_order_id text,
  next_charge_at timestamptz,
  failures integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.card_billing TO service_role;
ALTER TABLE public.card_billing ENABLE ROW LEVEL SECURITY;
CREATE INDEX card_billing_due_idx ON public.card_billing (next_charge_at) WHERE status = 'active';
CREATE TRIGGER card_billing_updated BEFORE UPDATE ON public.card_billing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_card_billing()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ BEGIN
  IF NEW.tier NOT IN ('plus','pro','ultra') OR NEW."interval" NOT IN ('monthly','yearly') THEN RAISE EXCEPTION 'Invalid plan'; END IF;
  IF NEW.status NOT IN ('pending_card','active','charging','cancelled','failed') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  RETURN NEW;
END $function$;
CREATE TRIGGER card_billing_validate BEFORE INSERT OR UPDATE ON public.card_billing FOR EACH ROW EXECUTE FUNCTION public.validate_card_billing();

-- Daily token use during the trial (service-only table).
CREATE TABLE public.trial_token_usage (
  user_id uuid NOT NULL,
  usage_day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  tokens bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, usage_day)
);
GRANT ALL ON public.trial_token_usage TO service_role;
ALTER TABLE public.trial_token_usage ENABLE ROW LEVEL SECURITY;

-- Trials are no longer created automatically: only a verified card check starts one.
CREATE OR REPLACE FUNCTION public.ensure_agent_trial(p_user_id uuid)
 RETURNS timestamp with time zone LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE e timestamptz; BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT ends_at INTO e FROM public.agent_trials WHERE user_id = p_user_id;
  RETURN e;
END $function$;

CREATE OR REPLACE FUNCTION public.ensure_my_agent_trial()
 RETURNS timestamp with time zone LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ DECLARE u uuid := auth.uid(); e timestamptz; BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT ends_at INTO e FROM public.agent_trials WHERE user_id = u;
  RETURN e;
END $function$;

-- Trial steps stop at 1,000,000 tokens per UTC day.
CREATE OR REPLACE FUNCTION public.charge_agent_usage(p_user_id uuid, p_operation_key text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE p text; t timestamptz; used bigint;
BEGIN
 IF p_operation_key IS NULL OR length(p_operation_key)<1 OR length(p_operation_key)>200 THEN RAISE EXCEPTION 'Invalid operation'; END IF;
 SELECT plan INTO p FROM public.subscriptions WHERE user_id=p_user_id AND current_period_end>now();
 IF p IN ('plus','pro','ultra') THEN RETURN jsonb_build_object('ok',true,'paid',true,'chargedUsd',0); END IF;
 t := public.ensure_agent_trial(p_user_id);
 IF t IS NOT NULL AND t > now() THEN
   SELECT tokens INTO used FROM public.trial_token_usage WHERE user_id=p_user_id AND usage_day=(now() AT TIME ZONE 'utc')::date;
   IF coalesce(used,0) >= 1000000 THEN RETURN jsonb_build_object('ok',false,'code','daily_limit','trialEndsAt',t,'tokensToday',used,'tokenLimit',1000000); END IF;
   RETURN jsonb_build_object('ok',true,'trial',true,'trialEndsAt',t,'chargedUsd',0);
 END IF;
 RETURN jsonb_build_object('ok',false,'code',CASE WHEN t IS NULL THEN 'trial_not_started' ELSE 'trial_ended' END,'trialEndsAt',t,'remainingUsd',0);
END $function$;

CREATE OR REPLACE FUNCTION public.agent_usage_status()
 RETURNS jsonb LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE u uuid:=auth.uid(); p text; paid boolean; t timestamptz; active boolean; used bigint;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT plan INTO p FROM public.subscriptions WHERE user_id=u AND current_period_end>now();
 paid := coalesce(p IN ('plus','pro','ultra'), false);
 t := public.ensure_my_agent_trial();
 active := NOT paid AND t IS NOT NULL AND t > now();
 used := public.my_trial_tokens_today();
 RETURN jsonb_build_object(
   'plan', CASE WHEN paid THEN p WHEN active THEN 'trial' ELSE 'free' END,
   'isPaid', paid, 'trialActive', active, 'trialEndsAt', t, 'trialUsed', t IS NOT NULL,
   'hasAccess', paid OR (active AND used < 1000000),
   'tokensToday', used, 'tokenLimit', 1000000,
   'allowanceUsd',0,'spentUsd',0,'remainingUsd',0,'stepUsd',0.01,'resetsDaily',false);
END $function$;

CREATE OR REPLACE FUNCTION public.my_trial_tokens_today()
 RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT coalesce((SELECT tokens FROM public.trial_token_usage WHERE user_id=auth.uid() AND usage_day=(now() AT TIME ZONE 'utc')::date),0) $function$;

CREATE OR REPLACE FUNCTION public.record_trial_tokens(p_user uuid, p_tokens integer)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ BEGIN
  IF p_user IS NULL OR p_tokens IS NULL OR p_tokens <= 0 THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id=p_user AND current_period_end>now() AND plan IN ('plus','pro','ultra')) THEN RETURN; END IF;
  INSERT INTO public.trial_token_usage(user_id, tokens) VALUES (p_user, least(p_tokens, 10000000))
  ON CONFLICT (user_id, usage_day) DO UPDATE SET tokens = public.trial_token_usage.tokens + excluded.tokens, updated_at = now();
END $function$;

-- Start: create the 1 EGP card-check order (once per account, never for subscribers or used trials).
CREATE OR REPLACE FUNCTION public.begin_card_trial(p_user uuid, p_order text, p_tier text, p_interval text, p_amount numeric)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('card-trial:'||p_user::text));
  IF EXISTS (SELECT 1 FROM public.agent_trials WHERE user_id=p_user) THEN RAISE EXCEPTION 'The free trial was already used'; END IF;
  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id=p_user AND current_period_end>now()) THEN RAISE EXCEPTION 'You already have a subscription'; END IF;
  INSERT INTO public.payment_orders(id,user_id,tier,interval,amount,currency,usd_amount,provider,method) VALUES (p_order,p_user,p_tier,p_interval,p_amount,'EGP',0,'kashier','trial_card');
  INSERT INTO public.card_billing(user_id,tier,"interval",status,check_order_id) VALUES (p_user,p_tier,p_interval,'pending_card',p_order)
  ON CONFLICT (user_id) DO UPDATE SET tier=excluded.tier, "interval"=excluded."interval", status='pending_card', check_order_id=excluded.check_order_id, failures=0, last_error=NULL;
  RETURN true;
END $function$;

-- Verified card check: mark the check paid, start the one-time trial and schedule the first charge at its end.
CREATE OR REPLACE FUNCTION public.start_card_trial(p_order text, p_token text, p_agreement text, p_masked text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE o public.payment_orders; e timestamptz; BEGIN
  UPDATE public.payment_orders SET status='paid', provider_ref=p_order WHERE id=p_order AND status='pending' AND method='trial_card' RETURNING * INTO o;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.agent_trials(user_id) VALUES (o.user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT ends_at INTO e FROM public.agent_trials WHERE user_id=o.user_id;
  UPDATE public.card_billing SET status='active', card_token=nullif(trim(coalesce(p_token,'')),''), card_agreement_id=nullif(trim(coalesce(p_agreement,'')),''),
    card_masked=nullif(right(regexp_replace(coalesce(p_masked,''),'\D','','g'),4),''), next_charge_at=e, failures=0, last_error=NULL
  WHERE user_id=o.user_id AND check_order_id=p_order;
  RETURN true;
END $function$;

-- Charging engine: claim due rows once; unknown outcomes stay in 'charging' for review instead of repeating.
CREATE OR REPLACE FUNCTION public.claim_due_card_charges()
 RETURNS SETOF public.card_billing LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$ UPDATE public.card_billing SET status='charging' WHERE user_id IN (
  SELECT user_id FROM public.card_billing WHERE status='active' AND next_charge_at<=now() ORDER BY next_charge_at FOR UPDATE SKIP LOCKED LIMIT 10) RETURNING * $function$;

CREATE OR REPLACE FUNCTION public.finish_card_charge(p_user uuid, p_ok boolean, p_error text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE c public.card_billing; ends timestamptz; BEGIN
  SELECT * INTO c FROM public.card_billing WHERE user_id=p_user AND status='charging' FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF p_ok THEN
    SELECT current_period_end INTO ends FROM public.subscriptions WHERE user_id=p_user;
    UPDATE public.card_billing SET status='active', failures=0, last_error=NULL, next_charge_at=coalesce(ends, now()+interval '30 days') WHERE user_id=p_user;
  ELSE
    UPDATE public.card_billing SET failures=c.failures+1, last_error=left(coalesce(p_error,'declined'),200),
      status=CASE WHEN c.failures+1>=3 OR c.card_token IS NULL THEN 'failed' ELSE 'active' END,
      next_charge_at=now()+interval '1 day' WHERE user_id=p_user;
  END IF;
END $function$;

-- Customer-facing: own status (never the card reference) and cancelling the automatic charge.
CREATE OR REPLACE FUNCTION public.my_card_billing()
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE (SELECT jsonb_build_object('tier',tier,'interval',"interval",'status',status,'nextChargeAt',next_charge_at,'cardLast4',card_masked,'hasCard',card_token IS NOT NULL)
  FROM public.card_billing WHERE user_id=auth.uid()) END $function$;

CREATE OR REPLACE FUNCTION public.cancel_my_card_billing()
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  UPDATE public.card_billing SET status='cancelled' WHERE user_id=auth.uid() AND status IN ('active','pending_card');
  RETURN FOUND;
END $function$;

REVOKE ALL ON FUNCTION public.record_trial_tokens(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.begin_card_trial(uuid, text, text, text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.start_card_trial(text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_due_card_charges() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_card_charge(uuid, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_trial_tokens(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.begin_card_trial(uuid, text, text, text, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_card_trial(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_due_card_charges() TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_card_charge(uuid, boolean, text) TO service_role;
REVOKE ALL ON FUNCTION public.my_card_billing() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_my_card_billing() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_trial_tokens_today() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_card_billing() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_my_card_billing() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_trial_tokens_today() TO authenticated, service_role;