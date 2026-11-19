import { DAILY_LIMIT_MESSAGE, EXHAUSTED_MESSAGE, TRIAL_NOT_STARTED_MESSAGE, blockedMessage, isUsageExhausted } from "./usage";
import type { SupabaseClient } from "@supabase/supabase-js";
export type UsageStatus = { isPaid: boolean; hasAccess: boolean; trialActive: boolean; trialUsed: boolean; remainingUsd: number; stepUsd: number };
/** Owner-scoped read used by usage gates and entitlement-specific features. */
export async function getUsageStatus(db: SupabaseClient): Promise<UsageStatus> {
  const { data, error } = await db.rpc("agent_usage_status");
  if (error || !data || typeof data.isPaid !== "boolean" || typeof data.remainingUsd !== "number" || typeof data.stepUsd !== "number") throw new Error("Could not check usage. Please try again later.");
  const trialActive = data.trialActive === true;
  // Access = active paid plan or the one-time 3-day trial; decided by the database, never the browser.
  return { isPaid: data.isPaid, hasAccess: data.isPaid || (data.hasAccess === true && trialActive), trialActive, trialUsed: data.trialUsed !== false, remainingUsd: data.remainingUsd, stepUsd: data.stepUsd };
}
/** Owner-scoped read, also used before issuing provider access tokens. */
export async function checkUsageAvailable(db: SupabaseClient): Promise<void> {
  const data = await getUsageStatus(db);
  if (!data.hasAccess) throw new Error(blockedMessage(data));
}
export function usageFailure(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Could not check usage. Please try again later.";
  return Response.json({ error: message, code: isUsageExhausted(message) ? "balance_exhausted" : "usage_unavailable" }, { status: isUsageExhausted(message) ? 402 : 503, headers: { "Cache-Control": "no-store" } });
}
/** Called only with an authenticated caller or a verified persisted job owner. */
export async function chargeUsage(userId: string, operationKey: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("charge_agent_usage", { p_user_id: userId, p_operation_key: operationKey });
  if (error) throw new Error("Could not check usage. Please try again later.");
  if (!data || typeof data !== "object" || Array.isArray(data) || !("ok" in data)) throw new Error("Could not check usage. Please try again later.");
  if (data.ok !== true) {
    const code = (data as { code?: string }).code;
    throw new Error(code === "daily_limit" ? DAILY_LIMIT_MESSAGE : code === "trial_not_started" ? TRIAL_NOT_STARTED_MESSAGE : EXHAUSTED_MESSAGE);
  }
}
/** Count a model step's tokens toward the free trial's daily limit (subscribers are ignored by the database). */
export async function recordTrialTokens(userId: string, tokens: number): Promise<void> {
  if (!Number.isFinite(tokens) || tokens <= 0) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.rpc("record_trial_tokens", { p_user: userId, p_tokens: Math.ceil(tokens) });
}
