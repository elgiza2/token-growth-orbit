/** Public: counts a visit to a marketer landing page. Accepts only known marketer codes. */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/ref-visit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { cleanRefCode } = await import("@/lib/referrals/rules");
        const body = await request.json().catch(() => null);
        const code = cleanRefCode(body?.code);
        if (!code) return Response.json({ ok: false }, { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as any;
        const { data: m } = await db.from("referral_marketers").select("code").eq("code", code).maybeSingle();
        if (!m) return Response.json({ ok: false }, { status: 404 });
        await db.from("referral_events").insert({ code, event: "visit" });
        return Response.json({ ok: true });
      },
    },
  },
});
