/** Server-only Kashier: server-priced hosted checkout + signed webhook verification. */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getProviderKey } from "@/lib/keys/providerKey";
import { priceOf } from "./plans";

export class PaymentsUnavailable extends Error {}
const db = () => supabaseAdmin as any;

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function keys() {
  const [merchantId, apiKey] = await Promise.all([getProviderKey("kashier_merchant_id"), getProviderKey("kashier_api_key")]);
  if (!merchantId || !apiKey) throw new PaymentsUnavailable("Kashier is not configured");
  return { merchantId: merchantId.trim(), apiKey: apiKey.trim() };
}

const FEP = "https://fep.kashier.io/v3/orders/";

/** Live USD->EGP rate (rounded up to whole pounds); falls back to a fixed rate if the feed is down. */
export async function usdToEgp(usd: number) {
  let rate = Number(process.env.KASHIER_FALLBACK_EGP_RATE || 50);
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(4000) });
    const j = (await r.json()) as { rates?: Record<string, number> };
    if (j.rates?.EGP && j.rates.EGP > 10) rate = j.rates.EGP;
  } catch { /* keep fallback */ }
  return Math.ceil(usd * rate);
}

/** Create a pending EGP order priced on the server and sign it for Kashier's Direct API. */
export async function createKashierOrder(userId: string, tier: string, interval: string, method: "card" | "wallet", origin: string) {
  const usd = priceOf(tier, interval);
  if (usd === null) throw new Error("This plan is not available");
  const { merchantId, apiKey } = await keys();
  const amount = await usdToEgp(usd);
  const currency = "EGP";
  const orderId = `ceyo_${crypto.randomUUID().replace(/-/g, "")}`;
  const { error } = await db().from("payment_orders").insert({ id: orderId, user_id: userId, tier, interval, amount, currency, usd_amount: usd, provider: "kashier", method });
  if (error) throw new Error(error.message);
  const hash = await hmacHex(apiKey, `/?payment=${merchantId}.${orderId}.${amount}.${currency}`);
  return {
    orderId, merchantId, amount, currency, hash, endpoint: FEP,
    webhookUrl: `${origin}/api/public/kashier-webhook`,
    redirect: `${origin}/settings/plans?order=${orderId}`,
  };
}

/** Card check that starts the one-time web trial: $1 (charged as its EGP equivalent), card saved for the charge when the trial ends. */
export const TRIAL_CHECK_USD = 1;
export async function startKashierTrial(userId: string, tier: string, interval: string, origin: string) {
  if (priceOf(tier, interval) === null) throw new Error("This plan is not available");
  const { merchantId, apiKey } = await keys();
  const amount = await usdToEgp(TRIAL_CHECK_USD);
  const currency = "EGP";
  const orderId = `ceyo_trial_${crypto.randomUUID().replace(/-/g, "")}`;
  const { error } = await db().rpc("begin_card_trial", { p_user: userId, p_order: orderId, p_tier: tier, p_interval: interval, p_amount: amount });
  if (error) throw new Error(/already/i.test(error.message) ? error.message : "The free trial could not start");
  // Saving the card requires the customer reference inside the signed hash.
  const hash = await hmacHex(apiKey, `/?payment=${merchantId}.${orderId}.${amount}.${currency}.${userId}`);
  return {
    orderId, merchantId, amount, currency, hash, endpoint: FEP, saveCard: true as const,
    webhookUrl: `${origin}/api/public/kashier-webhook`,
    redirect: `${origin}/settings/plans?order=${orderId}`,
  };
}

/** The saved-card reference Kashier returns with a payment made with card.save. */
export function savedCardFrom(data: Record<string, unknown>) {
  const any = data as Record<string, any>;
  const pick = (...values: unknown[]) => values.map((v) => String(v ?? "").trim()).find(Boolean) ?? "";
  return {
    token: pick(any.cardDataToken, any.cardToken, any.card?.cardToken, any.response?.paymentMethod?.card?.cardToken),
    agreement: pick(any.cardAgreementId, any.agreementId, any.agreement?.id),
    masked: pick(any.maskedCard, any.card?.number, any.response?.paymentMethod?.card?.number),
  };
}

