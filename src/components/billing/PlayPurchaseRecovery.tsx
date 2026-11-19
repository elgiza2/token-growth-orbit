/** Android only: once per signed-in session, confirm any Google Play subscription left unconfirmed on this phone. */
import { useEffect } from "react";
import { recoverPlayPurchases } from "@/lib/payments/playRestore";
import { CREDITS_CHANGED_EVENT } from "@/hooks/useCredits";

export function PlayPurchaseRecovery({ userId }: { userId: string }) {
  useEffect(() => {
    let cancelled = false;
    void recoverPlayPurchases().then((n) => { if (!cancelled && n > 0) window.dispatchEvent(new Event(CREDITS_CHANGED_EVENT)); }).catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);
  return null;
}
