/** Browser-safe referral rules shared by the landing page, the app and the Telegram bot. */

/** Subdomain → marketer code. matra.ceyo.app → "matra". */
export const MARKETER_HOSTS: Record<string, string> = { "matra.ceyo.app": "matra" };

export const REF_STORAGE_KEY = "ceyo_ref";

export function marketerCodeForHost(host: string): string | null {
  const h = host.toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
  return MARKETER_HOSTS[h] ?? null;
}

/** Only lowercase letters/digits, 2-32 chars. */
export function cleanRefCode(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim().toLowerCase();
  return /^[a-z0-9]{2,32}$/.test(v) ? v : null;
}

export type OperatorRole = "admin" | "marketer";
export type OperatorRow = { username: string; role: string; marketer_code: string | null };

/** Telegram usernames are case-insensitive; the bot trusts only listed accounts. */
export function resolveOperator(username: string | undefined, rows: OperatorRow[]): { role: OperatorRole; code: string | null } | null {
  const u = (username ?? "").trim().replace(/^@/, "").toLowerCase();
  if (!u) return null;
  const row = rows.find((r) => r.username.toLowerCase() === u);
  if (!row) return null;
  if (row.role === "admin") return { role: "admin", code: null };
  if (row.role === "marketer" && row.marketer_code) return { role: "marketer", code: row.marketer_code };
  return null;
}

/** Marketer's cut of a paid amount, rounded to 2 decimals. */
export function marketerShare(amount: number, percent: number): number {
  return Math.round(amount * percent) / 100;
}
