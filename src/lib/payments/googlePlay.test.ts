import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn(async () => ({ data: true, error: null }));
const upsert = vi.fn(async () => ({ error: null }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc, from: () => ({ upsert }) } }));

const USER = "11111111-2222-3333-4444-555555555555";
const TOKEN = "purchase-token-abcdef";

async function serviceAccount() {
  const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const b64 = btoa(String.fromCharCode(...der)).replace(/(.{64})/g, "$1\n");
  return JSON.stringify({ client_email: "play@test.iam.gserviceaccount.com", private_key: `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----\n` });
}

function playApi(ack: string) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    calls.push(url);
    if (url.includes("oauth2.googleapis.com")) return Response.json({ access_token: "t" });
    if (url.includes("subscriptionsv2")) return Response.json({ subscriptionState: "SUBSCRIPTION_STATE_ACTIVE", acknowledgementState: ack, lineItems: [{ productId: "ceyo_plus_monthly" }], externalAccountIdentifiers: { obfuscatedExternalAccountId: USER } });
    if (url.endsWith(":acknowledge")) return new Response("{}", { status: 200 });
    return new Response("", { status: 404 });
  }));
  return calls;
}

describe("Google Play purchase confirmation", () => {
  beforeEach(async () => {
    vi.unstubAllGlobals(); rpc.mockClear(); upsert.mockClear();
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT = await serviceAccount();
    process.env.GOOGLE_PLAY_PACKAGE_NAME = "si.ceyo.app";
  });

  it("confirms an unconfirmed verified purchase with Google Play before activating the plan", async () => {
    const calls = playApi("ACKNOWLEDGEMENT_STATE_PENDING");
    const { verifyPlayPurchase } = await import("./googlePlay.server");
    await verifyPlayPurchase(USER, "plus", "monthly", TOKEN);
    expect(calls.some((u) => u.endsWith(`/purchases/subscriptions/ceyo_plus_monthly/tokens/${TOKEN}:acknowledge`))).toBe(true);
    expect(rpc).toHaveBeenCalledWith("settle_payment_order", expect.anything());
  });

  it("recovers an earlier purchase from its token alone and confirms it", async () => {
    const calls = playApi("ACKNOWLEDGEMENT_STATE_PENDING");
    const { restorePlayPurchase } = await import("./googlePlay.server");
    await restorePlayPurchase(USER, TOKEN);
    expect(calls.some((u) => u.endsWith(":acknowledge"))).toBe(true);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ tier: "plus", interval: "monthly", provider: "google_play" }), expect.anything());
  });

  it("does not confirm again when Google Play already shows it confirmed", async () => {
    const calls = playApi("ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED");
    const { verifyPlayPurchase } = await import("./googlePlay.server");
    await verifyPlayPurchase(USER, "plus", "monthly", TOKEN);
    expect(calls.some((u) => u.endsWith(":acknowledge"))).toBe(false);
  });

  it("refuses a purchase made for another account", async () => {
    playApi("ACKNOWLEDGEMENT_STATE_PENDING");
    const { restorePlayPurchase } = await import("./googlePlay.server");
    await expect(restorePlayPurchase("99999999-2222-3333-4444-555555555555", TOKEN)).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
});
