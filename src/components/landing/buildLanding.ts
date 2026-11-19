/** Builds the full Ceyo landing document (same design everywhere): main page, pricing and language/country pages. */
import template from "./ceyo-landing.html?raw";
import orbCss from "@/styles/agent.css?raw";
import skyPainting from "@/assets/landing/sky-painting.jpg";
import { LANDING_COPY } from "./landingContent";
import type { PageLang as LandingLang } from "./localePages";
import { PLAN_PRICES } from "@/lib/payments/plans";
import { COUNTRIES, LANG_NAMES, PAGE_LANGS, countryName, type Country } from "./localePages";
import { LANDING_I18N } from "./landingI18n";
import { COUNTRY_PROFILES } from "./countryProfiles";

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const orb = (color: string, size: number, state = "idle") => `<span class="o" data-c="${color}" data-s="${size}" data-st="${state}"></span>`;

export type LandingOptions = {
  lang: LandingLang;
  /** Builds a link into the web app for a path like /auth?mode=signup. */
  appLink: (path: string) => string;
  mode?: "home" | "pricing";
  country?: Country;
  /** SEO head for crawlable pages; omitted inside the app's preview frame. */
  seo?: { origin: string; path: string; alternates?: { hreflang: string; path: string }[] };
};

type Extra = Record<string, string>;
export const LANDING_EXTRA: Record<string, Extra> = {
  en: {
    plansTitle: "Plans for your next project",
    plansBody: "Every plan starts with a 3-day free trial: up to 1,000,000 tokens a day. Link a card to start; your plan is charged only when the trial ends, unless you cancel.",
    note: "Prices in USD. Local currency and payment methods are shown at checkout. Annual billing is available for Plus only.",
    month: "/month", yearly: "or ${p}/year, billed annually", monthly: "Billed monthly",
    choose: "Start 3-day free trial", trial: "3-day free trial",
    pricingEyebrow: "Plans and free trial", pricingBody: "See everything Ceyo bots can do and pick a plan. Try any plan free for 3 days.",
    inCountry: "Ceyo in {c}",
    countryBody: "Personal AI bots for people and teams in {c}. Each bot has its own cloud computer, browses the web, writes code and keeps working while your phone is off.",
    title: "Ceyo — Your Personal Bots and Group Chats", pricingTitle: "Ceyo Pricing — Plans and 3-day free trial",
    countryTitle: "Ceyo in {c} — Personal AI bots and agents",
    desc: "Ceyo personal bots work on complete projects with their own cloud computers, specialist teams, 1,000+ app connections and calls. 3-day free trial.",
    elsewhere: "Ceyo around the world", languages: "Languages", pricingMenu: "Pricing",
  },
  ar: {
    plansTitle: "باقات لمشروعك الجاي",
    plansBody: "كل باقة بتبدأ بتجربة مجانية 3 أيام: لحد مليون توكن في اليوم. اربط كارتك عشان تبدأ، والباقة بتتخصم بس لما التجربة تخلص، إلا لو لغيت.",
    note: "الأسعار بالدولار. العملة المحلية وطرق الدفع بتظهر وقت الدفع. الاشتراك السنوي متاح لباقة Plus بس.",
    month: "/شهريًا", yearly: "أو ${p} في السنة", monthly: "بيتجدد شهريًا",
    choose: "ابدأ التجربة المجانية 3 أيام", trial: "تجربة مجانية 3 أيام",
    pricingEyebrow: "الباقات والتجربة المجانية", pricingBody: "اتعرف على كل اللي روبوتات Ceyo تقدر تعمله واختار باقتك. جرّب أي باقة مجانًا 3 أيام.",
    inCountry: "Ceyo في {c}",
    countryBody: "روبوتات ذكاء اصطناعي شخصية للأفراد والفرق في {c}. كل روبوت ليه كمبيوتر سحابي خاص، بيتصفح النت ويكتب كود ويكمل شغله حتى وموبايلك مقفول.",
    title: "Ceyo — روبوتاتك الشخصية ومجموعاتك", pricingTitle: "أسعار Ceyo — الباقات والتجربة المجانية 3 أيام",
    countryTitle: "Ceyo في {c} — روبوتات ووكلاء ذكاء اصطناعي شخصية",
    desc: "روبوتات Ceyo الشخصية بتخلّص مشاريع كاملة بكمبيوتر سحابي لكل روبوت، وفرق متخصصة، وربط بأكتر من 1000 تطبيق ومكالمات. تجربة مجانية 3 أيام.",
    elsewhere: "Ceyo حول العالم", languages: "اللغات", pricingMenu: "الأسعار",
  },
};

