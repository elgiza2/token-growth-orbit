CREATE TABLE public.native_voice_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  secret_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
CREATE INDEX native_voice_devices_user_idx ON public.native_voice_devices (user_id);
GRANT ALL ON public.native_voice_devices TO service_role;
ALTER TABLE public.native_voice_devices ENABLE ROW LEVEL SECURITY;