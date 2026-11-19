import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn(async () => ({ data: true, error: null })));
const order = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    rpc,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: order.current }) }) }), update: () => ({ eq: () => ({ eq: async () => ({}) }) }) }),
  },
}));
vi.mock("@/lib/keys/providerKey", () => ({ getProviderKey: async (p: string) => (p === "kashier_api_key" ? "secret-key" : "MID-1") }));

import { handleKashierWebhook, savedCardFrom } from "./kashier.server";
import { kashierCardPayload } from "./kashierCard";

async function sign(data: Record<string, unknown>) {
  const keys = (data.signatureKeys as string[]).slice().sort();
  const msg = keys.map((k) => `${k}=${String(data[k] ?? "")}`).join("&");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("secret-key"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg)))).map((b) => b.toString(16).padStart(2, "0")).join("");
}

describe("Card-first web trial", () => {
  beforeEach(() => rpc.mockClear());

  it("a paid $1 card check starts the trial with the saved card and never grants a plan", async () => {
    order.current = { id: "ceyo_trial_1", amount: 1, currency: "EGP", status: "pending", method: "trial_card" };
    const data = { merchantOrderId: "ceyo_trial_1", status: "SUCCESS", amount: "1", currency: "EGP", cardDataToken: "tok_123", maskedCard: "411111******1234", signatureKeys: ["merchantOrderId", "status", "amount", "currency"] };
    const res = await handleKashierWebhook(JSON.stringify({ event: "pay", data }), await sign(data));
    expect(res.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("start_card_trial", { p_order: "ceyo_trial_1", p_token: "tok_123", p_agreement: "", p_masked: "411111******1234" });
    expect(rpc).not.toHaveBeenCalledWith("settle_payment_order", expect.anything());
  });

  it("a card check with the wrong amount does not start a trial", async () => {
    order.current = { id: "ceyo_trial_2", amount: 1, currency: "EGP", status: "pending", method: "trial_card" };
    const data = { merchantOrderId: "ceyo_trial_2", status: "SUCCESS", amount: "0.5", currency: "EGP", signatureKeys: ["merchantOrderId", "status", "amount", "currency"] };
    await handleKashierWebhook(JSON.stringify({ data }), await sign(data));
    expect(rpc).not.toHaveBeenCalledWith("start_card_trial", expect.anything());
  });

  it("an ordinary plan payment still activates the plan", async () => {
    order.current = { id: "ceyo_plan_1", amount: 500, currency: "EGP", status: "pending", method: "card" };
    const data = { merchantOrderId: "ceyo_plan_1", status: "SUCCESS", amount: "500", currency: "EGP", signatureKeys: ["merchantOrderId", "status", "amount", "currency"] };
    await handleKashierWebhook(JSON.stringify({ data }), await sign(data));
    expect(rpc).toHaveBeenCalledWith("settle_payment_order", expect.objectContaining({ p_order: "ceyo_plan_1" }));
  });

  it("reads the saved card from the fields Kashier returns", () => {
    expect(savedCardFrom({ response: { paymentMethod: { card: { cardToken: "t2", number: "5123********9876" } } } })).toEqual({ token: "t2", agreement: "", masked: "5123********9876" });
  });

  it("asks Kashier to save the card only for the trial card check", () => {
    const base = { orderId: "o", merchantId: "m", amount: 1, currency: "EGP", redirect: "r", webhookUrl: "w" };
    const card = { number: "4111111111111111", name: "A B", exp: "12/30", cvv: "123" };
    expect((kashierCardPayload({ ...base, saveCard: true }, card, "u", "d").paymentMethod.card as Record<string, unknown>).save).toBe(true);
    expect((kashierCardPayload(base, card, "u", "d").paymentMethod.card as Record<string, unknown>).save).toBeUndefined();
  });
});
