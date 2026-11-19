/** Serves /countries/<slug>: loads that country's copy and renders it with one of seven designs (neighbours in the list never share one). */
import { webAppUrl } from "@/config/domains";
import { footerPanels } from "./footerPanels";
import { LANG_NAMES, PAGE_LANGS } from "@/components/landing/localePages";
import { COUNTRY_PAGES } from "./list";
import { type CountryData, type Ctx, esc, pageHead, scriptFont } from "./shared";
import { halden } from "./designs/halden";
import { orvante } from "./designs/orvante";
import { evolve } from "./designs/evolve";
import { nectarline } from "./designs/nectarline";
import { petalyx } from "./designs/petalyx";
import { velia } from "./designs/velia";
import { tidewell } from "./designs/tidewell";

const DESIGNS = [halden, petalyx, orvante, velia, evolve, tidewell, nectarline];
const DATA = import.meta.glob<{ default: CountryData }>("./data/*.json");

/** Which design a country gets (by its place in the alphabetical list). */
export const designIndex = (code: string) => Math.max(0, COUNTRY_PAGES.findIndex((c) => c.code === code)) % DESIGNS.length;

function originOf(request: Request) {
  const url = new URL(request.url);
  const fwd = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
  return { url, host: fwd || url.host, origin: fwd ? `https://${fwd}` : url.origin };
}

function footerLinks(current: string, label: (k: string, f: string) => string) {
  return footerPanels({ current, labels: { world: label("countries", "SEO around the world"), compare: "Ceyo vs AI tools" }, langs: PAGE_LANGS.map((l) => ({ path: `/${l}`, label: LANG_NAMES[l] })) });
}

export async function countryPageResponse(request: Request, slug: string): Promise<Response> {
  const page = COUNTRY_PAGES.find((c) => c.slug === slug.toLowerCase() || c.code === slug.toLowerCase());
  if (!page) return new Response("Not found", { status: 404 });
  const { url, host, origin } = originOf(request);
  if (page.slug !== slug) return Response.redirect(`${origin}/countries/${page.slug}${url.search}`, 301);
  const load = DATA[`./data/${page.code}.json`];
  if (!load) return new Response("Not found", { status: 404 });
  const d = (await load()).default;
  const path = `/countries/${page.slug}`;
  const abs = (s: string) => (s.startsWith("/") ? origin + s : s);
  const data: CountryData = { ...d, images: d.images.map((i) => ({ ...i, src: abs(i.src) })) };
  const ref = url.searchParams.get("ref");
  const font = scriptFont(d.lang, d.code);
  const ctx: Ctx = {
    d: data,
    signup: (plan) => {
      const p = `/auth?mode=signup${plan ? `&plan=${plan}` : ""}${ref && /^[a-z0-9_-]{1,32}$/i.test(ref) ? `&ref=${ref}` : ""}`;
      return webAppUrl(host, origin, p);
    },
    head: pageHead(data, origin, path, font.family),
    script: font.stack,
    links: footerLinks(d.code, (k, f) => d.ui?.[k] || f),
  };
  const html = DESIGNS[designIndex(d.code)](ctx);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}

/** /countries: index of every country page, each in its own language. */
export function countriesIndexResponse(request: Request): Response {
  const { origin } = originOf(request);
  const items = COUNTRY_PAGES.map((c) => `<li><a href="/countries/${c.slug}" hreflang="${esc(c.lang)}"><b lang="${esc(c.lang)}">${esc(c.name)}</b><span>${esc(c.nameEn)}</span></a></li>`).join("");
  const t = "Ceyo around the world — personal AI agents in every country";
  const desc = `Ceyo pages for ${COUNTRY_PAGES.length} countries, each written in the local language: personal AI agents with their own cloud computer, browser and Telegram bot.`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${origin}/countries"><meta property="og:type" content="website"><meta property="og:title" content="${esc(t)}"><meta property="og:description" content="${esc(desc)}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.ico"><style>body{margin:0;font-family:system-ui,"Noto Sans",sans-serif;background:#0d0e10;color:#eee}main{max-width:1180px;margin:0 auto;padding:80px 24px}h1{font-size:clamp(32px,5vw,64px);letter-spacing:-.04em;margin:0 0 12px;font-weight:600}p{color:#9a9ca3;max-width:60ch;line-height:1.6}ul{list-style:none;padding:0;margin:40px 0 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}a{display:flex;flex-direction:column;gap:2px;padding:14px 16px;border-radius:14px;background:#17181c;color:inherit;text-decoration:none;transition:background .2s}a:hover{background:#22242a}span{font-size:12px;color:#8a8c93}</style></head><body><main><a href="/" style="display:inline;padding:0;background:none">← Ceyo</a><h1>Ceyo around the world</h1><p>${esc(desc)}</p><ul>${items}</ul></main></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
