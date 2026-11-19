import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cleanRefCode } from "./rules";

/** Links the signed-in account to the marketer page it came from (once; the database ignores later changes). */
export const attributeReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => ({ code: cleanRefCode(d?.code) }))
  .handler(async ({ data, context }) => {
    if (!data.code) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { data: profile } = await db.from("profiles").select("referred_by").eq("id", context!.userId).maybeSingle();
    if (!profile || profile.referred_by) return { ok: !!profile?.referred_by };
    await db.from("profiles").update({ referred_by: data.code }).eq("id", context!.userId).is("referred_by", null);
    return { ok: true };
  });
