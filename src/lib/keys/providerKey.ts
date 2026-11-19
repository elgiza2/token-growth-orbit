/** Server-only key pool for `provider_api_keys`. Spreads load across every
 *  usable key (random pick among the least-recently-used), and
 *  `markProviderKeyFailed` puts a rejected key on cooldown so the next call
 *  switches to another key automatically. Env vars are the last fallback. */
import { createClient } from "@supabase/supabase-js";

export type KeyProvider = "apify" | "cerebras" | "browserbase" | "composio" | "anam" | "cartesia" | "deepgram" | "telnyx" | "kashier_merchant_id" | "kashier_api_key" | "e2b" | "pexels" | "pixabay";

const ENV: Record<KeyProvider, string> = {
  apify: "APIFY_API_KEY",
  cerebras: "CEREBRAS_API_KEY",
  browserbase: "BROWSERBASE_API_KEY",
  composio: "COMPOSIO_API_KEY",
  anam: "ANAM_API_KEY",
  cartesia: "CARTESIA_API_KEY",
  deepgram: "DEEPGRAM_API_KEY",
  telnyx: "TELNYX_API_KEY",
  kashier_merchant_id: "KASHIER_MERCHANT_ID",
  kashier_api_key: "KASHIER_API_KEY",
  e2b: "E2B_API_KEY",
  pexels: "PEXELS_API_KEY",
  pixabay: "PIXABAY_API_KEY",
};

function adminDb() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && service ? createClient(url, service, { auth: { persistSession: false } }) : null;
}

/** Picks one usable key; `exclude` skips keys that already failed in this request. */
export async function getProviderKey(provider: KeyProvider, exclude: string[] = []): Promise<string | null> {
  const db = adminDb();
  if (db) {
    const { data } = await db
      .from("provider_api_keys")
      .select("id,api_key,cooldown_until")
      .eq("provider", provider)
      .eq("status", "active")
      .order("last_used_at", { ascending: true, nullsFirst: true })
      .limit(10);
    const usable = (data ?? []).filter(
      (r) => r.api_key && !exclude.includes(r.api_key) && (!r.cooldown_until || new Date(r.cooldown_until).getTime() < Date.now()),
    );
    const pool = usable.slice(0, 3);
    const row = pool[Math.floor(Math.random() * pool.length)];
    if (row?.api_key) {
      void db.from("provider_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", row.id);
      return row.api_key;
    }
  }
  const env = process.env[ENV[provider]]?.trim() || null;
  return env && !exclude.includes(env) ? env : null;
}

/** 401/403 = key disabled after 3 strikes; 402/429/5xx = short cooldown. */
export async function markProviderKeyFailed(provider: KeyProvider, key: string, status: number, error = ""): Promise<void> {
  const db = adminDb();
  if (!db) return;
  const { data } = await db.from("provider_api_keys").select("id,failure_count").eq("provider", provider).eq("api_key", key).maybeSingle();
  if (!data) return;
  const failures = (data.failure_count ?? 0) + 1;
  const auth = status === 401 || status === 403;
  const minutes = status === 402 ? 60 : auth ? 30 : 2;
  await db.from("provider_api_keys").update({
    failure_count: failures,
    last_error: `${status} ${error}`.slice(0, 300),
    cooldown_until: new Date(Date.now() + minutes * 60_000).toISOString(),
    ...(auth && failures >= 3 ? { status: "disabled" } : {}),
  }).eq("id", data.id);
}

export async function markProviderKeyOk(provider: KeyProvider, key: string): Promise<void> {
  const db = adminDb();
  if (!db) return;
  await db.from("provider_api_keys").update({ failure_count: 0, last_error: null }).eq("provider", provider).eq("api_key", key).gt("failure_count", 0);
}

/** True for statuses where another key may succeed. */
export const isKeyFailure = (status: number) => [401, 402, 403, 429].includes(status) || status >= 500;
