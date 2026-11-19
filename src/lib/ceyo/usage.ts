export type UsageStatus = { plan: string; isPaid: boolean; hasAccess: boolean; trialActive: boolean; trialEndsAt: string | null; trialUsed: boolean; tokensToday: number; tokenLimit: number; allowanceUsd: number; spentUsd: number; remainingUsd: number; stepUsd: number };
export const TRIAL_DAYS = 3;
/** Whole days left in the free trial, rounded up (0 when over or absent). */
export function trialDaysLeft(status: Pick<UsageStatus, "trialActive" | "trialEndsAt">, now = Date.now()): number {
  if (!status.trialActive || !status.trialEndsAt) return 0;
  const ms = new Date(status.trialEndsAt).getTime() - now;
  return Number.isFinite(ms) && ms > 0 ? Math.min(TRIAL_DAYS, Math.ceil(ms / 86_400_000)) : 0;
}
export function usagePercent(status: UsageStatus): number {
  if (!Number.isFinite(status.allowanceUsd) || status.allowanceUsd <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round(status.spentUsd / status.allowanceUsd * 100)));
}
/** Free trial: up to this many tokens per UTC day (decided by the database). */
export const TRIAL_TOKEN_LIMIT = 1_000_000;
export const EXHAUSTED_MESSAGE = "Your 3-day free trial has ended. Subscribe to continue.";
export const TRIAL_NOT_STARTED_MESSAGE = "Start your 3-day free trial by linking a card, or subscribe to continue.";
export const DAILY_LIMIT_MESSAGE = "You've used today's 1,000,000 free trial tokens. Subscribe for full power or come back tomorrow.";
const USAGE_MESSAGES: Record<string, string> = {
  [EXHAUSTED_MESSAGE]: "خلصت التجربة المجانية (3 أيام). اشترك علشان تكمل.",
  [TRIAL_NOT_STARTED_MESSAGE]: "ابدأ التجربة المجانية 3 أيام بربط بطاقتك، أو اشترك علشان تكمل.",
  [DAILY_LIMIT_MESSAGE]: "استخدمت المليون توكن المجانية بتاعة النهارده. اشترك للقوة الكاملة أو ارجع بكرة.",
};
export function isUsageExhausted(message: string | null | undefined) { return Boolean(message && Object.keys(USAGE_MESSAGES).some((m) => message.includes(m))); }
/** The usage message to show the customer, in their language. */
export function usageMessageText(message: string, ar: boolean): string {
  const key = Object.keys(USAGE_MESSAGES).find((m) => message.includes(m)) ?? EXHAUSTED_MESSAGE;
  return ar ? USAGE_MESSAGES[key] : key;
}
/** Why a customer without access is blocked. */
export function blockedMessage(status: Pick<UsageStatus, "trialUsed" | "trialActive">): string {
  if (!status.trialUsed) return TRIAL_NOT_STARTED_MESSAGE;
  return status.trialActive ? DAILY_LIMIT_MESSAGE : EXHAUSTED_MESSAGE;
}