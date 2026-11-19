/** Full server-rendered HTML for /compare and /compare/<tool>, in the main landing page's look. */
import { TOOLS, FEATURE_LABELS, CEYO_FEATURES, type Tool } from "./tools";
import { PLAN_PRICES } from "@/lib/payments/plans";

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const CSS = `:root{--ink:oklch(.15 0 0);--muted:oklch(.5 0 0);--paper:oklch(1 0 0);--soft:oklch(.965 0 0);--line:oklch(.91 0 0);--on-ink:oklch(1 0 0)}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Geist,system-ui,sans-serif;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}h1,h2,h3,p{margin:0}.wrap{width:min(1080px,calc(100% - 40px));margin:0 auto}.nav{height:64px;display:flex;align-items:center;justify-content:space-between}.brand{font-size:19px;font-weight:600}.nav nav{display:flex;gap:22px;font-size:14px;color:var(--muted)}.hero{padding:72px 0 40px}.eyebrow{font-size:13px;color:var(--muted);letter-spacing:.04em;text-transform:uppercase}h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(44px,8vw,84px);line-height:1;margin:14px 0 18px}.lead{font-size:19px;line-height:1.55;color:var(--muted);max-width:680px}.btn{display:inline-flex;height:46px;align-items:center;padding:0 22px;border-radius:999px;background:var(--ink);color:var(--on-ink);font-weight:500;margin-top:26px}.btn.ghost{background:var(--soft);color:var(--ink);margin-left:8px}section{padding:44px 0;border-top:1px solid var(--line)}h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(32px,5vw,48px);margin-bottom:20px}table{width:100%;border-collapse:collapse;font-size:15px}th,td{padding:14px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-weight:500}td.c{text-align:center;width:120px}.yes{font-weight:600}.no{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.card{display:block;padding:20px;border-radius:18px;background:var(--soft)}.card h3{font-size:18px;font-weight:500;margin-bottom:6px}.card p,.two p{color:var(--muted);line-height:1.55;font-size:15px}.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}.two>div{padding:24px;border-radius:20px;background:var(--soft)}.two h3{font-size:20px;font-weight:500;margin-bottom:10px}details{border-bottom:1px solid var(--line);padding:16px 0}summary{cursor:pointer;font-weight:500;font-size:17px}details p{margin-top:10px;color:var(--muted);line-height:1.6}footer{padding:36px 0 60px;color:var(--muted);font-size:14px;border-top:1px solid var(--line)}footer .grid a{display:block;padding:4px 0}@media(max-width:700px){.two{grid-template-columns:1fr}.nav nav a:not(:last-child){display:none}td.c{width:70px}th,td{padding:12px 6px;font-size:14px}}`;

function shell(o: { origin: string; path: string; title: string; desc: string; body: string; ld: unknown[] }) {
  const url = o.origin + o.path;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}"><link rel="canonical" href="${esc(url)}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary_large_image"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Instrument+Serif&display=swap"><style>${CSS}</style>${o.ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, "\\u003c")}</script>`).join("")}</head><body><div class="wrap"><header class="nav"><a class="brand" href="/">Ceyo</a><nav><a href="/compare">Compare</a><a href="/pricing">Pricing</a></nav></header>${o.body}<footer><h3 style="color:var(--ink);font-weight:500;margin-bottom:12px">Ceyo vs other AI tools</h3><div class="grid">${TOOLS.map((t) => `<a href="/compare/${t.slug}">Ceyo vs ${esc(t.name)}</a>`).join("")}</div><p style="margin-top:24px">Comparisons describe each product's main public offering as of 2026 and may change. Product names belong to their owners.</p></footer></div></body></html>`;
}

const cta = `<a class="btn" href="/pricing">Start the 3-day free trial</a><a class="btn ghost" href="/compare">All comparisons</a>`;

