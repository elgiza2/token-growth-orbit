CREATE OR REPLACE FUNCTION public.store_runtime_credential(p_name text, p_value text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$ DECLARE sid uuid; BEGIN IF p_name NOT IN ('CEYO_CRON_SECRET','CEYO_GITHUB_TOKEN','CEYO_SMTP_HOST','CEYO_SMTP_PORT','CEYO_SMTP_USER','CEYO_SMTP_PASSWORD','CEYO_SMTP_FROM','CEYO_FCM_SERVICE_ACCOUNT') OR p_value IS NULL OR length(p_value)=0 THEN RAISE EXCEPTION 'Invalid credential'; END IF; PERFORM pg_advisory_xact_lock(hashtext(p_name)); SELECT id INTO sid FROM vault.secrets WHERE name=p_name LIMIT 1; IF sid IS NULL THEN PERFORM vault.create_secret(p_value,p_name,'Independent Ceyo runtime'); ELSE PERFORM vault.update_secret(sid,p_value,p_name,'Independent Ceyo runtime'); END IF; END $function$;

CREATE OR REPLACE FUNCTION public.read_runtime_credential(p_name text)
 RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path TO ''
AS $function$ SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name=p_name AND p_name IN ('CEYO_CRON_SECRET','CEYO_GITHUB_TOKEN','CEYO_SMTP_HOST','CEYO_SMTP_PORT','CEYO_SMTP_USER','CEYO_SMTP_PASSWORD','CEYO_SMTP_FROM','CEYO_FCM_SERVICE_ACCOUNT') LIMIT 1 $function$;

REVOKE ALL ON FUNCTION public.store_runtime_credential(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_runtime_credential(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_runtime_credential(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_runtime_credential(text) TO service_role;

CREATE TABLE public.native_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  package text NOT NULL DEFAULT 'si.ceyo.app',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX native_push_tokens_user_idx ON public.native_push_tokens (user_id);
GRANT ALL ON public.native_push_tokens TO service_role;
ALTER TABLE public.native_push_tokens ENABLE ROW LEVEL SECURITY;