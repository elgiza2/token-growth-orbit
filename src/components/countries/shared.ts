/** Shared pieces for the per-country landing pages: types, escaping, SEO head, fonts, pricing data and footer. */
import { PLAN_PRICES } from "@/lib/payments/plans";

export type CountryData = {
  code: string; lang: string; name: string; nameEn: string; nameAr: string; city: string; dir: "ltr" | "rtl";
  flag: string[]; title: string; description: string; eyebrow: string; h1: string; accent: string; sub: string;
  audience: string; manifesto: string;
  uses: { t: string; d: string }[]; steps: { t: string; d: string }[];
  chapters: { k: string; t: string; d: string }[]; highlights: string[];
  faq: { q: string; a: string }[]; landmarks: { name: string; wiki: string }[];
  images: { src: string; alt: string }[];
  ui: Record<string, string>;
};

export type Ctx = {
  d: CountryData;
  /** Signup link into the web app (keeps the marketer ?ref). */
  signup: (plan?: string) => string;
  /** Full <head> extras: title, description, canonical, og, JSON-LD and fonts. */
  head: string;
  /** Font stack for the page's script, appended after the design's own font. */
  script: string;
  /** Footer link block: every country and every comparison. */
  links: string;
};

export const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
export const img = (d: CountryData, i: number) => d.images[i % Math.max(1, d.images.length)] ?? { src: "", alt: d.name };
export const ui = (d: CountryData, k: string, fallback: string) => d.ui?.[k] || fallback;

/** Wraps the accent words of the headline in <em>. */
export function headline(d: CountryData, tag = "em") {
  const h = esc(d.h1), a = esc(d.accent || "");
  return a && h.includes(a) ? h.replace(a, `<${tag}>${a}</${tag}>`) : h;
}

export const PLANS = (["plus", "pro", "ultra"] as const).map((tier) => ({ tier, name: tier[0].toUpperCase() + tier.slice(1), price: PLAN_PRICES[tier].monthly ?? 0, popular: tier === "pro" }));

/** Google font for scripts that Latin display fonts cannot draw. */
const SCRIPT_FONTS: Record<string, string> = {
  ar: "Noto Sans Arabic", fa: "Noto Sans Arabic", ur: "Noto Sans Arabic", he: "Noto Sans Hebrew", hi: "Noto Sans Devanagari", ne: "Noto Sans Devanagari",
  bn: "Noto Sans Bengali", ja: "Noto Sans JP", ko: "Noto Sans KR", th: "Noto Sans Thai", km: "Noto Sans Khmer", lo: "Noto Sans Lao", my: "Noto Sans Myanmar",
  si: "Noto Sans Sinhala", ka: "Noto Sans Georgian", hy: "Noto Sans Armenian", am: "Noto Sans Ethiopic",
};
export function scriptFont(lang: string, code: string): { family: string | null; stack: string } {
  const family = lang === "zh" ? (code === "tw" ? "Noto Sans TC" : "Noto Sans SC") : SCRIPT_FONTS[lang] ?? null;
  return { family, stack: `${family ? `"${family}",` : ""}"Noto Sans",system-ui,-apple-system,"Segoe UI",sans-serif` };
}
export const fontLink = (families: string[]) =>
  `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join("&")}&display=swap">`;