const fill = (v: string, k: string, x: string | number) => v.split(`{${k}}`).join(String(x));

export function buildLandingHtml(o: LandingOptions): string {
  const { lang } = o;
  const t = LANDING_EXTRA[lang] ?? LANDING_I18N[lang]?.extra ?? LANDING_EXTRA.en;
  const ar = lang === "ar";
  const rtl = ar;
  const copy = LANDING_COPY[lang as "en" | "ar"] ?? LANDING_I18N[lang]?.copy ?? LANDING_COPY.en;
  const cname = o.country ? countryName(o.country, lang, LANDING_I18N[lang]?.countries) : "";
  const values: Record<string, string> = { ...copy.text, skyPainting, appUrl: o.appLink("/auth?mode=signup") };
  if (o.country) { values.heroEyebrow = fill(t.inCountry, "c", cname); values.heroBody = fill(t.countryBody, "c", cname); }
  if (o.mode === "pricing") { values.heroEyebrow = t.pricingEyebrow; values.heroBody = t.pricingBody; }

  const pricing = (["plus", "pro", "ultra"] as const).map((tier) => {
    const p = PLAN_PRICES[tier];
    const name = tier[0].toUpperCase() + tier.slice(1);
    const href = o.appLink(`/auth?mode=signup&plan=${tier}&interval=monthly`);
    return `<article class="price-plan"><h3>${name}</h3><p class="price">$${p.monthly}<span>${t.month}</span></p><p class="annual">${esc(t.trial)} · ${esc(p.yearly ? fill(t.yearly, "p", p.yearly) : t.monthly)}</p><a class="btn" href="${esc(href)}" target="_top">${esc(t.choose)}</a></article>`;
  }).join("");
  const rows = copy.rows.map((r) => `<article class="story-row reveal"><h3>${orb(r.color, 34, "hello")}${esc(r.title)}</h3><div><p>${esc(r.body)}</p></div></article>`).join("");
  const colors = ["aurora", "ocean", "mint", "ember", "sun", "rose"];
  const faqs = copy.faqs.map((f, i) => `<details name="faq"><summary>${orb(colors[i % colors.length], 26)}<span class="q">${esc(f.q)}</span></summary><p>${esc(f.a)}</p></details>`).join("");

  let html = template
    .replace("Plans for your next project", esc(t.plansTitle))
    .replace("Choose an active subscription to start working with Ceyo. There is no free usage.", esc(t.plansBody))
    .replace(/Prices in USD\. Available checkout methods[^<]*/, esc(t.note))
    .replace('<a href="#pricing">Pricing</a>', `<a href="#pricing">${esc(t.pricingMenu)}</a>`);

  // Pricing page: plans come right after the hero.
  if (o.mode === "pricing") {
    const m = html.match(/<section class="section band" id="pricing">[\s\S]*?<\/section>\n?/);
    if (m) html = html.replace(m[0], "").replace('<section class="triptych"', `${m[0]}<section class="triptych"`);
  }

  // Country page: landmark photo + local audience and use cases.
  const prof = o.country ? COUNTRY_PROFILES[o.country.code] : undefined;
  if (prof) {
    const L = ar ? prof.ar : prof.en;
    const h = ar ? `Ceyo لـ${L.who} في ${cname}` : `Ceyo for ${L.who.toLowerCase()} in ${cname}`;
    const uses = L.uses.map((u, i) => `<li>${orb(colors[i % colors.length], 26)}<span>${esc(u)}</span></li>`).join("");
    const sec = `<section class="section" id="local"><div class="wrap local-grid reveal"><figure class="local-photo"><img src="${esc(prof.img)}" alt="${esc(prof.place)}, ${esc(cname)}" width="1200" height="630" loading="eager"><figcaption>${esc(prof.place)} · ${esc(L.city)}</figcaption></figure><div><h2>${esc(h)}</h2><ul class="local-uses">${uses}</ul><a class="btn" href="${esc(o.appLink("/auth?mode=signup"))}" target="_top">${esc(values.startCta ?? "Start")}</a></div></div></section>`;
    html = html.replace('<section class="triptych"', `${sec}<section class="triptych"`);
  }

  // Crawlable links between every language and country page.
  if (o.seo) {
    const link = (path: string, label: string) => `<a href="${path}" target="_top">${esc(label)}</a>`;
    const langs = PAGE_LANGS.map((l) => link(`/${l}${o.country ? `/${o.country.code}` : ""}`, LANG_NAMES[l])).join("");
    const places = `<div class="place-cards">${COUNTRIES.map((c) => { const p = COUNTRY_PROFILES[c.code]; const n = countryName(c, lang, LANDING_I18N[lang]?.countries); return `<a class="place-card" href="/${lang}/${c.code}" target="_top"><img src="${esc(p?.img ?? "")}" alt="${esc(p?.place ?? n)}" loading="lazy" width="1200" height="630"><span>${esc(n)}</span></a>`; }).join("")}</div>`;
    const block = `<section class="section" id="places"><div class="wrap"><div class="center reveal"><h2>${esc(t.elsewhere)}</h2></div>${places}<nav class="locale-links" aria-label="${esc(t.languages)}">${langs}</nav></div></section>`;
    html = html.replace("</main>", `${block}</main>`).replace("</style>", ".locale-links{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:24px}.locale-links a{padding:8px 14px;border-radius:999px;background:var(--soft);font-size:14px;color:var(--muted)}.locale-links a:hover{color:var(--ink)}.place-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:24px}.place-card{position:relative;display:block;border-radius:18px;overflow:hidden;aspect-ratio:4/3;background:var(--soft)}.place-card img{width:100%;height:100%;object-fit:cover;transition:transform .5s}.place-card:hover img{transform:scale(1.06)}.place-card span{position:absolute;inset:auto 0 0;padding:28px 12px 10px;font-size:14px;font-weight:600;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.65))}.local-grid{display:grid;gap:32px;align-items:center}@media(min-width:860px){.local-grid{grid-template-columns:1.1fr 1fr}}.local-photo{margin:0;border-radius:24px;overflow:hidden;background:var(--soft)}.local-photo img{width:100%;height:auto;display:block}.local-photo figcaption{padding:10px 14px;font-size:13px;color:var(--muted)}.local-uses{list-style:none;padding:0;margin:20px 0 24px;display:grid;gap:12px}.local-uses li{display:flex;gap:12px;align-items:center;font-size:17px}</style>");
  }

  html = html
    .replace("{{orbCss}}", `<style>${orbCss}</style>`)
    .replace("{{storyRows}}", rows).replace("{{pricingRows}}", pricing).replace("{{faqRows}}", faqs)
    .replace(/\{\{(\w+)\}\}/g, (_, k: string) => esc(values[k] ?? ""))
    .replace('<html lang="en">', `<html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}">`)
    .replace("</head>", ar ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600&amp;display=swap"></head>' : "</head>");

  const title = o.country ? fill(t.countryTitle, "c", cname) : o.mode === "pricing" ? t.pricingTitle : t.title;
  const desc = o.country ? fill(t.countryBody, "c", cname) : o.mode === "pricing" ? t.pricingBody : t.desc;
  let head = `<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image">`;
  if (o.seo) {
    const abs = (p: string) => `${o.seo!.origin}${p}`;
    if (prof) { const im = abs(prof.img); head = head.replace('<meta name="twitter:card"', `<meta property="og:image" content="${esc(im)}"><meta name="twitter:image" content="${esc(im)}"><meta name="twitter:card"`); }
    head += `<link rel="canonical" href="${esc(abs(o.seo.path))}"><meta property="og:url" content="${esc(abs(o.seo.path))}">`;
    head += (o.seo.alternates || []).map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${esc(abs(a.path))}">`).join("");
    head += `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Ceyo", applicationCategory: "BusinessApplication", operatingSystem: "Web, Android", inLanguage: lang, description: desc, areaServed: o.country?.en, offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: PLAN_PRICES.plus.monthly, highPrice: PLAN_PRICES.ultra.monthly } }).replace(/</g, "\\u003c")}</script>`;
  }
  return html.replace("<title>Ceyo</title>", head);
}
