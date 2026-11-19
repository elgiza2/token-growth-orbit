/** Server-only Google Play Billing: verify a subscription purchase token with the Play Developer API. */
import { SignJWT, importPKCS8 } from "jose";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { priceOf, playProductId, type BillingInterval, type Tier } from "./plans";
import { PaymentsUnavailable } from "./kashier.server";

const db = () => supabaseAdmin as any;

async function playToken() {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  const pkg = process.env.GOOGLE_PLAY_PACKAGE_NAME;
  if (!raw || !pkg) throw new PaymentsUnavailable("Google Play billing is not configured");
  const sa = JSON.parse(raw) as { client_email: string; private_key: string };
  const key = await importPKCS8(sa.private_key, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/androidpublisher" })
    .setProtectedHeader({ alg: "RS256" }).setIssuer(sa.client_email).setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now).setExpirationTime(now + 3600).sign(key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new PaymentsUnavailable("Google Play sign-in failed");
  return { token: json.access_token, pkg };
}

type PlaySub = {
  subscriptionState?: string;
  acknowledgementState?: string;
  lineItems?: { productId?: string }[];
  externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string };
};

const PLAN_OF = (productId: string): { tier: Tier; interval: BillingInterval } | null => {
  const m = /^ceyo_(plus|pro|ultra)_(monthly|yearly)$/.exec(productId);
  return m ? { tier: m[1] as Tier, interval: m[2] as BillingInterval } : null;
};

/** Google refunds subscriptions that are not acknowledged within 3 days and blocks plan changes until then. */
async function acknowledge(pkg: string, token: string, productId: string, purchaseToken: string) {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;
  const res = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: "{}" });
  // 400 here means Play already considers it acknowledged; anything else must surface so it is retried.
  if (!res.ok && res.status !== 400) throw new Error("Google Play could not confirm the purchase");
}

async function verifyAndSettle(userId: string, purchaseToken: string, expected?: { tier: Tier; interval: BillingInterval }) {
  const { token, pkg } = await playToken();
  const res = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Purchase could not be verified");
  const sub = (await res.json()) as PlaySub;
  const active = sub.subscriptionState === "SUBSCRIPTION_STATE_ACTIVE" || sub.subscriptionState === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD";
  const productId = (sub.lineItems ?? []).map((l) => l.productId ?? "").find((id) => (expected ? id === playProductId(expected.tier, expected.interval) : PLAN_OF(id) !== null));
  const plan = productId ? PLAN_OF(productId) : null;
  if (!active || !productId || !plan || sub.externalAccountIdentifiers?.obfuscatedExternalAccountId !== userId) throw new Error("Purchase could not be verified");
  if (sub.acknowledgementState !== "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED") await acknowledge(pkg, token, productId, purchaseToken);
  const orderId = `play_${(await sha(purchaseToken)).slice(0, 40)}`;
  await db().from("payment_orders").upsert({ id: orderId, user_id: userId, tier: plan.tier, interval: plan.interval, amount: priceOf(plan.tier, plan.interval), currency: "USD", provider: "google_play" }, { onConflict: "id", ignoreDuplicates: true });
  await db().rpc("settle_payment_order", { p_order: orderId, p_ref: orderId });
  return { orderId };
}

/** Verify the purchase belongs to this user's order, confirm it with Google Play, then settle it once. */
export async function verifyPlayPurchase(userId: string, tier: Tier, interval: BillingInterval, purchaseToken: string) {
  if (priceOf(tier, interval) === null) throw new Error("This plan is not available");
  return verifyAndSettle(userId, purchaseToken, { tier, interval });
}

/** Recover an earlier purchase the phone still holds (for example one whose confirmation failed). */
export async function restorePlayPurchase(userId: string, purchaseToken: string) {
  return verifyAndSettle(userId, purchaseToken);
}

async function sha(value: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
