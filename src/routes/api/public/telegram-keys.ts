/** Telegram bot for the app's service keys (Cerebras / Browserbase / Composio / E2B).
 *  Only Telegram (verified by the webhook secret header) can call it, and only
 *  the configured owner account can add, list or remove keys. Keys go to the
 *  server-only `provider_api_keys` pool that the app reads at runtime.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";

export function telegramWebhookSecret(token: string) {
  return createHash("sha256").update(`megsy-keys:${token}`).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function telegramAdminIds(config: string | undefined): number[] {
  return (config ?? "").split(",").map((v) => v.trim()).filter((v) => /^[1-9]\d*$/.test(v)).map(Number).filter(Number.isSafeInteger);
}

type ProviderId = "cerebras" | "browserbase" | "composio" | "e2b" | "pexels" | "pixabay" | "apify" | "deepgram" | "cartesia" | "anam" | "telnyx";
const PROVIDERS: Record<ProviderId, { label: string; icon: string; use: string }> = {
  cerebras: { label: "Cerebras", icon: "🧠", use: "ذكاء اصطناعي — ردود الوكلاء" },
  browserbase: { label: "Browserbase", icon: "🌐", use: "كمبيوتر — تصفح الويب" },
  e2b: { label: "E2B", icon: "💻", use: "كمبيوتر — تشغيل الأكواد والملفات" },
  deepgram: { label: "Deepgram", icon: "🎙️", use: "صوت — تحويل الكلام لنص والمكالمات" },
  cartesia: { label: "Cartesia", icon: "🔊", use: "صوت — نطق الردود والتعليق الصوتي" },
  anam: { label: "Anam", icon: "🧑‍💻", use: "مكالمات الفيديو" },
  telnyx: { label: "Telnyx", icon: "📞", use: "مكالمات الهاتف" },
  composio: { label: "Composio", icon: "🔌", use: "أدوات — التكاملات الخارجية" },
  apify: { label: "Apify", icon: "🕷️", use: "أدوات — جمع البيانات من المواقع" },
  pexels: { label: "Pexels", icon: "🎬", use: "أدوات — صور ولقطات للمونتاج" },
  pixabay: { label: "Pixabay", icon: "🎞️", use: "أدوات — فيديوهات وصور مجانية" },
};
const IDS = Object.keys(PROVIDERS) as ProviderId[];

export function normalizeProvider(raw: string): ProviderId | null {
  const v = raw.trim().toLowerCase();
  if (v === "c") return "cerebras";
  if (v === "browser" || v === "b") return "browserbase";
  if (v === "x") return "composio";
  if (v === "computer") return "e2b";
  return (IDS as string[]).includes(v) ? (v as ProviderId) : null;
}

async function validateKey(p: ProviderId, key: string): Promise<boolean> {
  const checks: Partial<Record<ProviderId, () => Promise<Response>>> = {
    cerebras: () => fetch("https://api.cerebras.ai/v1/models", { headers: { Authorization: `Bearer ${key}` } }),
    browserbase: () => fetch("https://api.browserbase.com/v1/projects", { headers: { "X-BB-API-Key": key } }),
    pexels: () => fetch("https://api.pexels.com/v1/search?query=test&per_page=1", { headers: { Authorization: key } }),
    pixabay: () => fetch(`https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=test&per_page=3`),
    e2b: () => fetch("https://api.e2b.app/sandboxes", { headers: { "X-API-Key": key } }),
    composio: () => fetch("https://backend.composio.dev/api/v3/auth_configs?limit=1", { headers: { "x-api-key": key } }),
    apify: () => fetch(`https://api.apify.com/v2/users/me?token=${encodeURIComponent(key)}`),
    deepgram: () => fetch("https://api.deepgram.com/v1/projects", { headers: { Authorization: `Token ${key}` } }),
    cartesia: () => fetch("https://api.cartesia.ai/voices", { headers: { "X-API-Key": key, "Cartesia-Version": "2024-06-10" } }),
    telnyx: () => fetch("https://api.telnyx.com/v2/balance", { headers: { Authorization: `Bearer ${key}` } }),
  };
  const check = checks[p];
  if (!check) return true; // no public check endpoint; the pool's failover drops it if rejected
  try { return (await check()).ok; } catch { return false; }
}

const HELP = [
  "🛠 <b>لوحة الأدمن</b>",
  "",
  "/stats — إحصائيات الموقع كاملة",
  "/users — آخر المسجلين",
  "/payments — آخر المدفوعات",
  "/marketers — المسوقين وأرباحهم",
  "/keys — مفاتيح المزودين",
  "<code>/add_cerebras KEY</code> — إضافة مفتاح (أو اضغط على المزوّد)",
  "/del رقم — حذف مفتاح",
  "",
  "التطبيق بيوزع الطلبات على كل المفاتيح وبيبدّل تلقائيًا لو مفتاح وقف.",
].join("\n");

const menu = () => ({
  inline_keyboard: [
    [{ text: "📈 الإحصائيات", callback_data: "adm:stats" }, { text: "👥 المسجلين", callback_data: "adm:users" }],
    [{ text: "💰 المدفوعات", callback_data: "adm:payments" }, { text: "🤝 المسوقين", callback_data: "adm:marketers" }],
    [{ text: "📊 المفاتيح الحالية", callback_data: "keys:list" }],
    ...Array.from({ length: Math.ceil(IDS.length / 3) }, (_, i) =>
      IDS.slice(i * 3, i * 3 + 3).map((id) => ({ text: `${PROVIDERS[id].icon} ${PROVIDERS[id].label}`, callback_data: `keys:provider:${id}` }))),
  ],
});
const marketerMenu = () => ({ inline_keyboard: [[{ text: "📈 إحصائيات صفحتي", callback_data: "mk:stats" }, { text: "👥 المسجلين من صفحتي", callback_data: "mk:users" }]] });

const pendingProvider = new Map<number, ProviderId>();

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const esc = (v: unknown) => String(v ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
const dayAgo = () => new Date(Date.now() - 86_400_000).toISOString();

export const Route = createFileRoute("/api/public/telegram-keys")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getTelegramBotToken, telegramRequest } = await import("@/lib/keys/telegram.server");
        const { resolveOperator, marketerShare } = await import("@/lib/referrals/rules");
        const token = await getTelegramBotToken().catch(() => null);
        if (!token) return new Response("not configured", { status: 500 });
        const header = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(header, telegramWebhookSecret(token))) return new Response("Unauthorized", { status: 401 });

        const update = await request.json().catch(() => null);
        const tg = (method: string, body: unknown) => telegramRequest(token, method, body);
        const send = (chatId: number, text: string, markup?: unknown) =>
          tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, ...(markup ? { reply_markup: markup } : {}) }).catch((e) => console.error(e instanceof Error ? e.message : "Telegram send failed"));

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as any;

        const from = update?.callback_query?.from ?? update?.message?.from;
        const chat = update?.callback_query?.message?.chat ?? update?.message?.chat;
        const fromId = Number(from?.id);
        const chatId = Number(chat?.id);
        if (!chatId || !fromId) return Response.json({ ok: true });
        const { data: opRows } = await db.from("telegram_operators").select("username,role,marketer_code,chat_id");
        let op = resolveOperator(from?.username, opRows ?? []);
        // Numeric owner IDs from the environment remain admins (legacy setup).
        if (!op && telegramAdminIds(process.env.TELEGRAM_ADMIN_IDS).includes(fromId)) op = { role: "admin", code: null };
        if (update?.callback_query) await tg("answerCallbackQuery", { callback_query_id: update.callback_query.id }).catch(() => undefined);
        if (!op || chat?.type !== "private") {
          if (update?.message) await send(chatId, "غير مسموح.");
          return Response.json({ ok: true });
        }
        if (from?.username) {
          const uname = String(from.username).toLowerCase();
          const known = (opRows ?? []).find((r: any) => r.username.toLowerCase() === uname);
          if (known && Number(known.chat_id) !== chatId) await db.from("telegram_operators").update({ chat_id: chatId }).eq("username", known.username);
        }

        // ---------- shared stats ----------
        const refStats = async (code: string) => {
          const count = async (event: string, since?: string) => {
            let q = db.from("referral_events").select("id", { count: "exact", head: true }).eq("code", code).eq("event", event);
            if (since) q = q.gte("created_at", since);
            return (await q).count ?? 0;
          };
          const { data: pays } = await db.from("referral_events").select("amount,currency,usd_amount").eq("code", code).eq("event", "payment");
          const { data: m } = await db.from("referral_marketers").select("share_percent").eq("code", code).maybeSingle();
          const pct = Number(m?.share_percent ?? 50);
          const byCur: Record<string, number> = {};
          let usd = 0;
          for (const p of pays ?? []) { byCur[p.currency || "?"] = (byCur[p.currency || "?"] ?? 0) + Number(p.amount || 0); usd += Number(p.usd_amount || 0); }
          return { visits: await count("visit"), visitsToday: await count("visit", dayAgo()), signups: await count("signup"), signupsToday: await count("signup", dayAgo()), paid: (pays ?? []).length, byCur, usd, pct };
        };
        const refLines = (st: Awaited<ReturnType<typeof refStats>>) => {
          const cur = Object.entries(st.byCur);
          return [
            `👀 الزيارات: <b>${fmt(st.visits)}</b> (آخر 24 ساعة: ${fmt(st.visitsToday)})`,
            `👤 التسجيلات: <b>${fmt(st.signups)}</b> (آخر 24 ساعة: ${fmt(st.signupsToday)})`,
            `💳 الاشتراكات المدفوعة: <b>${fmt(st.paid)}</b>`,
            `💰 الإيراد: ${cur.length ? cur.map(([c, a]) => `${fmt(a)} ${esc(c)}`).join(" + ") : "0"}${st.usd ? ` (~$${fmt(st.usd)})` : ""}`,
            `🤝 النصيب ${fmt(st.pct)}%: <b>${cur.length ? cur.map(([c, a]) => `${fmt(marketerShare(a, st.pct))} ${esc(c)}`).join(" + ") : "0"}</b>${st.usd ? ` (~$${fmt(marketerShare(st.usd, st.pct))})` : ""}`,
          ];
        };
        const refUsers = async (code: string) => {
          const { data } = await db.from("profiles").select("display_name,username,created_at").eq("referred_by", code).order("created_at", { ascending: false }).limit(15);
          return data ?? [];
        };

        // ---------- marketer: only their own page ----------
        if (op.role === "marketer") {
          const code = op.code!;
          const data = String(update?.callback_query?.data ?? update?.message?.text ?? "");
          if (/users/.test(data)) {
            const rows = await refUsers(code);
            await send(chatId, ["👥 <b>آخر المسجلين من صفحتك</b>", "", ...(rows.length ? rows.map((r: any, i: number) => `${i + 1}. ${esc(r.display_name || r.username || "مستخدم")} — ${String(r.created_at).slice(0, 10)}`) : ["لسه مفيش"])].join("\n"), marketerMenu());
          } else {
            const st = await refStats(code);
            await send(chatId, [`📈 <b>إحصائيات صفحتك</b>`, `🔗 https://${esc(code)}.ceyo.app`, "", ...refLines(st), "", "هيوصلك إشعار هنا مع كل تسجيل أو اشتراك من صفحتك."].join("\n"), marketerMenu());
          }
          return Response.json({ ok: true });
        }

        // ---------- admin ----------
        const listKeys = async () => {
          const { data } = await db.from("provider_api_keys").select("id,provider,status,cooldown_until,failure_count,created_at").order("created_at", { ascending: true });
          return (data ?? []) as Array<{ id: string; provider: ProviderId; status: string; cooldown_until: string | null; failure_count: number }>;
        };
        const showKeys = async () => {
          const rows = await listKeys();
          const lines = ["📊 <b>المفاتيح الحالية</b>", ""];
          IDS.forEach((id) => {
            const mine = rows.filter((r) => r.provider === id);
            const live = mine.filter((r) => r.status === "active" && (!r.cooldown_until || new Date(r.cooldown_until) < new Date())).length;
            lines.push(`${PROVIDERS[id].icon} <b>${PROVIDERS[id].label}</b> — ${live}/${mine.length} شغال`);
          });
          lines.push("");
          rows.forEach((r, i) => {
            const state = r.status !== "active" ? "⛔" : r.cooldown_until && new Date(r.cooldown_until) > new Date() ? "⏳" : "✅";
            lines.push(`${i + 1}. ${state} ${PROVIDERS[r.provider]?.label ?? r.provider}`);
          });
          if (rows.length) lines.push("", "✅ شغال  ⏳ واقف مؤقتًا وبيرجع لوحده  ⛔ مرفوض", "للحذف: <code>/del رقم</code>");
          await send(chatId, lines.join("\n"), menu());
        };
        const addKey = async (p: ProviderId, key: string) => {
          if (key.length < 12 || /\s/.test(key)) return send(chatId, "ده مش شكل مفتاح صحيح ❌");
          await send(chatId, "⏳ بتأكد من المفتاح…");
          if (!(await validateKey(p, key))) return send(chatId, `المفتاح مرفوض من ${PROVIDERS[p].label} ❌`);
          const { error } = await db.from("provider_api_keys").upsert(
            { provider: p, api_key: key, status: "active", failure_count: 0, last_error: null, cooldown_until: null },
            { onConflict: "provider,api_key" },
          );
          if (error) return send(chatId, "حصلت مشكلة في الحفظ ❌");
          return send(chatId, `${PROVIDERS[p].icon} اتحفظ مفتاح ${PROVIDERS[p].label} ✅\nشغال فورًا وداخل في توزيع الحمل.`, menu());
        };
        const count = async (table: string, f?: (q: any) => any) => {
          let q = db.from(table).select("*", { count: "exact", head: true });
          if (f) q = f(q);
          return (await q).count ?? 0;
        };
        const showStats = async () => {
          const now = new Date().toISOString();
          const [users, users24, subs, paid, paid24, pending, bots, convs, msgs24] = await Promise.all([
            count("profiles"), count("profiles", (q) => q.gte("created_at", dayAgo())),
            count("subscriptions", (q) => q.gt("current_period_end", now)),
            count("payment_orders", (q) => q.eq("status", "paid")),
            count("payment_orders", (q) => q.eq("status", "paid").gte("updated_at", dayAgo())),
            count("payment_orders", (q) => q.eq("status", "pending")),
            count("bots"), count("conversations"), count("messages", (q) => q.gte("created_at", dayAgo())),
          ]);
          const { data: orders } = await db.from("payment_orders").select("usd_amount").eq("status", "paid");
          const usd = (orders ?? []).reduce((a: number, o: any) => a + Number(o.usd_amount || 0), 0);
          await send(chatId, [
            "📈 <b>إحصائيات الموقع</b>", "",
            `👤 المستخدمين: <b>${fmt(users)}</b> (+${fmt(users24)} آخر 24 ساعة)`,
            `💎 اشتراكات فعالة: <b>${fmt(subs)}</b>`,
            `💳 مدفوعات ناجحة: <b>${fmt(paid)}</b> (+${fmt(paid24)} آخر 24 ساعة) — معلقة: ${fmt(pending)}`,
            `💰 إجمالي الإيراد: <b>~$${fmt(usd)}</b>`,
            `🤖 البوتات: ${fmt(bots)} — المحادثات: ${fmt(convs)}`,
            `💬 رسائل آخر 24 ساعة: ${fmt(msgs24)}`,
          ].join("\n"), menu());
        };
        const showUsers = async () => {
          const { data } = await db.from("profiles").select("display_name,username,referred_by,created_at").order("created_at", { ascending: false }).limit(20);
          await send(chatId, ["👥 <b>آخر المسجلين</b>", "", ...(data ?? []).map((r: any, i: number) => `${i + 1}. ${esc(r.display_name || r.username || "مستخدم")}${r.referred_by ? ` 🔗${esc(r.referred_by)}` : ""} — ${String(r.created_at).slice(0, 10)}`)].join("\n"), menu());
        };
        const showPayments = async () => {
          const { data } = await db.from("payment_orders").select("tier,interval,amount,currency,status,provider,updated_at").order("updated_at", { ascending: false }).limit(20);
          const icon = (s: string) => (s === "paid" ? "✅" : s === "pending" ? "⏳" : "❌");
          await send(chatId, ["💰 <b>آخر المدفوعات</b>", "", ...((data ?? []).length ? data.map((r: any) => `${icon(r.status)} ${esc(r.tier)}/${esc(r.interval)} — ${fmt(Number(r.amount))} ${esc(r.currency)} (${esc(r.provider)}) ${String(r.updated_at).slice(0, 10)}`) : ["لسه مفيش"])].join("\n"), menu());
        };
        const showMarketers = async () => {
          const { data } = await db.from("referral_marketers").select("code,telegram_username");
          const parts = ["🤝 <b>المسوقين</b>"];
          for (const m of data ?? []) parts.push("", `<b>${esc(m.code)}</b> — @${esc(m.telegram_username)}`, `🔗 https://${esc(m.code)}.ceyo.app`, ...refLines(await refStats(m.code)));
          await send(chatId, parts.join("\n"), menu());
        };

        const callback = update?.callback_query;
        if (callback) {
          const data = String(callback?.data ?? "");
          if (data === "keys:list") await showKeys();
          else if (data === "adm:stats") await showStats();
          else if (data === "adm:users") await showUsers();
          else if (data === "adm:payments") await showPayments();
          else if (data === "adm:marketers") await showMarketers();
          const picked = data.startsWith("keys:provider:") ? normalizeProvider(data.slice(14)) : null;
          if (picked) {
            pendingProvider.set(fromId, picked);
            await send(chatId, `${PROVIDERS[picked].icon} <b>${PROVIDERS[picked].label}</b>\n${PROVIDERS[picked].use}\n\nابعت المفتاح دلوقتي كرسالة، أو:\n<code>/add_${picked} KEY</code>`);
          }
          return Response.json({ ok: true });
        }

        const msg = update?.message;
        const text = String(msg?.text ?? "").trim();
        if (!text) return Response.json({ ok: true });
        const dropMessage = () => tg("deleteMessage", { chat_id: chatId, message_id: msg.message_id }).catch(() => undefined);
        const add = text.match(/^\/add_([a-z0-9]+)(?:@\w+)?\s+(\S+)$/i);
        const del = text.match(/^\/del(?:@\w+)?\s+(\d+)$/i);
        if (add) {
          const p = normalizeProvider(add[1]);
          await dropMessage();
          if (!p) await send(chatId, "الخدمة دي مش معروفة.", menu());
          else await addKey(p, add[2]);
        } else if (del) {
          const rows = await listKeys();
          const row = rows[Number(del[1]) - 1];
          if (!row) await send(chatId, "الرقم ده مش موجود.");
          else {
            await db.from("provider_api_keys").delete().eq("id", row.id);
            await send(chatId, `اتحذف ${PROVIDERS[row.provider]?.label ?? row.provider} ✅`);
          }
        } else if (/^\/keys/i.test(text)) await showKeys();
        else if (/^\/stats/i.test(text)) await showStats();
        else if (/^\/users/i.test(text)) await showUsers();
        else if (/^\/payments/i.test(text)) await showPayments();
        else if (/^\/marketers/i.test(text)) await showMarketers();
        else if (!text.startsWith("/") && pendingProvider.has(fromId)) {
          const p = pendingProvider.get(fromId);
          pendingProvider.delete(fromId);
          await dropMessage();
          if (p) await addKey(p, text);
        } else {
          await send(chatId, HELP, menu());
        }
        return Response.json({ ok: true });
      },
    },
  },
});
