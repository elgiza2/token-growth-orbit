import { Capacitor, registerPlugin } from "@capacitor/core";

type PendingPurchase = { purchaseToken: string; productId: string };
const billing = registerPlugin<{
  purchase(options: { productId: string; accountId: string }): Promise<{ purchaseToken: string }>;
  restore(): Promise<{ purchases: PendingPurchase[] }>;
}>("CeyoPlayBilling");

export function isPlayApp(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function purchasePlay(productId: string, accountId: string): Promise<string> {
  const result = await billing.purchase({ productId, accountId });
  return result.purchaseToken;
}

/** Ceyo subscriptions Google Play still marks unconfirmed on this phone. Older app builds lack this and return none. */
export async function pendingPlayPurchases(): Promise<PendingPurchase[]> {
  try {
    const result = await billing.restore();
    return (result.purchases ?? []).filter((p) => typeof p.purchaseToken === "string" && p.purchaseToken.length >= 10);
  } catch {
    return [];
  }
}