async function fep(url: string, method: string, hash: string | null, body: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (hash) headers["Kashier-Hash"] = hash;
  const r = await fetch(url, { method, headers, body: JSON.stringify(body) });
  return (await r.json().catch(() => ({}))) as { status?: string; message?: string; messages?: { en?: string }; response?: { status?: string } };
}

/** Send a Vodafone Cash (or any Egyptian wallet) request-to-pay to the user's phone. */
export async function requestKashierWallet(userId: string, email: string, tier: string, interval: string, phone: string, origin: string) {
  const mobile = phone.replace(/\D/g, "");
  if (!/^01[0125]\d{8}$/.test(mobile)) throw new Error("Enter your 11-digit wallet number starting with 01.");
  const o = await createKashierOrder(userId, tier, interval, "wallet", origin);
  const res = await fep(o.endpoint, "POST", o.hash, {
    apiOperation: "INITIATE_R2P", merchantId: o.merchantId, interactionSource: "ECOMMERCE",
    paymentMethod: { type: "wallet" },
    order: { reference: o.orderId, amount: o.amount, currency: o.currency },
    customer: { mobilePhone: mobile, reference: userId, email },
    serverWebhook: o.webhookUrl, reconciliation: { webhookUrl: o.webhookUrl },
  });
  if (res.status !== "SUCCESS") {
    await db().from("payment_orders").update({ status: "failed" }).eq("id", o.orderId);
    throw new Error(res.messages?.en || res.message || "This number isn't linked to a wallet.");
  }
  return { orderId: o.orderId, amount: o.amount, currency: o.currency };
}

/** Ask Kashier for the wallet result; settles the order on success (server-to-server, cannot be faked). */
export async function reconcileKashierWallet(userId: string, orderId: string) {
  const { data: order } = await db().from("payment_orders").select("id,status,user_id,method").eq("id", orderId).maybeSingle();
  if (!order || order.user_id !== userId) throw new Error("Order not found");
  if (order.status !== "pending" || order.method !== "wallet") return { status: order.status };
  const { merchantId } = await keys();
  const res = await fep(`${FEP}${encodeURIComponent(orderId)}`, "PUT", null, { apiOperation: "RECONCILE_WALLET", merchantId, paymentMethod: { type: "wallet" } });
  const state = String(res.response?.status || res.status || "").toUpperCase();
  if (state === "CAPTURED" || (state === "SUCCESS" && res.response?.status)) {
    await db().rpc("settle_payment_order", { p_order: orderId, p_ref: `wallet_${orderId}` });
    return { status: "paid" };
  }
  if (state === "FAILURE" || state === "FAILED") {
    await db().from("payment_orders").update({ status: "failed" }).eq("id", orderId).eq("status", "pending");
    return { status: "failed" };
  }
  return { status: "pending" };
}

