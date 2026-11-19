CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE public.telegram_operators (
  username text PRIMARY KEY,
  role text NOT NULL,
  marketer_code text,
  chat_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.telegram_operators TO service_role;
ALTER TABLE public.telegram_operators ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.referral_marketers (
  code text PRIMARY KEY,
  telegram_username text NOT NULL,
  share_percent numeric NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.referral_marketers TO service_role;
ALTER TABLE public.referral_marketers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  event text NOT NULL,
  user_id uuid,
  order_id text,
  amount numeric,
  currency text,
  usd_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX referral_events_code_idx ON public.referral_events(code, event, created_at);
CREATE UNIQUE INDEX referral_events_order_uniq ON public.referral_events(order_id) WHERE order_id IS NOT NULL;
GRANT ALL ON public.referral_events TO service_role;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by text;

INSERT INTO public.referral_marketers(code, telegram_username, share_percent) VALUES ('matra','raved01',50) ON CONFLICT DO NOTHING;
INSERT INTO public.telegram_operators(username, role, marketer_code) VALUES ('eigiza','admin',NULL), ('raved01','marketer','matra') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.tg_notify(p_chat_id bigint, p_text text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE tok text;
BEGIN
  IF p_chat_id IS NULL THEN RETURN; END IF;
  SELECT decrypted_secret INTO tok FROM vault.decrypted_secrets WHERE name = 'TELEGRAM_BOT_TOKEN' LIMIT 1;
  IF tok IS NULL THEN RETURN; END IF;
  PERFORM net.http_post(
    url := 'https://api.telegram.org/bot' || tok || '/sendMessage',
    body := jsonb_build_object('chat_id', p_chat_id, 'text', p_text, 'parse_mode', 'HTML'),
    headers := '{"Content-Type":"application/json"}'::jsonb);
EXCEPTION WHEN OTHERS THEN RETURN;
END $$;
REVOKE ALL ON FUNCTION public.tg_notify(bigint, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.tg_notify_role(p_role text, p_code text, p_text text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT chat_id FROM public.telegram_operators
    WHERE chat_id IS NOT NULL AND role = p_role AND (p_code IS NULL OR marketer_code = p_code)
  LOOP PERFORM public.tg_notify(r.chat_id, p_text); END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.tg_notify_role(text, text, text) FROM PUBLIC, anon, authenticated;

-- New account anywhere -> admin; referred account -> marketer too
CREATE OR REPLACE FUNCTION public.on_profile_referral()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE nm text := coalesce(NEW.display_name, NEW.username, 'مستخدم جديد');
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.tg_notify_role('admin', NULL, '👤 <b>تسجيل جديد</b>' || chr(10) || nm || coalesce(chr(10) || 'عن طريق: ' || NEW.referred_by, ''));
  END IF;
  IF NEW.referred_by IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.referred_by IS NULL) THEN
    INSERT INTO public.referral_events(code, event, user_id) VALUES (NEW.referred_by, 'signup', NEW.id);
    PERFORM public.tg_notify_role('marketer', NEW.referred_by, '🎉 <b>تسجيل جديد من صفحتك</b>' || chr(10) || nm);
    IF TG_OP = 'UPDATE' THEN
      PERFORM public.tg_notify_role('admin', NULL, '🔗 تسجيل عن طريق ' || NEW.referred_by || ': ' || nm);
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_referral_notify AFTER INSERT OR UPDATE OF referred_by ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.on_profile_referral();

-- Paid order -> admin; referred buyer -> marketer with share
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
    PERFORM public.tg_notify_role('marketer', ref, '💸 <b>اشتراك مدفوع من صفحتك</b>' || chr(10) || coalesce(NEW.tier, '') || chr(10) || amt || chr(10) || 'نصيبك ' || coalesce(share, 50)::text || '%: ' || round(coalesce(NEW.amount, 0) * coalesce(share, 50) / 100, 2)::text || ' ' || coalesce(NEW.currency, ''));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER payment_orders_paid_notify AFTER INSERT OR UPDATE OF status ON public.payment_orders
FOR EACH ROW EXECUTE FUNCTION public.on_order_paid();