export function pageHead(d: CountryData, origin: string, path: string, scriptFamily: string | null) {
  const url = origin + path;
  const image = d.images[0]?.src;
  const ld = [
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Ceyo", applicationCategory: "BusinessApplication", operatingSystem: "Web, Android", url, inLanguage: d.lang, areaServed: { "@type": "Country", name: d.nameEn },
      description: d.description, offers: PLANS.map((p) => ({ "@type": "Offer", name: p.name, price: p.price, priceCurrency: "USD" })) },
    { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: d.lang, mainEntity: d.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ceyo", item: origin + "/" }, { "@type": "ListItem", position: 2, name: d.name, item: url }] },
  ];
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.title)}</title><meta name="description" content="${esc(d.description)}"><link rel="canonical" href="${esc(url)}"><link rel="alternate" hreflang="${esc(d.lang)}-${d.code.toUpperCase()}" href="${esc(url)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(d.title)}"><meta property="og:description" content="${esc(d.description)}"><meta property="og:url" content="${esc(url)}"><meta property="og:locale" content="${esc(d.lang)}_${d.code.toUpperCase()}">${image ? `<meta property="og:image" content="${esc(image)}"><meta name="twitter:image" content="${esc(image)}">` : ""}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(d.title)}"><meta name="twitter:description" content="${esc(d.description)}"><link rel="icon" href="/favicon.ico">${scriptFamily ? fontLink([scriptFamily.replace(/ /g, "+") + ":wght@400;500;600;700"]) : ""}<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
}

/** Splits text into word spans in the browser (Intl.Segmenter keeps Arabic, Thai and CJK shaping intact). */
export const SPLIT_JS = `function ceyoSplit(el,unit){var t=el.textContent;el.textContent='';var lang=document.documentElement.lang;var parts=[];try{var s=new Intl.Segmenter(lang,{granularity:unit==='char'&&!/^(ar|fa|ur|he|hi|ne|bn|th|km|lo|my|si|am)$/.test(lang)?'grapheme':'word'});for(var x of s.segment(t))parts.push(x.segment)}catch(e){parts=t.split(/(\\s+)/)}var out=[];parts.forEach(function(p){if(/^\\s+$/.test(p)){el.appendChild(document.createTextNode(p));return}var sp=document.createElement('span');sp.className='sx';sp.textContent=p;el.appendChild(sp);out.push(sp)});return out}`;

/** One reveal-on-scroll helper used by every design. */
export const REVEAL_JS = `(function(){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.15});document.querySelectorAll('.rv').forEach(function(el){io.observe(el)})})();`;

export const faqList = (d: CountryData, cls = "faq") =>
  `<div class="${cls}">${d.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>`;

export function doc(ctx: Ctx, css: string, body: string, js = "") {
  const { d } = ctx;
  return `<!DOCTYPE html><html lang="${esc(d.lang)}" dir="${d.dir === "rtl" ? "rtl" : "ltr"}"><head>${ctx.head}<style>${css}</style></head><body>${body}<script>${SPLIT_JS}${REVEAL_JS}${js}</script></body></html>`;
}

/** Footer: every country (in its own language) and every comparison page. */
export function footer(ctx: Ctx, cls = "ft") {
  const { d } = ctx;
  return `<footer class="${cls}"><div class="ft-top"><a class="ft-brand" href="/">Ceyo</a><nav><a href="#uses">${esc(ui(d, "features", "Features"))}</a><a href="#pricing">${esc(ui(d, "pricing", "Pricing"))}</a><a href="#faq">${esc(ui(d, "faq", "FAQ"))}</a><a href="/compare">${esc(ui(d, "compare", "Compare"))}</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav></div>${ctx.links}<p class="ft-c">© 2026 Ceyo · ${esc(ui(d, "rights", "All rights reserved"))}</p></footer>`;
}

const hexRgb = (h: string) => { const m = /^#?([0-9a-f]{6})$/i.exec((h || "").trim()); const n = m ? parseInt(m[1], 16) : 0x5b7cf0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = (h: string) => { const [r, g, b] = hexRgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
/** Mixes two hex colours (t = share of b). */
export function mix(a: string, b: string, t: number) {
  const x = hexRgb(a), y = hexRgb(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
/** Most usable flag colour: skips near-white/near-black. */
export function flagAccent(d: CountryData, fallback = "#5b7cf0") {
  const ok = (d.flag || []).filter((c) => /^#?[0-9a-f]{6}$/i.test(c?.trim?.() ?? "") && lum(c) > 0.12 && lum(c) < 0.85);
  return { a: ok[0] ?? fallback, b: ok[1] ?? ok[0] ?? fallback };
}