/** Verify Kashier's x-kashier-signature (HMAC over sorted signatureKeys) and settle the order once. */
export async function handleKashierWebhook(raw: string, signature: string) {
  const { apiKey } = await keys();
  const event = JSON.parse(raw) as { event?: string; data?: Record<string, unknown> };
  const data = event.data ?? {};
  const signed = Array.isArray(data.signatureKeys) ? (data.signatureKeys as unknown[]).filter((k): k is string => typeof k === "string").sort() : [];
  if (!signed.length || !signature) return { ok: false as const, status: 401 };
  const pairs = signed.map((k) => [k, String(data[k] ?? "")] as const);
  const candidates = [pairs.map(([k, v]) => `${k}=${v}`).join("&"), pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")];
  let valid = false;
  for (const c of candidates) if (safeEqual(await hmacHex(apiKey, c), signature.toLowerCase())) valid = true;
  if (!valid) return { ok: false as const, status: 401 };

  const orderId = String(data.merchantOrderId ?? "");
  const status = String(data.status ?? "").toUpperCase();
  const ref = String(data.transactionId ?? data.kashierOrderId ?? orderId);
  const { data: order } = await db().from("payment_orders").select("id,amount,currency,status,method").eq("id", orderId).maybeSingle();
  if (!order) return { ok: true as const, status: 200 };
  if (status === "SUCCESS") {
    // Amount/currency must match the server-priced order exactly.
    if (Number(data.amount) !== Number(order.amount) || String(data.currency ?? "").toUpperCase() !== order.currency) {
      await db().from("payment_orders").update({ status: "failed" }).eq("id", orderId).eq("status", "pending");
      return { ok: true as const, status: 200 };
    }
    // A trial card check never grants a plan: it starts the trial and schedules the first charge.
    if (order.method === "trial_card") {
      const card = savedCardFrom(data);
      await db().rpc("start_card_trial", { p_order: orderId, p_token: card.token, p_agreement: card.agreement, p_masked: card.masked });
      return { ok: true as const, status: 200 };
    }
    await db().rpc("settle_payment_order", { p_order: orderId, p_ref: ref });
  } else if (status === "FAILURE" || status === "FAILED") {
    await db().from("payment_orders").update({ status: "failed" }).eq("id", orderId).eq("status", "pending");
  }
  return { ok: true as const, status: 200 };
}

/** Charge saved cards whose trial or period has ended (called by the private scheduler). */
export async function chargeDueCards(origin: string) {
  const { data: due, error } = await db().rpc("claim_due_card_charges");
  if (error) throw new Error(error.message);
  const rows = (due ?? []) as { user_id: string; tier: string; interval: string; card_token: string | null; card_agreement_id: string | null }[];
  if (!rows.length) return [];
  const { merchantId, apiKey } = await keys();
  const results: { user: string; ok: boolean }[] = [];
  for (const row of rows) {
    const usd = priceOf(row.tier, row.interval);
    if (!row.card_token || usd === null) {
      await db().rpc("finish_card_charge", { p_user: row.user_id, p_ok: false, p_error: row.card_token ? "Plan unavailable" : "No saved card" });
      results.push({ user: row.user_id, ok: false });
      continue;
    }
    const amount = await usdToEgp(usd);
    const currency = "EGP";
    const orderId = `ceyo_renew_${crypto.randomUUID().replace(/-/g, "")}`;
    const ins = await db().from("payment_orders").insert({ id: orderId, user_id: row.user_id, tier: row.tier, interval: row.interval, amount, currency, usd_amount: usd, provider: "kashier", method: "card_renewal" });
    if (ins.error) { await db().rpc("finish_card_charge", { p_user: row.user_id, p_ok: false, p_error: "Order could not be created" }); continue; }
    const hash = await hmacHex(apiKey, `/?payment=${merchantId}.${orderId}.${amount}.${currency}.${row.user_id}`);
    const card: Record<string, unknown> = { enable3DS: false, cardToken: row.card_token };
    if (row.card_agreement_id) card.agreement = { id: row.card_agreement_id };
    let res: Awaited<ReturnType<typeof fep>> & { response?: { status?: string; result?: string; transactionId?: string } };
    try {
      res = await fep(FEP, "POST", hash, {
        apiOperation: "PAY", merchantId, interactionSource: "CONTAUTH",
        paymentMethod: { type: "CARD", card },
        order: { reference: orderId, amount: String(amount), currency },
        customer: { reference: row.user_id },
        serverWebhook: `${origin}/api/public/kashier-webhook`,
        reconciliation: { webhookUrl: `${origin}/api/public/kashier-webhook` },
      }) as typeof res;
    } catch {
      // Unknown outcome: leave the order pending and the row "charging" for review; never charge twice.
      results.push({ user: row.user_id, ok: false });
      continue;
    }
    const paid = res.status === "SUCCESS" && (res.response?.result === "SUCCESS" || res.response?.status === "CAPTURED" || res.response?.status === "SUCCESS");
    if (paid) {
      await db().rpc("settle_payment_order", { p_order: orderId, p_ref: String(res.response?.transactionId || orderId) });
      await db().rpc("finish_card_charge", { p_user: row.user_id, p_ok: true, p_error: null });
    } else {
      await db().from("payment_orders").update({ status: "failed" }).eq("id", orderId).eq("status", "pending");
      await db().rpc("finish_card_charge", { p_user: row.user_id, p_ok: false, p_error: String(res.messages?.en || res.message || "Card declined").slice(0, 200) });
    }
    results.push({ user: row.user_id, ok: paid });
  }
  return results;
}
