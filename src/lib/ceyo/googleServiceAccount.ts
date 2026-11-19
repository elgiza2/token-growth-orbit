/** Google service-account OAuth (JWT bearer grant) with WebCrypto only, so it runs on the Worker runtime.
 *  The service-account JSON is read from Supabase Vault by the caller and never leaves the server. */
export type ServiceAccount = { client_email: string; private_key: string; project_id: string; token_uri?: string };

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlText = (s: string) => b64url(new TextEncoder().encode(s));

export function parseServiceAccount(raw: string | null): ServiceAccount | null {
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    return sa?.client_email && sa?.private_key && sa?.project_id ? sa : null;
  } catch {
    return null;
  }
}

async function importKey(pem: string): Promise<CryptoKey> {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

const cache = new Map<string, { token: string; until: number }>();

export async function googleAccessToken(sa: ServiceAccount, scope: string): Promise<string> {
  const key = `${sa.client_email}|${scope}`;
  const hit = cache.get(key);
  if (hit && hit.until > Date.now() + 60_000) return hit.token;
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = sa.token_uri || "https://oauth2.googleapis.com/token";
  const unsigned = `${b64urlText(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64urlText(JSON.stringify({ iss: sa.client_email, scope, aud: tokenUri, iat: now, exp: now + 3600 }))}`;
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", await importKey(sa.private_key), new TextEncoder().encode(unsigned)));
  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64url(sig)}` }),
  });
  if (!res.ok) throw new Error(`Google sign-in failed [${res.status}]: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Google sign-in returned no access token");
  cache.set(key, { token: json.access_token, until: Date.now() + (json.expires_in ?? 3600) * 1000 });
  return json.access_token;
}
