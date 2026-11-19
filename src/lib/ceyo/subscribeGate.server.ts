import type { SupabaseClient } from "@supabase/supabase-js";
import type { UsageStatus } from "./usage.server";
import { subscribeGatePrompt, subscribeGateFallback } from "./subscribeGate";

/** Account has no plan/trial: the model reads the account status and replies kindly, with no tools and no charge. */
export async function subscribeGateReply(db: SupabaseClient, userId: string, conv: { id: string; bot_id: string | null }, status: UsageStatus): Promise<Response> {
  const { data: rows } = await db.from("messages").select("role,content").eq("conversation_id", conv.id).order("created_at", { ascending: false }).limit(6);
  const history = (rows || []).reverse().filter((m) => m.role === "user" || m.role === "assistant").map((m) => ({ role: m.role as "user" | "assistant", content: String(m.content || "").slice(0, 2000) }));
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content || "";
  let text = "";
  try {
    const { generateCerebrasChatCompletion } = await import("./cerebrasCompletion.server");
    const out = await generateCerebrasChatCompletion([{ role: "system", content: subscribeGatePrompt(status) }, ...history], AbortSignal.timeout(20000));
    text = (out.choices?.[0]?.message?.content || "").trim();
  } catch { /* fallback below */ }
  if (!text) text = subscribeGateFallback(lastUser);
  const id = crypto.randomUUID();
  await db.from("messages").insert({ id, conversation_id: conv.id, user_id: userId, bot_id: conv.bot_id, role: "assistant", content: text, metadata: { subscribeGate: true } as never });
  await db.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conv.id);
  const events = [
    { id: `${id}-run`, type: "session.status_running" },
    { id, type: "agent.message", parts: [{ type: "text", text, stream_id: id }] },
    { id: `${id}-idle`, type: "session.status_idle", stop_reason: { type: "end_turn" } },
  ];
  return new Response(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""), { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" } });
}
