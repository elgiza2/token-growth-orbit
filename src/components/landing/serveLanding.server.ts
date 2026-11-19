import { buildLandingHtml, type LandingOptions } from "./buildLanding";
import { webAppUrl } from "@/config/domains";
import { COUNTRIES, PAGE_LANGS } from "./localePages";
import type { PageLang as LandingLang } from "./localePages";
import { COUNTRY_PAGES } from "@/components/countries/list";

/** Full HTML response for a public marketing page, rendered on the server so search engines read it. */
export function landingResponse(request: Request, opts: { lang: LandingLang; mode?: "home" | "pricing"; countryCode?: string }): Response {
  const url = new URL(request.url);
  const fwd = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
  const host = fwd || url.host;
  const origin = fwd ? `https://${fwd}` : url.origin;
  const ref = url.searchParams.get("ref");
  const country = opts.countryCode ? COUNTRIES.find((c) => c.code === opts.countryCode) : undefined;
  const suffix = country ? `/${country.code}` : opts.mode === "pricing" ? "/pricing" : "";
  const path = `/${opts.lang}${suffix}`;
  const alternates = PAGE_LANGS.map((l) => ({ hreflang: country ? `${l}-${country.code.toUpperCase()}` : l, path: `/${l}${suffix}` }));
  alternates.push({ hreflang: "x-default", path: `/en${suffix}` });
  const o: LandingOptions = {
    lang: opts.lang, mode: opts.mode, country,
    appLink: (p) => {
      const withRef = ref && /^[a-z0-9_-]{1,32}$/i.test(ref) ? `${p}${p.includes("?") ? "&" : "?"}ref=${ref}` : p;
      return webAppUrl(host, origin, withRef);
    },
    seo: { origin, path, alternates },
  };
  return new Response(buildLandingHtml(o), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}

/** /<lang>/pricing, or an old /<lang>/<country> link (permanent redirect to the country page); unknown countries get a 404. */
export function localePageResponse(request: Request, lang: LandingLang, segment: string): Response {
  if (segment === "pricing") return landingResponse(request, { lang, mode: "pricing" });
  const page = COUNTRY_PAGES.find((c) => c.code === segment.toLowerCase());
  if (!page) return new Response("Not found", { status: 404 });
  const url = new URL(request.url);
  const fwd = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
  return Response.redirect(`${fwd ? `https://${fwd}` : url.origin}/countries/${page.slug}${url.search}`, 301);
}

/** Best page language from the browser's Accept-Language header (English by default). */
export function langFromRequest(request: Request): LandingLang {
  const wanted = (request.headers.get("accept-language") || "").toLowerCase().split(",").map((s) => s.trim().slice(0, 2));
  return (wanted.find((l) => (PAGE_LANGS as readonly string[]).includes(l)) as LandingLang) || "en";
}
