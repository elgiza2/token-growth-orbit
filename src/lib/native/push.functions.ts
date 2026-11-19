import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { PUSH_TOKEN_PATTERN } from "@/lib/ceyo/phonePush";

const input = z.object({ token: z.string().regex(PUSH_TOKEN_PATTERN), pkg: z.enum(["si.ceyo.app", "si.ceyo.app.trial"]) });

/** Remembers this phone for the signed-in user so finished replies can reach it while the app is closed. */
export const registerPushToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const { authenticate } = await import("@/lib/ceyo/auth.server");
    const { userId } = await authenticate(getRequest());
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // A token belongs to one phone; signing in with another account moves it to that account.
    const { error } = await supabaseAdmin.from("native_push_tokens").upsert(
      { token: data.token, user_id: userId, package: data.pkg, updated_at: new Date().toISOString() },
      { onConflict: "token" },
    );
    if (error) throw new Error("Could not save this phone for notifications");
    return { ok: true };
  });
