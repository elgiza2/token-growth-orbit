/** Builds the full Ceyo landing document (same design everywhere): main page, pricing and language/country pages. */
import template from "./ceyo-landing.html?raw";
import orbCss from "@/styles/agent.css?raw";
import skyPainting from "@/assets/landing/sky-painting.jpg";
import { LANDING_COPY } from "./landingContent";
import type { PageLang as LandingLang } from "./localePages";
import { PLAN_PRICES } from "@/lib/payments/plans";
import { COUNTRIES, LANG_NAMES, PAGE_LANGS, countryName, type Country } from "./localePages";
import { LANDING_I18N } from "./landingI18n";

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

  // Crawlable links between every language and country page.
  if (o.seo) {
    const link = (path: string, label: string) => `<a href="${path}" target="_top">${esc(label)}</a>`;
    const langs = PAGE_LANGS.map((l) => link(`/${l}${o.country ? `/${o.country.code}` : ""}`, LANG_NAMES[l])).join("");
    const places = COUNTRIES.map((c) => link(`/${lang}/${c.code}`, countryName(c, lang, LANDING_I18N[lang]?.countries))).join("");
    const block = `<section class="section" id="places"><div class="wrap"><div class="center reveal"><h2>${esc(t.elsewhere)}</h2></div><nav class="locale-links" aria-label="${esc(t.elsewhere)}">${places}</nav><nav class="locale-links" aria-label="${esc(t.languages)}">${langs}</nav></div></section>`;
    html = html.replace("</main>", `${block}</main>`).replace("</style>", ".locale-links{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:24px}.locale-links a{padding:8px 14px;border-radius:999px;background:var(--soft);font-size:14px;color:var(--muted)}.locale-links a:hover{color:var(--ink)}</style>");
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
    head += `<link rel="canonical" href="${esc(abs(o.seo.path))}"><meta property="og:url" content="${esc(abs(o.seo.path))}">`;
    head += (o.seo.alternates || []).map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${esc(abs(a.path))}">`).join("");
    head += `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Ceyo", applicationCategory: "BusinessApplication", operatingSystem: "Web, Android", inLanguage: lang, description: desc, areaServed: o.country?.en, offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: PLAN_PRICES.plus.monthly, highPrice: PLAN_PRICES.ultra.monthly } }).replace(/</g, "\\u003c")}</script>`;
  }
  return html.replace("<title>Ceyo</title>", head);
}