export function comparePage(tool: Tool, origin: string): string {
  const title = `Ceyo vs ${tool.name} (2026): features, use cases and which to choose`;
  const desc = `Ceyo vs ${tool.name} compared side by side: ${tool.name} is a ${tool.kind} by ${tool.maker}; Ceyo gives you personal AI bots with their own cloud computer, browser, Telegram, voice calls and 1,000+ app connections.`;
  const rows = CEYO_FEATURES.map((f) => { const y = tool.has.includes(f); return `<tr><td>${esc(FEATURE_LABELS[f])}</td><td class="c yes">✓</td><td class="c ${y ? "yes" : "no"}">${y ? "✓" : "—"}</td></tr>`; }).join("");
  const missing = CEYO_FEATURES.filter((f) => !tool.has.includes(f)).map((f) => FEATURE_LABELS[f].toLowerCase());
  const faqs = [
    [`Is Ceyo a ${tool.name} alternative?`, `Yes, if you want more than a ${tool.kind}. ${tool.name} is strong for ${tool.bestFor}. Ceyo is built for work that keeps running: bots with their own cloud computer that browse, code, call and follow schedules for you.`],
    [`What can Ceyo do that ${tool.name} does not?`, missing.length ? `Out of the box, ${tool.name} does not focus on: ${missing.slice(0, 5).join("; ")}.` : `Both cover similar ground; Ceyo bundles everything in one place with personal bots.`],
    [`When should I choose ${tool.name}?`, `Choose ${tool.name} for ${tool.bestFor}. Choose Ceyo when you want bots that work for you around the clock across your apps and the web.`],
    ["How much does Ceyo cost?", `Plans start at $${PLAN_PRICES.plus.monthly}/month (Plus), with Pro at $${PLAN_PRICES.pro.monthly} and Ultra at $${PLAN_PRICES.ultra.monthly}. Every plan starts with a 3-day free trial with up to 1,000,000 tokens a day.`],
    ["Can I use both?", `Yes. Many people keep ${tool.name} for ${tool.bestFor} and use Ceyo bots for tasks that run in the background.`],
  ];
  const body = `<section class="hero" style="border:0"><p class="eyebrow">Comparison · ${esc(tool.kind)}</p><h1>Ceyo vs ${esc(tool.name)}</h1><p class="lead">${esc(tool.name)} by ${esc(tool.maker)}: ${esc(tool.about)} Ceyo gives you personal AI bots that each get a private cloud computer, so they keep working after you close the app.</p>${cta}</section>
<section><h2>The short answer</h2><div class="two"><div><h3>Pick ${esc(tool.name)} if…</h3><p>You mainly need ${esc(tool.bestFor)}.</p></div><div><h3>Pick Ceyo if…</h3><p>You want bots that browse websites, write and run code, call you, connect to your apps and repeat tasks on a schedule — 24/7, from the web or Telegram.</p></div></div></section>
<section><h2>Feature by feature</h2><table><thead><tr><th>Capability</th><th class="c">Ceyo</th><th class="c">${esc(tool.name)}</th></tr></thead><tbody>${rows}</tbody></table></section>
<section><h2>Pricing</h2><p class="lead">Ceyo: Plus $${PLAN_PRICES.plus.monthly}, Pro $${PLAN_PRICES.pro.monthly}, Ultra $${PLAN_PRICES.ultra.monthly} per month, each with a 3-day free trial (up to 1,000,000 tokens a day). Check ${esc(tool.maker)}'s website for ${esc(tool.name)}'s current prices.</p>${cta}</section>
<section><h2>Questions</h2>${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section>`;
  const ld = [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Compare", item: `${origin}/compare` }, { "@type": "ListItem", position: 2, name: `Ceyo vs ${tool.name}`, item: `${origin}/compare/${tool.slug}` }] },
  ];
  return shell({ origin, path: `/compare/${tool.slug}`, title, desc, body, ld });
}

export function compareIndex(origin: string): string {
  const body = `<section class="hero" style="border:0"><p class="eyebrow">Comparisons</p><h1>Ceyo vs every AI tool</h1><p class="lead">Honest side-by-side comparisons of Ceyo with ${TOOLS.length} popular AI assistants, coding agents, app builders and automation tools.</p>${cta}</section><section><div class="grid">${TOOLS.map((t) => `<a class="card" href="/compare/${t.slug}"><h3>Ceyo vs ${esc(t.name)}</h3><p>${esc(t.kind)} · ${esc(t.maker)}</p></a>`).join("")}</div></section>`;
  return shell({ origin, path: "/compare", title: "Ceyo vs ChatGPT, Claude Code, Manus and 27 more AI tools", desc: `Compare Ceyo with ${TOOLS.length} AI tools: ChatGPT, Claude Code, Gemini, Cursor, Manus, Devin, Perplexity and more.`, body, ld: [{ "@context": "https://schema.org", "@type": "ItemList", itemListElement: TOOLS.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${origin}/compare/${t.slug}`, name: `Ceyo vs ${t.name}` })) }] });
}

export function compareResponse(request: Request, slug?: string): Response {
  const url = new URL(request.url);
  const fwd = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
  const origin = fwd ? `https://${fwd}` : url.origin;
  let html: string;
  if (slug) { const t = TOOLS.find((x) => x.slug === slug); if (!t) return new Response("Not found", { status: 404 }); html = comparePage(t, origin); }
  else html = compareIndex(origin);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
