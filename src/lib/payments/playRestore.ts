/** Browser-only: hand unconfirmed Google Play subscriptions on this phone to the server, which verifies and confirms them. */
import { supabase } from "@/integrations/supabase/legacyClient";
import { isPlayApp, pendingPlayPurchases } from "@/lib/native/playBilling";

/** Returns how many earlier purchases the server confirmed and activated. */
export async function recoverPlayPurchases(): Promise<number> {
  if (!isPlayApp()) return 0;
  const pending = await pendingPlayPurchases();
  if (!pending.length) return 0;
  const { data } = await supabase.auth.getSession();
  const access = data.session?.access_token;
  if (!access) return 0;
  let confirmed = 0;
  for (const p of pending) {
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
      body: JSON.stringify({ action: "play_restore", purchaseToken: p.purchaseToken }),
    }).catch(() => null);
    if (res?.ok) confirmed++;
  }
  return confirmed;
}
