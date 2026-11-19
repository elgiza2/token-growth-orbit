import { TOOLS } from "@/components/compare/tools";
import { COUNTRY_PAGES } from "@/components/countries/list";
/** Browser-safe list of public language pages (/<lang>). COUNTRIES only backs old /<lang>/<country> links, which redirect to /countries/<slug>. */
export const PAGE_LANGS = ["en", "ar", "es", "fr", "de", "pt", "ru", "tr", "hi", "zh"] as const;
export type PageLang = (typeof PAGE_LANGS)[number];
export const LANG_NAMES: Record<PageLang, string> = { en: "English", ar: "العربية", es: "Español", fr: "Français", de: "Deutsch", pt: "Português", ru: "Русский", tr: "Türkçe", hi: "हिन्दी", zh: "中文" };
export type Country = { code: string; ar: string; en: string } & Partial<Record<PageLang, string>>;

export const COUNTRIES: Country[] = [
  { code: "eg", ar: "مصر", en: "Egypt" }, { code: "sa", ar: "السعودية", en: "Saudi Arabia" },
  { code: "ae", ar: "الإمارات", en: "the UAE" }, { code: "kw", ar: "الكويت", en: "Kuwait" },
  { code: "qa", ar: "قطر", en: "Qatar" }, { code: "bh", ar: "البحرين", en: "Bahrain" },
  { code: "om", ar: "عُمان", en: "Oman" }, { code: "jo", ar: "الأردن", en: "Jordan" },
  { code: "lb", ar: "لبنان", en: "Lebanon" }, { code: "iq", ar: "العراق", en: "Iraq" },
  { code: "ma", ar: "المغرب", en: "Morocco" }, { code: "dz", ar: "الجزائر", en: "Algeria" },
  { code: "tn", ar: "تونس", en: "Tunisia" }, { code: "ly", ar: "ليبيا", en: "Libya" },
  { code: "us", ar: "أمريكا", en: "the United States" }, { code: "gb", ar: "بريطانيا", en: "the United Kingdom" },
  { code: "ca", ar: "كندا", en: "Canada" }, { code: "au", ar: "أستراليا", en: "Australia" },
  { code: "de", ar: "ألمانيا", en: "Germany" }, { code: "fr", ar: "فرنسا", en: "France" },
  { code: "tr", ar: "تركيا", en: "Turkey" }, { code: "in", ar: "الهند", en: "India" },
];

export const country = (code: string) => COUNTRIES.find((c) => c.code === code.toLowerCase());
export const isPageLang = (v: string): v is PageLang => (PAGE_LANGS as readonly string[]).includes(v);
export const countryName = (c: Country, l: PageLang, extra?: Record<string, string>) => c[l] ?? extra?.[c.code] ?? c.en;

/** Every public marketing path, for the sitemap. Country pages live once each at /countries/<slug> in their own language. */
export function marketingPaths(): string[] {
  return ["/", "/pricing", "/compare", ...TOOLS.map((t) => `/compare/${t.slug}`), ...PAGE_LANGS.flatMap((l) => [`/${l}`, `/${l}/pricing`]), "/countries", ...COUNTRY_PAGES.map((c) => `/countries/${c.slug}`)];
}
