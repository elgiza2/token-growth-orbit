/** Sends high-priority data pushes to the user's Ceyo Android phones through FCM HTTP v1.
 *  The Firebase service account lives in Supabase Vault (CEYO_FCM_SERVICE_ACCOUNT); device
 *  tokens live in the service-only native_push_tokens table. Never throws: a failed push must
 *  not fail the task that produced the reply. */
import { runtimeCredential } from "./runtimeCredentials.server";
import { googleAccessToken, parseServiceAccount } from "./googleServiceAccount";
import { pushPayload, type PhonePush } from "./phonePush";

export async function sendPhonePush(userId: string, push: PhonePush): Promise<number> {
  try {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await db.from("native_push_tokens").select("token").eq("user_id", userId).limit(10);
    if (!rows?.length) return 0;
    const sa = parseServiceAccount(await runtimeCredential("CEYO_FCM_SERVICE_ACCOUNT"));
    if (!sa) { console.error("Phone push skipped: Firebase service account is not configured"); return 0; }
    const access = await googleAccessToken(sa, "https://www.googleapis.com/auth/firebase.messaging");
    const data = pushPayload(push);
    let sent = 0;
    for (const { token } of rows) {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: { token, data, android: { priority: "HIGH", ttl: "3600s" } } }),
      });
      if (res.ok) { sent++; continue; }
      const body = await res.text();
      // Stale tokens (app uninstalled / data cleared) are removed instead of retried.
      if (res.status === 404 || /UNREGISTERED|registration-token-not-registered/.test(body)) await db.from("native_push_tokens").delete().eq("token", token);
      else console.error(`Phone push failed [${res.status}]: ${body.slice(0, 300)}`);
    }
    return sent;
  } catch (e) {
    console.error("Phone push failed:", e instanceof Error ? e.message : "unknown error");
    return 0;
  }
}
